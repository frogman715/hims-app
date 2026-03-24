import { NextResponse } from 'next/server';
import { QMSAdvancedAnalytics } from '@/lib/qms/advanced-analytics';
import { requireQmsApiAccess } from '@/lib/qms-api-auth';
import { PermissionLevel } from '@/lib/permission-middleware';

/**
 * GET /api/qms/analytics/dashboard
 * Get complete dashboard metrics and KPIs
 */
export async function GET() {
  try {
    const access = await requireQmsApiAccess(PermissionLevel.VIEW_ACCESS);
    if (!access.ok) return access.response;

    const metrics = await QMSAdvancedAnalytics.getDashboardMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard metrics',
      },
      { status: 500 }
    );
  }
}
