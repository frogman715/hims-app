/**
 * GET /api/risks
 * List all risks with optional filtering
 * Permission: Quality Manager, QMR, CDMO (VIEW_ACCESS)
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

    // Check permission
    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.VIEW_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (source) where.source = source;

    const risks = await prisma.risk.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        actions: { select: { id: true, description: true, status: true, dueDate: true } },
        reviews: { select: { id: true, reviewDate: true, effectiveness: true } },
        auditLog: { select: { id: true, action: true, changedAt: true }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    const total = await prisma.risk.count({ where });

    return NextResponse.json({ data: risks, total, skip, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/risks
 * Create new risk
 * Permission: Quality Manager, QMR (EDIT_ACCESS)
 */

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.EDIT_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await request.json();

    // Validate payload
    if (!payload.title || !payload.description || !payload.source) {
      throw new ApiError(400, "title, description, and source are required", "VALIDATION_ERROR");
    }
    if (!Number.isInteger(payload.probability) || payload.probability < 1 || payload.probability > 5) {
      throw new ApiError(400, "probability must be an integer between 1 and 5", "VALIDATION_ERROR");
    }
    if (!Number.isInteger(payload.impact) || payload.impact < 1 || payload.impact > 5) {
      throw new ApiError(400, "impact must be an integer between 1 and 5", "VALIDATION_ERROR");
    }

    const riskScore = payload.probability * payload.impact;

    const risk = await prisma.risk.create({
      data: {
        title: payload.title,
        description: payload.description,
        source: payload.source,
        probability: payload.probability,
        impact: payload.impact,
        riskScore,
        treatmentStrategy: payload.treatmentStrategy || "MITIGATE",
        treatmentPlan: payload.treatmentPlan || "",
        createdById: session.user.id,
        status: "ACTIVE",
      },
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
        riskId: risk.id,
        action: "CREATED",
        changedFields: {
          title: payload.title,
          source: payload.source,
          probability: payload.probability,
          impact: payload.impact,
          riskScore,
        },
        changedById: session.user.id,
      },
    });

    return NextResponse.json({ data: risk }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
