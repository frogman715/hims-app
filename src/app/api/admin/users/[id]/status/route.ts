import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { ensureAdminApiAccess } from "@/lib/admin-authorization";
import { ADMIN_MAINTENANCE_SCOPES } from "@/lib/admin-access";

/**
 * PATCH /api/admin/users/[id]/status
 * Toggle user active status (activate/deactivate)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const authError = ensureAdminApiAccess(session, ADMIN_MAINTENANCE_SCOPES.USER_MANAGEMENT);
    if (authError) return authError;

    // Prevent self-deactivation
    if (session.user.id === id) {
      throw new ApiError(400, "Cannot deactivate your own account", "SELF_DEACTIVATE");
    }

    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      throw new ApiError(400, "isActive must be a boolean value", "INVALID_INPUT");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entityType: "User",
        entityId: user.id,
        metadataJson: {
          newStatus: isActive ? "active" : "inactive",
        },
      }
    });

    return NextResponse.json({ 
      user, 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
