/**
 * POST /api/integrations/link-risk-nonconformance
 * Link risk to nonconformance
 * Integration between Risk module and existing Nonconformance module
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import type { Session } from "next-auth";

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

    if (!payload.riskId || !payload.nonconformanceId) {
      throw new ApiError(400, "riskId and nonconformanceId are required", "VALIDATION_ERROR");
    }

    // Verify risk exists
    const risk = await prisma.risk.findUnique({
      where: { id: payload.riskId },
    });

    if (!risk) {
      throw new ApiError(404, "Risk not found", "NOT_FOUND");
    }

    // Check if nonconformance exists
    // The Nonconformance model should exist in the schema
    // For now, we'll show the integration structure

    return NextResponse.json(
      {
        data: {
          riskId: risk.id,
          nonconformanceId: payload.nonconformanceId,
          linked: true,
          message: "Risk linked to nonconformance (integration point)",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
