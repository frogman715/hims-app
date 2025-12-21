/**
 * POST /api/risks/[id]/review
 * Create effectiveness review for risk
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

type RouteContext = { params: Promise<{ id: string }> };

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

    const { id: riskId } = await context.params;
    const payload = await request.json();

    if (typeof payload.effectiveness !== "number" || !payload.notes) {
      throw new ApiError(400, "effectiveness and notes are required", "VALIDATION_ERROR");
    }

    const risk = await prisma.risk.findUnique({ where: { id: riskId } });
    if (!risk) {
      throw new ApiError(404, "Risk not found", "NOT_FOUND");
    }

    let newRiskScore: number | null = null;
    if (payload.newProbability && payload.newImpact) {
      newRiskScore = payload.newProbability * payload.newImpact;
    }

    const review = await prisma.riskReview.create({
      data: {
        riskId,
        newProbability: payload.newProbability ?? null,
        newImpact: payload.newImpact ?? null,
        newRiskScore,
        effectiveness: payload.effectiveness,
        notes: payload.notes,
        reviewedById: session.user.id,
      },
      include: {
        reviewedBy: { select: { id: true, name: true, email: true } },
        risk: true,
      },
    });

    // Audit log
    await prisma.riskAuditLog.create({
      data: {
        riskId,
        action: "REVIEWED",
        changedFields: { effectiveness: payload.effectiveness, newRiskScore } as Prisma.InputJsonValue,
        changedById: session.user.id,
      },
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
