import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ApiError, validateRequired } from "@/lib/error-handler";

enum ComplianceSystemType {
  ISO_9001 = "ISO_9001",
  ISO_14001 = "ISO_14001",
  ISO_45001 = "ISO_45001",
  OTHER = "OTHER",
}

enum ComplianceStatus {
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
}

/**
 * GET /api/external-compliance
 * Get all external compliance records with filtering
 */
export const GET = withPermission("compliance", PermissionLevel.VIEW_ACCESS, async (req) => {
  const { searchParams } = new URL(req.url);
  const crewId = searchParams.get("crewId");
  const systemType = searchParams.get("systemType") as ComplianceSystemType | null;
  const status = searchParams.get("status") as ComplianceStatus | null;

  const where: Record<string, unknown> = {};

  if (crewId) where.crewId = crewId;
  if (systemType) where.systemType = systemType as string;
  if (status) where.status = status as string;

  const compliances = await prisma.externalCompliance.findMany({
    where,
    include: {
      crew: {
        select: {
          id: true,
          fullName: true,
          rank: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: compliances, total: compliances.length });
});

/**
 * POST /api/external-compliance
 * Create new external compliance record
 */
interface CreateExternalCompliancePayload {
  crewId?: string;
  systemType?: string;
  certificateId?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  verificationUrl?: string | null;
  notes?: string | null;
}

export const POST = withPermission("compliance", PermissionLevel.EDIT_ACCESS, async (req) => {
  const body = (await req.json()) as CreateExternalCompliancePayload;

  const crewId = body.crewId;
  const systemTypeRaw = body.systemType;
  const certificateId = body.certificateId ?? null;
  const issueDate = body.issueDate ? new Date(body.issueDate) : null;
  const expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  const verificationUrl = body.verificationUrl ?? null;
  const notes = body.notes ?? null;

  // Validation
  validateRequired(crewId, "crewId");
  validateRequired(systemTypeRaw, "systemType");

  // Validate system type
  const systemType = typeof systemTypeRaw === "string" ? (systemTypeRaw as ComplianceSystemType) : undefined;
  if (!systemType || !Object.values(ComplianceSystemType).includes(systemType)) {
    throw new ApiError(400, "Invalid system type", "INVALID_SYSTEM_TYPE");
  }

  // Check if crew exists
  const crew = await prisma.crew.findUnique({ where: { id: crewId } });
  if (!crew) {
    throw new ApiError(404, "Crew not found", "CREW_NOT_FOUND");
  }

  const createData = {
    crewId: crewId!,
    systemType,
    certificateId,
    issueDate,
    expiryDate,
    status: ComplianceStatus.PENDING,
    verificationUrl,
    notes,
  };

  const compliance = await prisma.externalCompliance.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: createData as any,
    include: {
      crew: {
        select: {
          id: true,
          fullName: true,
          rank: true,
        },
      },
    },
  });

  return NextResponse.json({ data: compliance }, { status: 201 });
});