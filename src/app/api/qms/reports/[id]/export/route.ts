import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReportExportService } from '@/lib/qms/report-export';

type RouteParams = Promise<{ id: string }>;

type NonconformityRecordData = {
  id: string;
  severity: string;
  status: string;
  type: string;
  description: string | null;
  dueDate: Date;
  assignedTo: string | null;
};

/**
 * Export QMS report as PDF or Excel
 * GET /api/qms/reports/[id]/export?format=pdf|excel&email=recipients@example.com
 */
export async function GET(request: NextRequest, props: { params: RouteParams }) {
  const params = await props.params;

  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') as 'pdf' | 'excel' | null) || 'pdf';
    const emailRecipients = searchParams.getAll('email');

    // Validate format
    if (!['pdf', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf or excel.' },
        { status: 400 }
      );
    }

    // Fetch report with related data
    const report = await prisma.qMSReport.findUnique({
      where: { id: params.id },
      include: {
        approver: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch related metrics snapshot
    const metricsSnapshot = report.metricsSnapshot as unknown as Record<string, unknown> | null;

    // Fetch non-conformities for the report period
    const nonconformities = await prisma.nonconformityRecord.findMany({
      where: {
        reportedAt: {
          gte: report.periodStart,
          lte: report.periodEnd,
        },
      },
      select: {
        id: true,
        severity: true,
        status: true,
        type: true,
        description: true,
        dueDate: true,
        assignedTo: true,
      },
    });

    // Generate report based on format
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    const typedNonconformities = nonconformities as NonconformityRecordData[];

    if (format === 'pdf') {
      buffer = await ReportExportService.generatePDFReport(
        report,
        metricsSnapshot,
        typedNonconformities
      );
      contentType = 'application/pdf';
      filename = `${report.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    } else {
      buffer = await ReportExportService.generateExcelReport(
        report,
        metricsSnapshot,
        typedNonconformities,
        [] // Audit events can be fetched if needed
      );
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `${report.title.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
    }

    // Send email if recipients provided
    if (emailRecipients.length > 0) {
      const pdfBuffer = await ReportExportService.generatePDFReport(
        report,
        metricsSnapshot,
        typedNonconformities
      );
      const excelBuffer = await ReportExportService.generateExcelReport(
        report,
        metricsSnapshot,
        typedNonconformities
      );

      const emailResult = await ReportExportService.sendReportEmail(
        report,
        emailRecipients,
        pdfBuffer,
        excelBuffer
      );

      if (!emailResult.success) {
        // Log email failure but still return the file
        console.error('Email send failed:', emailResult.error);
      }
    }

    // Return file as download
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = new NextResponse(buffer as any);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return response;
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}

/**
 * Schedule recurring report distribution
 * POST /api/qms/reports/[id]/export
 * { schedule: 'daily' | 'weekly' | 'monthly', recipients: ['email@example.com'] }
 */
export async function POST(request: NextRequest, props: { params: RouteParams }) {
  const params = await props.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { schedule, recipients } = body;

    // Validate input
    if (!schedule || !['daily', 'weekly', 'monthly'].includes(schedule as string)) {
      return NextResponse.json(
        { error: 'Invalid schedule. Must be daily, weekly, or monthly.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Invalid recipients. Must be non-empty array.' },
        { status: 400 }
      );
    }

    // Fetch report
    const report = await prisma.qMSReport.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Schedule distribution
    const scheduleResult = await ReportExportService.scheduleReportDistribution(
      params.id,
      schedule as 'daily' | 'weekly' | 'monthly',
      recipients as string[]
    );

    return NextResponse.json(
      {
        success: true,
        jobId: scheduleResult.jobId,
        nextRun: scheduleResult.nextRun,
        message: `Report scheduled for ${schedule} distribution`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scheduling failed' },
      { status: 500 }
    );
  }
}
