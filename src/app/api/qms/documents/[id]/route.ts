import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qms/documents/[id]
 * Get single QMS document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.qMSDocument.findUnique({
      where: { id },
      include: {
        crew: {
          select: { id: true, fullName: true, email: true },
        },
        document: {
          select: { id: true, docType: true, docNumber: true, expiryDate: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: document });
  } catch (error) {
    console.error('Error fetching QMS document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QMS document' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/qms/documents/[id]
 * Update QMS document
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, riskLevel, remarks, reviewedBy, expiresAt } = body;

    // Check document exists
    const existing = await prisma.qMSDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document
    const updated = await prisma.qMSDocument.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(riskLevel && { riskLevel }),
        ...(remarks && { remarks }),
        ...(reviewedBy && { reviewedBy }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        lastVerifiedAt: new Date(),
      },
      include: {
        crew: { select: { id: true, fullName: true } },
        document: { select: { id: true, docType: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    // Log to audit trail
    await prisma.auditTrail.create({
      data: {
        category: 'DOCUMENT_VERIFICATION',
        entityType: 'QMSDocument',
        entityId: id,
        event: 'UPDATED',
        description: `Updated QMS document: status=${status}, riskLevel=${riskLevel}`,
        userId: 'system',
        severity: riskLevel === 'CRITICAL' ? 'WARNING' : 'INFO',
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating QMS document:', error);
    return NextResponse.json(
      { error: 'Failed to update QMS document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qms/documents/[id]
 * Archive QMS document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Archive instead of delete
    const updated = await prisma.qMSDocument.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: {
        crew: { select: { id: true, fullName: true } },
        document: { select: { id: true, docType: true } },
      },
    });

    // Log to audit trail
    await prisma.auditTrail.create({
      data: {
        category: 'DOCUMENT_VERIFICATION',
        entityType: 'QMSDocument',
        entityId: id,
        event: 'ARCHIVED',
        description: 'Archived QMS document',
        userId: 'system',
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error archiving QMS document:', error);
    return NextResponse.json(
      { error: 'Failed to archive QMS document' },
      { status: 500 }
    );
  }
}
