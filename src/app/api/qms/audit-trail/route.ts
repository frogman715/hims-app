import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qms/audit-trail
 * List audit trail entries with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkPermission(session, 'quality', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const days = parseInt(searchParams.get('days') || '30');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter
    const where: Record<string, unknown> = {
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    if (entityType) where.entityType = entityType;
    if (category) where.category = category;
    if (severity) where.severity = severity;

    // Fetch audit trails
    const [entries, total] = await Promise.all([
      prisma.auditTrail.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditTrail.count({ where }),
    ]);

    return NextResponse.json({
      data: entries,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qms/audit-trail
 * Create audit trail entry (typically called by other endpoints)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entityType,
      entityId,
      category,
      event,
      description,
      severity,
      userId,
    } = body;

    // Validate required fields
    if (!category || !event || !userId) {
      return NextResponse.json(
        { error: 'category, event, and userId are required' },
        { status: 400 }
      );
    }

    // Create audit entry
    const entry = await prisma.auditTrail.create({
      data: {
        entityType: entityType || 'UNKNOWN',
        entityId: entityId || null,
        category,
        event,
        description: description || null,
        severity: severity || 'INFO',
        userId,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating audit trail:', error);
    return NextResponse.json(
      { error: 'Failed to create audit trail entry' },
      { status: 500 }
    );
  }
}
