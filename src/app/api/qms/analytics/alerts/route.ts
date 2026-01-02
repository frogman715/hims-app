import { NextRequest, NextResponse } from 'next/server';
import { QMSAdvancedAnalytics } from '@/lib/qms/advanced-analytics';

/**
 * GET /api/qms/analytics/alerts
 * Get active alerts and critical issues
 * Query params: severity=CRITICAL (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const severityFilter = searchParams.get('severity');

    const alerts = await QMSAdvancedAnalytics.generateAlerts();

    const filtered = severityFilter
      ? alerts.filter((a) => a.severity === severityFilter)
      : alerts;

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      actionRequired: filtered.filter((a) => a.actionRequired).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
      },
      { status: 500 }
    );
  }
}
