import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qms/nonconformities/[id]
 * Get single non-conformity record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const record = await prisma.nonconformityRecord.findUnique({
      where: { id },
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
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Non-conformity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error('Error fetching non-conformity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch non-conformity' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/qms/nonconformities/[id]
 * Update non-conformity record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      correctiveAction,
      remarks,
      assignedTo,
      verifiedBy,
      verificationDate,
    } = body;

    // Check record exists
    const existing = await prisma.nonconformityRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Non-conformity not found' },
        { status: 404 }
      );
    }

    // Update record
    const updated = await prisma.nonconformityRecord.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(correctiveAction && { correctiveAction }),
        ...(assignedTo && { assignedTo }),
        ...(verifiedBy && { verifiedBy }),
        ...(verificationDate && {
          verificationDate: new Date(verificationDate),
          closedAt: status === 'CLOSED' ? new Date() : undefined,
        }),
      },
      include: {
        crew: { select: { id: true, fullName: true } },
        assignee: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    // Create audit log entry
    await prisma.nonconformityAuditLog.create({
      data: {
        nonconformityId: id,
        action: 'STATUS_CHANGED',
        oldValue: existing.status,
        newValue: status || existing.status,
        comment: remarks || null,
        performedBy: 'system',
      },
    });

    // Log to audit trail
    await prisma.auditTrail.create({
      data: {
        category: 'PROCESS_COMPLIANCE',
        entityType: 'NonconformityRecord',
        entityId: id,
        event: 'UPDATED',
        description: `Updated non-conformity: status=${status}`,
        userId: 'system',
        severity: status === 'CLOSED' ? 'INFO' : 'WARNING',
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating non-conformity:', error);
    return NextResponse.json(
      { error: 'Failed to update non-conformity' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qms/nonconformities/[id]/close
 * Close non-conformity record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!request.url.includes('/close')) {
      return NextResponse.json(
        { error: 'Invalid endpoint' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { verifiedBy, remarks } = body;

    // Close non-conformity
    const updated = await prisma.nonconformityRecord.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        verifiedBy: verifiedBy || undefined,
        verificationDate: new Date(),
      },
      include: {
        crew: { select: { id: true, fullName: true } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    // Create audit log
    await prisma.nonconformityAuditLog.create({
      data: {
        nonconformityId: id,
        action: 'CLOSED',
        comment: remarks || null,
        performedBy: 'system',
      },
    });

    // Log to audit trail
    await prisma.auditTrail.create({
      data: {
        category: 'PROCESS_COMPLIANCE',
        entityType: 'NonconformityRecord',
        entityId: id,
        event: 'CLOSED',
        description: `Closed non-conformity for ${updated.crew?.fullName || 'Unknown'}`,
        userId: 'system',
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error closing non-conformity:', error);
    return NextResponse.json(
      { error: 'Failed to close non-conformity' },
      { status: 500 }
    );
  }
}
