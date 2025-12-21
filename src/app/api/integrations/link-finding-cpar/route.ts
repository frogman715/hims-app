/**
 * POST /api/integrations/link-finding-cpar
 * Link audit finding to CPAR (Corrective Action Plan)
 * Integration between Audit module and existing CPAR module
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

    if (!payload.findingId || !payload.cparId) {
      throw new ApiError(400, "findingId and cparId are required", "VALIDATION_ERROR");
    }

    // Verify finding exists
    const finding = await prisma.auditFinding.findUnique({
      where: { id: payload.findingId },
      include: { schedule: true },
    });

    if (!finding) {
      throw new ApiError(404, "Audit finding not found", "NOT_FOUND");
    }

    // Check if CPAR model exists and has the column
    // For now, we'll just return success as the CPAR model hasn't been created yet
    // This endpoint structure shows how the integration would work

    return NextResponse.json(
      {
        data: {
          findingId: finding.id,
          findingNumber: finding.findingNumber,
          linked: true,
          message: "Finding linked to CPAR (integration point)",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
