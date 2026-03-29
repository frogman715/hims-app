import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import {
  getAllowedRecruitmentActions,
  getNextRecruitmentStatus,
  getRecruitmentActionLabel,
  getRecruitmentStatusLabel,
  isRecruitmentStatus,
  type RecruitmentAction,
  type RecruitmentStatus,
} from "@/lib/recruitment-flow";

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecruitmentAction(value: unknown): value is RecruitmentAction {
  return value === "approve" || value === "reject" || value === "hire";
}

function serializeRecruitment(recruitment: {
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
}) {
  const status: RecruitmentStatus = isRecruitmentStatus(recruitment.status)
    ? recruitment.status
    : "APPLICANT";
  return {
    id: recruitment.id,
    crewId: recruitment.crewId,
    candidateName: recruitment.crew.fullName,
    position: recruitment.crew.rank,
    appliedDate: recruitment.recruitmentDate,
    recruiterId: recruitment.recruiterId,
    phone: recruitment.crew.phone,
    email: recruitment.crew.email,
    nationality: recruitment.crew.nationality,
    notes: recruitment.remarks,
    status,
    statusLabel: getRecruitmentStatusLabel(status),
    nextActionLabel: getRecruitmentActionLabel(status),
    allowedActions: getAllowedRecruitmentActions(status),
    isCrewReady: status === "HIRED",
    createdAt: recruitment.createdAt,
    updatedAt: recruitment.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, 'crewing', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const recruitmentId = id;

    const recruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
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

    if (!recruitment) {
      return NextResponse.json({ error: "Recruitment not found" }, { status: 404 });
    }

    return NextResponse.json(serializeRecruitment(recruitment));
  } catch (error) {
    console.error("Error fetching recruitment:", error);
    return NextResponse.json(
      { error: "Failed to fetch recruitment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, 'crewing', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const recruitmentId = id;
    const body = await request.json();
    const action = body?.action;

    if (!isRecruitmentAction(action)) {
      return NextResponse.json({ error: "Invalid recruitment action" }, { status: 400 });
    }

    const existingRecruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
      include: {
        crew: true,
      },
    });

    if (!existingRecruitment) {
      return NextResponse.json({ error: "Recruitment not found" }, { status: 404 });
    }

    const currentStatus: RecruitmentStatus = isRecruitmentStatus(existingRecruitment.status)
      ? existingRecruitment.status
      : "APPLICANT";

    if (!getAllowedRecruitmentActions(currentStatus).includes(action)) {
      return NextResponse.json(
        { error: `Invalid transition. ${getRecruitmentStatusLabel(currentStatus)} cannot use action "${action}".` },
        { status: 400 }
      );
    }

    const notes = normalizeOptionalString(body?.notes) ?? existingRecruitment.remarks;

    const recruitment = await prisma.$transaction(async (tx) => {
      let nextStatus: RecruitmentStatus;

      if (action === "reject") {
        nextStatus = "REJECTED";
      } else if (action === "hire") {
        nextStatus = "HIRED";
      } else {
        const candidateNextStatus = getNextRecruitmentStatus(currentStatus);
        if (!candidateNextStatus) {
          throw new Error("No next stage available for this candidate.");
        }
        nextStatus = candidateNextStatus;
      }

      const updatedRecruitment = await tx.recruitment.update({
        where: { id: recruitmentId },
        data: {
          status: nextStatus,
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

      if (nextStatus === "HIRED") {
        await tx.crew.update({
          where: { id: existingRecruitment.crewId },
          data: {
            status: "STANDBY",
            rank: updatedRecruitment.crew.rank ?? "UNASSIGNED",
            phone: updatedRecruitment.crew.phone,
            email: updatedRecruitment.crew.email,
            nationality: updatedRecruitment.crew.nationality,
          },
        });
      }

      if (nextStatus === "REJECTED") {
        await tx.crew.update({
          where: { id: existingRecruitment.crewId },
          data: {
            status: "OFF_SIGNED",
          },
        });
      }

      return updatedRecruitment;
    });

    return NextResponse.json(serializeRecruitment(recruitment));
  } catch (error) {
    console.error("Error updating recruitment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, 'crewing', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const recruitmentId = id;

    // Check if recruitment exists
    const existingRecruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
    });

    if (!existingRecruitment) {
      return NextResponse.json({ error: "Recruitment not found" }, { status: 404 });
    }

    if (existingRecruitment.status === "HIRED") {
      return NextResponse.json(
        { error: "Recruitment records are locked after Hired. Continue the workflow in the seafarer module." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.recruitment.update({
        where: { id: recruitmentId },
        data: {
          status: "REJECTED",
        },
      });

      await tx.crew.update({
        where: { id: existingRecruitment.crewId },
        data: {
          status: "OFF_SIGNED",
        },
      });
    });

    return NextResponse.json({ message: "Recruitment record closed as Rejected." });
  } catch (error) {
    console.error("Error deleting recruitment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
