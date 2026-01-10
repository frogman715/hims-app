import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/error-handler";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * POST /api/admin/users/[id]/reset-password
 * Reset user password and generate a new temporary password
 */
export async function POST(
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

    // Get user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a random temporary password (12 characters)
    const tempPassword = crypto.randomBytes(6).toString('hex'); // Generates 12-char hex string
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
        metadataJson: {
          resetBy: session.user.name,
          resetAt: new Date().toISOString(),
        },
      }
    });

    // Return the temporary password (in production, this should be sent via email)
    return NextResponse.json({ 
      message: "Password reset successfully",
      tempPassword,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
