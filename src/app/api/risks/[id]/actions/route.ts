/**
 * POST /api/risks/[id]/actions
 * Add action to risk
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
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

    if (!payload.description || !payload.dueDate) {
      throw new ApiError(400, "description and dueDate are required", "VALIDATION_ERROR");
    }

    const risk = await prisma.risk.findUnique({ where: { id: riskId } });
    if (!risk) {
      throw new ApiError(404, "Risk not found", "NOT_FOUND");
    }

    const action = await prisma.riskAction.create({
      data: {
        riskId,
        description: payload.description,
        owner: session.user.id,
        dueDate: new Date(payload.dueDate),
        status: "OPEN",
      },
      include: {
        ownedBy: { select: { id: true, name: true, email: true } },
        risk: true,
      },
    });

    // Audit log
    await prisma.riskAuditLog.create({
      data: {
        riskId,
        action: "ADDED_ACTION",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changedFields: { actionId: action.id, description: payload.description } as any,
        changedById: session.user.id,
      },
    });

    return NextResponse.json({ data: action }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
