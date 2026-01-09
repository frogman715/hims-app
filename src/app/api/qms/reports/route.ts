import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qms/reports
 * List QMS reports with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('reportType');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter
    const where: Record<string, unknown> = {};
    if (reportType) where.reportType = reportType;
    if (status) where.status = status;

    // Fetch reports
    const [reports, total] = await Promise.all([
      prisma.qMSReport.findMany({
        where,
        include: {
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qMSReport.count({ where }),
    ]);

    return NextResponse.json({
      data: reports,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qms/reports
 * Create new QMS report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      reportType,
      periodStart,
      periodEnd,
      sections,
    } = body;

    // Validate required fields
    if (!title || !reportType || !periodStart || !periodEnd) {
      return NextResponse.json(
        {
          error:
            'title, reportType, periodStart, and periodEnd are required',
        },
        { status: 400 }
      );
    }

    // Get current metrics as snapshot
    const metrics = await prisma.complianceMetric.findMany({
      select: {
        id: true,
        name: true,
        currentValue: true,
        targetValue: true,
        unit: true,
      },
    });

    // Create report
    const report = await prisma.qMSReport.create({
      data: {
        title,
        description: description || null,
        reportType,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        sections: JSON.stringify(sections || []),
        metricsSnapshot: JSON.stringify(metrics),
        status: 'DRAFT',
      },
      include: {
        approver: { select: { id: true, name: true, email: true } },
      },
    });

    // Log to audit trail
    await prisma.auditTrail.create({
      data: {
        category: 'DOCUMENT_VERIFICATION',
        entityType: 'QMSReport',
        entityId: report.id,
        event: 'CREATED',
        description: `Created ${reportType} report: ${title}`,
        userId: 'system',
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
