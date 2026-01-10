import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError, validateRequired } from "@/lib/error-handler";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

/**
 * GET /api/admin/users
 * List all users (System Admin and DIRECTOR only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const canManageUsers = session.user.isSystemAdmin || session.user.roles?.includes('DIRECTOR');
    if (!canManageUsers) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSystemAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/users
 * Create a new user (System Admin and DIRECTOR only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const canManageUsers = session.user.isSystemAdmin || session.user.roles?.includes('DIRECTOR');
    if (!canManageUsers) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, password, isSystemAdmin } = body;

    // Validate required fields
    validateRequired(name, "name");
    validateRequired(email, "email");
    validateRequired(role, "role");
    validateRequired(password, "password");

    // Type checks and validation
    if (typeof name !== 'string') {
      throw new ApiError(400, "Name must be a string", "INVALID_NAME");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format", "INVALID_EMAIL");
    }

    // Validate password strength (minimum 6 characters)
    if (typeof password !== 'string' || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters", "WEAK_PASSWORD");
    }

    // Validate role
    const validRoles = ["DIRECTOR", "CDMO", "OPERATIONAL", "ACCOUNTING", "HR", "CREW_PORTAL", "QMR", "HR_ADMIN", "SECTION_HEAD", "STAFF"];
    if (typeof role !== 'string' || !validRoles.includes(role)) {
      throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(", ")}`, "INVALID_ROLE");
    }

    // Only System Admins can set isSystemAdmin flag
    const canSetSystemAdmin = session.user.isSystemAdmin;
    const systemAdminValue = canSetSystemAdmin && isSystemAdmin === true;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: role as Role,
        password: hashedPassword,
        isSystemAdmin: systemAdminValue,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSystemAdmin: true,
        isActive: true,
        createdAt: true,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        newValuesJson: {
          name: user.name,
          email: user.email,
          role: user.role,
          isSystemAdmin: user.isSystemAdmin,
        },
      }
    });

    return NextResponse.json({ user, message: "User created successfully" }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
