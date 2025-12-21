/**
 * GET /api/audits/[id]
 * Get audit schedule details
 * PUT /api/audits/[id]
 * Update audit schedule
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import type { Session } from "next-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.VIEW_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const schedule = await prisma.auditSchedule.findUnique({
      where: { id },
      include: {
        findings: { include: { schedule: false }, orderBy: { createdAt: "desc" } },
        report: true,
      },
    });

    if (!schedule) {
      throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
    }

    return NextResponse.json({ data: schedule });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.EDIT_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = await request.json();

    const schedule = await prisma.auditSchedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
    }

    const updateData: { status?: string; endDate?: Date } = {};
    if (payload.status) updateData.status = payload.status;
    if (payload.endDate) updateData.endDate = new Date(payload.endDate);

    const updated = await prisma.auditSchedule.update({
      where: { id },
      data: updateData,
      include: {
        findings: true,
        report: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
