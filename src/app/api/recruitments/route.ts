import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import {
  getRecruitmentStatusLabel,
  isRecruitmentStatus,
} from "@/lib/recruitment-flow";
import {
  ACTIVE_RECRUITMENT_STATUSES,
  detectDuplicateRecruitmentGroups,
} from "@/lib/data-quality-hardening";

interface CreateRecruitmentPayload {
  candidateName: string;
  position: string;
  appliedDate?: string | null;
  phone?: string | null;
  email?: string | null;
  nationality?: string | null;
  notes?: string | null;
}

type CreatedRecruitmentRecord = {
  id: string;
  crewId: string;
  recruiterId: string;
  recruitmentDate: Date;
  status: string;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  crew: {
    id: string;
    fullName: string | null;
    rank: string | null;
    phone: string | null;
    email: string | null;
    nationality: string | null;
    status: string;
  };
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isCreateRecruitmentPayload(value: unknown): value is CreateRecruitmentPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<CreateRecruitmentPayload>;
  return (
    typeof payload.candidateName === "string" &&
    payload.candidateName.trim().length > 0 &&
    typeof payload.position === "string" &&
    payload.position.trim().length > 0
  );
}

function parseAppliedDate(value: string | null | undefined) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check crewing permission for recruitments access
    if (!checkPermission(session, 'crewing', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const recruitments = await prisma.recruitment.findMany({
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            phone: true,
            email: true,
            nationality: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      recruitments.map((recruitment) => {
        const status = isRecruitmentStatus(recruitment.status) ? recruitment.status : "APPLICANT";
        return {
          id: recruitment.id,
          crewId: recruitment.crewId,
          candidateName: recruitment.crew.fullName,
          position: recruitment.crew.rank,
          appliedDate: recruitment.recruitmentDate,
          phone: recruitment.crew.phone,
          email: recruitment.crew.email,
          nationality: recruitment.crew.nationality,
          status,
          statusLabel: getRecruitmentStatusLabel(status),
          notes: recruitment.remarks,
          isCrewReady: status === "HIRED",
          createdAt: recruitment.createdAt,
          updatedAt: recruitment.updatedAt,
        };
      })
    );
  } catch (error) {
    console.error("Error fetching recruitments:", error);
    return NextResponse.json(
      { error: "Failed to fetch recruitments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check crewing permission for recruitments editing
    if (!checkPermission(session, 'crewing', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    if (!isCreateRecruitmentPayload(body)) {
      return NextResponse.json({ error: "Candidate name and position are required" }, { status: 400 });
    }

    const candidateName = body.candidateName.trim();
    const position = body.position.trim();
    const appliedDate = parseAppliedDate(body.appliedDate);
    const notes = normalizeOptionalString(body.notes);
    const normalizedEmail = normalizeOptionalString(body.email)?.toLowerCase() ?? null;
    const normalizedPhone = normalizeOptionalString(body.phone);
    const duplicateWhere = [
      normalizedEmail
        ? {
            crew: {
              email: normalizedEmail,
            },
          }
        : null,
      normalizedPhone
        ? {
            crew: {
              phone: normalizedPhone,
            },
          }
        : null,
      {
        crew: {
          fullName: candidateName,
          rank: position,
        },
      },
    ].filter((value): value is NonNullable<typeof value> => value !== null);

    const activeRecruitmentCandidates = await prisma.recruitment.findMany({
      where: {
        status: {
          in: [...ACTIVE_RECRUITMENT_STATUSES],
        },
        OR: duplicateWhere,
      },
      select: {
        id: true,
        status: true,
        recruitmentDate: true,
        crew: {
          select: {
            fullName: true,
            rank: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const duplicateRecruitments = detectDuplicateRecruitmentGroups([
      ...activeRecruitmentCandidates,
      {
        id: "new-record",
        status: "APPLICANT",
        recruitmentDate: appliedDate,
        crew: {
          fullName: candidateName,
          rank: position,
          email: normalizedEmail,
          phone: normalizedPhone,
        },
      },
    ]);

    if (duplicateRecruitments.length > 0) {
      return NextResponse.json(
        {
          error: "A matching active recruitment workflow already exists for this candidate. Continue the existing candidate record instead of opening another intake.",
        },
        { status: 409 }
      );
    }

    const recruitment = await prisma.$transaction(async (tx): Promise<CreatedRecruitmentRecord> => {
      const crew = await tx.crew.create({
        data: {
          fullName: candidateName,
          rank: position,
          phone: normalizedPhone,
          email: normalizedEmail,
          nationality: normalizeOptionalString(body.nationality),
          status: "OFF_SIGNED",
          crewStatus: "AVAILABLE",
        },
      });

      const createdRecruitment = await tx.recruitment.create({
        data: {
          crewId: crew.id,
          recruiterId: session.user.id,
          recruitmentDate: appliedDate,
          status: "APPLICANT",
          remarks: notes,
        },
        include: {
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
              phone: true,
              email: true,
              nationality: true,
              status: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "RECRUITMENT_CREATED",
          entityType: "Recruitment",
          entityId: createdRecruitment.id,
          metadataJson: {
            crewId: createdRecruitment.crewId,
            candidateName: createdRecruitment.crew.fullName,
            position: createdRecruitment.crew.rank,
            status: createdRecruitment.status,
          },
        },
      });

      return createdRecruitment;
    });

    return NextResponse.json({
      id: recruitment.id,
      crewId: recruitment.crewId,
      candidateName: recruitment.crew.fullName,
      position: recruitment.crew.rank,
      appliedDate: recruitment.recruitmentDate,
      phone: recruitment.crew.phone,
      email: recruitment.crew.email,
      nationality: recruitment.crew.nationality,
      status: recruitment.status,
      statusLabel: getRecruitmentStatusLabel("APPLICANT"),
      notes: recruitment.remarks,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating recruitment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
