import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, applicationsGuard, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";

// Define ApplicationStatus enum locally since it's not in Prisma schema
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

interface CreateApplicationPayload {
  crewId: string;
  position: string;
  vesselType?: string | null;
  principalId?: string | null;
  applicationDate?: string | null;
  remarks?: string | null;
}

const APPLICATION_STATUS_VALUES = new Set<ApplicationStatus>([
  ApplicationStatus.RECEIVED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.PASSED,
  ApplicationStatus.OFFERED,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.CANCELLED,
]);

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeOptionalString(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isCreateApplicationPayload(value: unknown): value is CreateApplicationPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<CreateApplicationPayload>;
  return (
    typeof payload.crewId === "string" &&
    payload.crewId.trim().length > 0 &&
    typeof payload.position === "string" &&
    payload.position.trim().length > 0 &&
    (payload.vesselType === undefined || payload.vesselType === null || typeof payload.vesselType === "string") &&
    (payload.principalId === undefined || payload.principalId === null || typeof payload.principalId === "string") &&
    (payload.applicationDate === undefined || payload.applicationDate === null || typeof payload.applicationDate === "string") &&
    (payload.remarks === undefined || payload.remarks === null || typeof payload.remarks === "string")
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check applications permission
    if (!applicationsGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const crewId = searchParams.get("crewId");
    const principalId = searchParams.get("principalId");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL" && APPLICATION_STATUS_VALUES.has(status as ApplicationStatus)) {
      where.status = status as ApplicationStatus;
    }
    if (crewId) {
      where.crewId = crewId;
    }
    if (principalId) {
      where.principalId = principalId;
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            rank: true,
            phone: true,
            email: true,
          }
        },
        principal: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        applicationDate: 'desc'
      }
    });

    return NextResponse.json({
      data: applications,
      total: applications.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check applications permission for editing
    if (!checkPermission(session, 'applications', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create applications" }, { status: 403 });
    }

    const payload = (await request.json()) as unknown;

    if (!isCreateApplicationPayload(payload)) {
      throw new ApiError(400, "Invalid application payload", "VALIDATION_ERROR");
    }

    const normalizedDate = parseDate(payload.applicationDate) ?? new Date();
    const normalizedVesselType = normalizeOptionalString(payload.vesselType ?? null);
    const normalizedPrincipalId = normalizeOptionalString(payload.principalId ?? null);
    const normalizedRemarks = normalizeOptionalString(payload.remarks ?? null);

    const application = await prisma.application.create({
      data: {
        crewId: payload.crewId.trim(),
        position: payload.position.trim(),
        vesselType: normalizedVesselType,
        principalId: normalizedPrincipalId,
        applicationDate: normalizedDate,
        status: ApplicationStatus.RECEIVED,
        remarks: normalizedRemarks,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            rank: true,
            phone: true,
            email: true,
          }
        },
        principal: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}