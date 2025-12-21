/**
 * POST /api/audits/[id]/report
 * Create audit report
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import type { Session } from "next-auth";

type RouteContext = { params: Promise<{ id: string }> };

async function generateReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await prisma.auditReport.findMany({
    where: { reportNumber: { startsWith: `AUD-RPT-${year}-` } },
    select: { reportNumber: true },
    orderBy: { reportNumber: "desc" },
    take: 1,
  });

  let nextNum = 1;
  if (existing.length > 0) {
    const lastNum = parseInt(existing[0].reportNumber.split("-")[3], 10);
    nextNum = lastNum + 1;
  }
  return `AUD-RPT-${year}-${String(nextNum).padStart(3, "0")}`;
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

    if (!payload.summary || !payload.recommendations) {
      throw new ApiError(400, "summary and recommendations are required", "VALIDATION_ERROR");
    }

    const schedule = await prisma.auditSchedule.findUnique({
      where: { id: scheduleId },
      include: { report: true },
    });

    if (!schedule) {
      throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
    }

    if (schedule.report) {
      throw new ApiError(409, "Audit report already exists for this schedule", "DUPLICATE_ENTRY");
    }

    const reportNumber = await generateReportNumber();

    const report = await prisma.auditReport.create({
      data: {
        scheduleId,
        reportNumber,
        summary: payload.summary,
        recommendations: payload.recommendations,
        findings: payload.findings || {},
        status: "DRAFT",
      },
      include: {
        schedule: true,
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
