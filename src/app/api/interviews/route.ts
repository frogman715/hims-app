import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { interviewCreateSchema } from "@/lib/crewing-ops-schemas";
import { handleApiError, ApiError } from "@/lib/error-handler";

enum ApplicationStatus {
  RECEIVED = "RECEIVED",
  REVIEWING = "REVIEWING",
  INTERVIEW = "INTERVIEW",
  PASSED = "PASSED",
  OFFERED = "OFFERED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW",
  PASSED = "PASSED",
  FAILED = "FAILED",
  RESCHEDULED = "RESCHEDULED",
  CANCELLED = "CANCELLED",
}

const validInterviewStatuses = new Set<InterviewStatus>([...Object.values(InterviewStatus)]);

function parseIsoDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// GET /api/interviews - Get all interviews with optional filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/interviews", "GET");
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const applicationId = searchParams.get("applicationId");

    const where: Record<string, unknown> = {};
    if (status && status.toUpperCase() !== "ALL") {
      const normalizedStatus = status.toUpperCase() as InterviewStatus;
      if (!validInterviewStatuses.has(normalizedStatus)) {
        return NextResponse.json({ error: "Invalid interview status" }, { status: 400 });
      }
      where.status = normalizedStatus;
    }
    if (applicationId) {
      where.applicationId = applicationId;
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            nationality: true,
            phone: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
    });

    const applicationIds = interviews
      .map((interview) => interview.applicationId)
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    const applications = applicationIds.length
      ? await prisma.application.findMany({
          where: { id: { in: applicationIds } },
          select: {
            id: true,
            position: true,
            status: true,
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
                nationality: true,
                phone: true,
              },
            },
            principal: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [];

    const applicationMap = new Map(applications.map((app) => [app.id, app]));

    const result = interviews.map((interview) => {
      const application = interview.applicationId ? applicationMap.get(interview.applicationId) ?? null : null;

      return {
        id: interview.id,
        applicationId: interview.applicationId,
        scheduledDate: interview.scheduledDate,
        conductedDate: interview.conductedDate,
        status: interview.status,
        interviewerName: interview.interviewer?.name ?? null,
        technicalScore: interview.technicalScore,
        attitudeScore: interview.attitudeScore,
        englishScore: interview.englishScore,
        recommendation: interview.recommendation,
        notes: interview.remarks,
        application: application
          ? {
              id: application.id,
              position: application.position,
              status: application.status,
              crew: application.crew,
              principal: application.principal,
            }
          : {
              id: interview.applicationId ?? interview.id,
              position: interview.crew.rank ?? "Not specified",
              status: null,
              crew: {
                id: interview.crew.id,
                fullName: interview.crew.fullName,
                rank: interview.crew.rank,
                nationality: interview.crew.nationality,
                phone: interview.crew.phone,
              },
              principal: null,
            },
      };
    });

    return NextResponse.json({ data: result, total: result.length });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/interviews - Create new interview
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/interviews", "POST");
    if (authError) {
      return authError;
    }

    if (!session.user?.id) {
      throw new ApiError(401, "Unauthorized", "AUTHENTICATION_ERROR");
    }

    const parsedBody = interviewCreateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid interview payload", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { applicationId, scheduledDate, notes } = parsedBody.data;
    const scheduledAt = parseIsoDate(typeof scheduledDate === "string" ? scheduledDate : null);
    const sanitizedNotes = typeof notes === "string" ? notes.trim() : null;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        position: true,
        crewId: true,
        principal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const interviewerId = session.user.id;

    const interview = await prisma.interview.create({
      data: {
        crewId: application.crewId,
        applicationId,
        interviewerId,
        scheduledDate: scheduledAt ?? new Date(),
        conductedDate: null,
        status: InterviewStatus.SCHEDULED,
        technicalScore: null,
        attitudeScore: null,
        englishScore: null,
        remarks: sanitizedNotes,
        recommendation: null,
        score: null,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update application status to INTERVIEW
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.INTERVIEW },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "INTERVIEW_CREATED",
        entityType: "Interview",
        entityId: interview.id,
        metadataJson: {
          applicationId,
          crewId: interview.crew.id,
          scheduledDate: interview.scheduledDate.toISOString(),
          status: interview.status,
        },
      },
    });

    const enrichedInterview = {
      id: interview.id,
      applicationId: interview.applicationId,
      scheduledDate: interview.scheduledDate,
      conductedDate: interview.conductedDate,
      status: interview.status,
      interviewerName: interview.interviewer?.name ?? null,
      technicalScore: interview.technicalScore,
      attitudeScore: interview.attitudeScore,
      englishScore: interview.englishScore,
      recommendation: interview.recommendation,
      notes: interview.remarks,
      application: {
        id: application.id,
        status: ApplicationStatus.INTERVIEW,
        position: application.position,
        crew: {
          id: interview.crew.id,
          fullName: interview.crew.fullName,
          rank: interview.crew.rank,
          nationality: null,
          phone: null,
        },
        principal: application.principal,
      },
    };

    return NextResponse.json(enrichedInterview, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
