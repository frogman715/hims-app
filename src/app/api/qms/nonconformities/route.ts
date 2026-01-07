import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qms/nonconformities
 * List non-conformity records with filtering
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
    const crewId = searchParams.get('crewId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter
    const where: Record<string, unknown> = {};
    if (crewId) where.crewId = crewId;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    // Fetch non-conformities
    const [records, total] = await Promise.all([
      prisma.nonconformityRecord.findMany({
        where,
        include: {
          crew: {
            select: { id: true, fullName: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          verifier: {
            select: { id: true, name: true, email: true },
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.nonconformityRecord.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching non-conformities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch non-conformities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qms/nonconformities
 * Create new non-conformity record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkPermission(session, 'quality', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { crewId, type, severity, description, findings, assignedTo } = body;

    // Validate required fields
    if (!type || !description || !severity) {
      return NextResponse.json(
        { error: 'type, description, and severity are required' },
        { status: 400 }
      );
    }

    // Create non-conformity
    const record = await prisma.nonconformityRecord.create({
      data: {
        crewId: crewId || undefined,
        type,
        severity,
        status: 'OPEN',
        description,
        findings: findings || null,
        assignedTo: assignedTo || undefined,
      },
      include: {
        crew: { select: { id: true, fullName: true } },
        assignee: { select: { id: true, name: true } },
        auditLogs: true,
      },
    });

    // Log to audit trail
    await prisma.auditTrail.create({
      data: {
        category: 'PROCESS_COMPLIANCE',
        entityType: 'NonconformityRecord',
        entityId: record.id,
        event: 'CREATED',
        description: `Non-conformity created: ${type} (${severity})`,
        userId: 'system',
        severity: severity === 'CRITICAL' ? 'CRITICAL' : 'INFO',
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating non-conformity:', error);
    return NextResponse.json(
      { error: 'Failed to create non-conformity' },
      { status: 500 }
    );
  }
}
