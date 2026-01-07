import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { QMSAdvancedAnalytics } from '@/lib/qms/advanced-analytics';

/**
 * GET /api/qms/analytics/alerts
 * Get active alerts and critical issues
 * Query params: severity=CRITICAL (optional filter)
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
