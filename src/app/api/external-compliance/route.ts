import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ApiError, validateRequired } from "@/lib/error-handler";
import { ComplianceSystemType, ComplianceStatus } from "@prisma/client";

/**
 * GET /api/external-compliance
 * Get all external compliance records with filtering
 */
export const GET = withPermission("compliance", PermissionLevel.VIEW_ACCESS, async (req) => {
  const { searchParams } = new URL(req.url);
  const crewId = searchParams.get("crewId");
  const systemType = searchParams.get("systemType") as ComplianceSystemType | null;
  const status = searchParams.get("status") as ComplianceStatus | null;

  const where: {
    crewId?: string;
    systemType?: ComplianceSystemType;
    status?: ComplianceStatus;
  } = {};

  if (crewId) where.crewId = crewId;
  if (systemType) where.systemType = systemType;
  if (status) where.status = status;

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
export const POST = withPermission("compliance", PermissionLevel.EDIT_ACCESS, async (req) => {
  const body = await req.json();

  const { crewId, systemType, certificateId, issueDate, expiryDate, verificationUrl, notes } = body;

  // Validation
  validateRequired(crewId, "crewId");
  validateRequired(systemType, "systemType");

  // Validate system type
  if (!Object.values(ComplianceSystemType).includes(systemType)) {
    throw new ApiError(400, "Invalid system type", "INVALID_SYSTEM_TYPE");
  }

  // Check if crew exists
  const crew = await prisma.crew.findUnique({ where: { id: crewId } });
  if (!crew) {
    throw new ApiError(404, "Crew not found", "CREW_NOT_FOUND");
  }

  const compliance = await prisma.externalCompliance.create({
    data: {
      crewId,
      systemType,
      certificateId: certificateId || null,
      issueDate: issueDate ? new Date(issueDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: ComplianceStatus.PENDING,
      verificationUrl: verificationUrl || null,
      notes: notes || null,
    },
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