/**
 * GET /api/audits
 * List audit schedules
 * POST /api/audits
 * Create audit schedule
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import type { Session } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.VIEW_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const where: { status?: string } = {};
    if (status) where.status = status;

    const schedules = await prisma.auditSchedule.findMany({
      where,
      include: {
        findings: { select: { id: true, severity: true, status: true } },
        report: { select: { id: true, status: true, reportNumber: true } },
      },
      orderBy: { startDate: "desc" },
      take: limit,
      skip,
    });

    const total = await prisma.auditSchedule.count({ where });

    return NextResponse.json({ data: schedules, total, skip, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.EDIT_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await request.json();

    if (!payload.title || !payload.description || !payload.auditType || !payload.startDate) {
      throw new ApiError(400, "title, description, auditType, and startDate are required", "VALIDATION_ERROR");
    }

    if (!Array.isArray(payload.auditors) || !Array.isArray(payload.auditees)) {
      throw new ApiError(400, "auditors and auditees must be arrays", "VALIDATION_ERROR");
    }

    const schedule = await prisma.auditSchedule.create({
      data: {
        title: payload.title,
        description: payload.description,
        auditType: payload.auditType,
        frequency: payload.frequency || "ON_DEMAND",
        startDate: new Date(payload.startDate),
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        auditors: payload.auditors,
        auditees: payload.auditees,
        status: "SCHEDULED",
      },
      include: {
        findings: true,
        report: true,
      },
    });

    return NextResponse.json({ data: schedule }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
