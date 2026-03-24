import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailDistributionService } from '@/lib/qms/email-distribution';
import { requireQmsApiAccess } from '@/lib/qms-api-auth';
import { PermissionLevel } from '@/lib/permission-middleware';

type RouteParams = Promise<{ id: string }>;

/**
 * Manage report email distributions
 * GET /api/qms/reports/[id]/distributions - List all distributions for a report
 * POST /api/qms/reports/[id]/distributions - Create new distribution schedule
 */
export async function GET(request: NextRequest, props: { params: RouteParams }) {
  const params = await props.params;

  try {
    const access = await requireQmsApiAccess(PermissionLevel.VIEW_ACCESS);
    if (!access.ok) return access.response;

    // Verify report exists
    const report = await prisma.qMSReport.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get distributions for this report
    const distributions = await EmailDistributionService.listReportDistributions(params.id);

    return NextResponse.json({
      reportId: params.id,
      distributions,
      count: distributions.length,
    });
  } catch (error) {
    console.error('Distribution list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list distributions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, props: { params: RouteParams }) {
  const params = await props.params;

  try {
    const access = await requireQmsApiAccess(PermissionLevel.EDIT_ACCESS);
    if (!access.ok) return access.response;

    const body = (await request.json()) as Record<string, unknown>;
    const { recipients, schedule, provider } = body;

    // Validate input
    if (
      !Array.isArray(recipients) ||
      recipients.length === 0 ||
      !recipients.every((r) => typeof r === 'string')
    ) {
      return NextResponse.json(
        { error: 'Invalid recipients. Must be non-empty array of strings.' },
        { status: 400 }
      );
    }

    if (!schedule || !['daily', 'weekly', 'monthly'].includes(schedule as string)) {
      return NextResponse.json(
        { error: 'Invalid schedule. Must be daily, weekly, or monthly.' },
        { status: 400 }
      );
    }

    // Verify report exists
    const report = await prisma.qMSReport.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Create distribution schedule
    const distribution = await EmailDistributionService.scheduleDistribution(
      params.id,
      recipients as string[],
      schedule as 'daily' | 'weekly' | 'monthly',
      (provider as 'nodemailer' | 'sendgrid' | 'mailgun' | 'aws-ses') || 'nodemailer'
    );

    return NextResponse.json(
      {
        success: true,
        distribution,
        message: `Email distribution scheduled for ${schedule}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Distribution create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create distribution' },
      { status: 500 }
    );
  }
}
