import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, validatePagination } from "@/lib/error-handler";

/**
 * GET /api/admin/audit-logs
 * Get audit logs with pagination (System Admin and DIRECTOR only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const canViewAuditLogs = session.user.isSystemAdmin || session.user.roles?.includes('DIRECTOR');
    if (!canViewAuditLogs) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '50';
    const offsetParam = searchParams.get('offset') || '0';
    const entityType = searchParams.get('entityType') || 'User';
    const action = searchParams.get('action');

    const { limit, offset } = validatePagination(limitParam, offsetParam);

    // Build where clause
    const where: {
      entityType?: string;
      action?: string;
    } = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    // Get audit logs
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
