import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qms/documents
 * List QMS documents with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const crewId = searchParams.get('crewId');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter
    const where: Record<string, unknown> = {};
    if (crewId) where.crewId = crewId;
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;

    // Fetch documents with pagination
    const [documents, total] = await Promise.all([
      prisma.qMSDocument.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qMSDocument.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching QMS documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QMS documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qms/documents
 * Create QMS document record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      crewId,
      documentId,
      status,
      riskLevel,
      category,
      remarks,
      expiresAt,
    } = body;

    // Validate required fields
    if (!crewId && !documentId) {
      return NextResponse.json(
        { error: 'Either crewId or documentId is required' },
        { status: 400 }
      );
    }

    // Create QMS document
    const qmsDocument = await prisma.qMSDocument.create({
      data: {
        crewId: crewId || undefined,
        documentId: documentId || undefined,
        status: status || 'ACTIVE',
        riskLevel: riskLevel || 'MEDIUM',
        category: category || 'GENERAL',
        remarks: remarks || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        lastVerifiedAt: new Date(),
      },
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
        entityId: qmsDocument.id,
        event: 'CREATED',
        description: `Created QMS document tracking for ${crewId ? 'crew' : 'document'}`,
        userId: 'system',
      },
    });

    return NextResponse.json({ data: qmsDocument }, { status: 201 });
  } catch (error) {
    console.error('Error creating QMS document:', error);
    return NextResponse.json(
      { error: 'Failed to create QMS document' },
      { status: 500 }
    );
  }
}
