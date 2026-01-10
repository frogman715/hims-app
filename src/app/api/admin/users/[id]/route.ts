import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { Role } from "@prisma/client";

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const canManageUsers = session.user.isSystemAdmin || session.user.roles?.includes('DIRECTOR');
    if (!canManageUsers) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSystemAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user details (name, role, isSystemAdmin)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const canManageUsers = session.user.isSystemAdmin || session.user.roles?.includes('DIRECTOR');
    if (!canManageUsers) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSystemAdmin: true,
        isActive: true,
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, role, isSystemAdmin } = body;

    // Validate role if provided
    if (role) {
      const validRoles = ["DIRECTOR", "CDMO", "OPERATIONAL", "ACCOUNTING", "HR", "CREW_PORTAL", "QMR", "HR_ADMIN", "SECTION_HEAD", "STAFF"];
      if (!validRoles.includes(role)) {
        throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(", ")}`, "INVALID_ROLE");
      }
    }

    // Only System Admins can change isSystemAdmin flag
    const canSetSystemAdmin = session.user.isSystemAdmin;
    const systemAdminValue = canSetSystemAdmin && typeof isSystemAdmin === 'boolean' 
      ? isSystemAdmin 
      : existingUser.isSystemAdmin;

    // Prepare update data
    const updateData: {
      name?: string;
      role?: Role;
      isSystemAdmin?: boolean;
    } = {};

    if (name && name !== existingUser.name) {
      updateData.name = name;
    }
    if (role && role !== existingUser.role) {
      updateData.role = role as Role;
    }
    if (canSetSystemAdmin && typeof isSystemAdmin === 'boolean' && isSystemAdmin !== existingUser.isSystemAdmin) {
      updateData.isSystemAdmin = systemAdminValue;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSystemAdmin: true,
        isActive: true,
        updatedAt: true,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: user.id,
        oldValuesJson: {
          name: existingUser.name,
          role: existingUser.role,
          isSystemAdmin: existingUser.isSystemAdmin,
        },
        newValuesJson: {
          name: user.name,
          role: user.role,
          isSystemAdmin: user.isSystemAdmin,
        },
      }
    });

    return NextResponse.json({ user, message: "User updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Soft delete a user (set isActive to false)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const canManageUsers = session.user.isSystemAdmin || session.user.roles?.includes('DIRECTOR');
    if (!canManageUsers) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    // Prevent self-deletion
    if (session.user.id === id) {
      throw new ApiError(400, "Cannot delete your own account", "SELF_DELETE");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "USER_DEACTIVATED",
        entityType: "User",
        entityId: user.id,
        metadataJson: {
          reason: "User deactivated by admin",
        },
      }
    });

    return NextResponse.json({ message: "User deactivated successfully", user });
  } catch (error) {
    return handleApiError(error);
  }
}
