/**
 * POST /api/audits/[id]/findings
 * Create audit finding
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import type { Session } from "next-auth";

type RouteContext = { params: Promise<{ id: string }> };

// Helper to generate finding number
async function generateFindingNumber(scheduleId: string): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await prisma.auditFinding.findMany({
    where: { scheduleId, findingNumber: { startsWith: `AUD-${year}-` } },
    select: { findingNumber: true },
    orderBy: { findingNumber: "desc" },
    take: 1,
  });

  let nextNum = 1;
  if (existing.length > 0) {
    const lastNum = parseInt(existing[0].findingNumber.split("-")[2], 10);
    nextNum = lastNum + 1;
  }
  return `AUD-${year}-${String(nextNum).padStart(3, "0")}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.EDIT_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: scheduleId } = await context.params;
    const payload = await request.json();

    if (!payload.clause || !payload.description || !payload.severity) {
      throw new ApiError(400, "clause, description, and severity are required", "VALIDATION_ERROR");
    }

    const schedule = await prisma.auditSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) {
      throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
    }

    const findingNumber = await generateFindingNumber(scheduleId);

    const finding = await prisma.auditFinding.create({
      data: {
        scheduleId,
        findingNumber,
        clause: payload.clause,
        description: payload.description,
        severity: payload.severity,
        evidence: payload.evidence || [],
        status: "OPEN",
      },
      include: { schedule: true },
    });

    return NextResponse.json({ data: finding }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
