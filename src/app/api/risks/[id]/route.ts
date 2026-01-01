/**
 * GET /api/risks/[id]
 * Get specific risk details
 * PUT /api/risks/[id]
 * Update risk
 * DELETE /api/risks/[id]
 * Delete risk (set status to closed)
 * Permission: Quality Manager, QMR (VIEW/WRITE_ACCESS)
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import type { Session } from "next-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    const risk = await prisma.risk.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        actions: {
          include: { ownedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: { reviewedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { reviewDate: "desc" },
        },
        auditLog: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!risk) {
      throw new ApiError(404, "Risk not found", "NOT_FOUND");
    }

    return NextResponse.json({ data: risk });
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

    // Verify risk exists
    const existingRisk = await prisma.risk.findUnique({ where: { id } });
    if (!existingRisk) {
      throw new ApiError(404, "Risk not found", "NOT_FOUND");
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    const changedFields: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      updateData.title = payload.title;
      changedFields.title = payload.title;
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description;
      changedFields.description = payload.description;
    }
    if (payload.probability !== undefined) {
      if (!Number.isInteger(payload.probability) || payload.probability < 1 || payload.probability > 5) {
        throw new ApiError(400, "probability must be between 1 and 5", "VALIDATION_ERROR");
      }
      updateData.probability = payload.probability;
      changedFields.probability = payload.probability;
    }
    if (payload.impact !== undefined) {
      if (!Number.isInteger(payload.impact) || payload.impact < 1 || payload.impact > 5) {
        throw new ApiError(400, "impact must be between 1 and 5", "VALIDATION_ERROR");
      }
      updateData.impact = payload.impact;
      changedFields.impact = payload.impact;
    }
    if (payload.treatmentStrategy !== undefined) {
      updateData.treatmentStrategy = payload.treatmentStrategy;
      changedFields.treatmentStrategy = payload.treatmentStrategy;
    }
    if (payload.treatmentPlan !== undefined) {
      updateData.treatmentPlan = payload.treatmentPlan;
      changedFields.treatmentPlan = payload.treatmentPlan;
    }
    if (payload.status !== undefined) {
      updateData.status = payload.status;
      changedFields.status = payload.status;
    }

    // Recalculate risk score if probability or impact changed
    if (payload.probability !== undefined || payload.impact !== undefined) {
      const newProbability = payload.probability ?? existingRisk.probability;
      const newImpact = payload.impact ?? existingRisk.impact;
      const newRiskScore = newProbability * newImpact;
      updateData.riskScore = newRiskScore;
      changedFields.riskScore = newRiskScore;
    }

    const updated = await prisma.risk.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        actions: true,
        reviews: true,
        auditLog: true,
      },
    });

    // Create audit log
    await prisma.riskAuditLog.create({
      data: {
        riskId: id,
        action: "UPDATED",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changedFields: changedFields as any,
        changedById: session.user.id,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const risk = await prisma.risk.findUnique({ where: { id } });
    if (!risk) {
      throw new ApiError(404, "Risk not found", "NOT_FOUND");
    }

    // Close the risk instead of deleting
    const closed = await prisma.risk.update({
      where: { id },
      data: { status: "CLOSED" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        actions: true,
        reviews: true,
        auditLog: true,
      },
    });

    // Create audit log
    await prisma.riskAuditLog.create({
      data: {
        riskId: id,
        action: "CLOSED",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changedFields: { status: "CLOSED" } as any,
        changedById: session.user.id,
      },
    });

    return NextResponse.json({ data: closed });
  } catch (error) {
    return handleApiError(error);
  }
}
