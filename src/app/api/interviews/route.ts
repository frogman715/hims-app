import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { ApplicationStatus, InterviewStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

interface CreateInterviewPayload {
  applicationId: string;
  scheduledDate?: string | null;
  interviewerName?: string | null;
  notes?: string | null;
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
    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const applicationId = searchParams.get("applicationId");

    const where: Prisma.InterviewWhereInput = {};
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

    const result = interviews.map((interview) => ({
      ...interview,
      application: interview.applicationId ? applicationMap.get(interview.applicationId) ?? null : null,
    }));

    return NextResponse.json({ data: result, total: result.length });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

// POST /api/interviews - Create new interview
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as Partial<CreateInterviewPayload>;
    const { applicationId, scheduledDate, notes } = body;

    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

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

    const interviewerId = session.user?.id;
    if (!interviewerId) {
      return NextResponse.json({ error: "Unable to determine interviewer" }, { status: 400 });
    }

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

    const enrichedInterview = {
      ...interview,
      application: {
        id: application.id,
        status: application.status,
        position: application.position,
        principal: application.principal,
      },
    };

    return NextResponse.json(enrichedInterview, { status: 201 });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
