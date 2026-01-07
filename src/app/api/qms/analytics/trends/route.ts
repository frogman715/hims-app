import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { QMSAdvancedAnalytics } from '@/lib/qms/advanced-analytics';

/**
 * GET /api/qms/analytics/trends
 * Get compliance trends over time
 * Query params: days=30 (default)
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
    const days = parseInt(searchParams.get('days') || '30');

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      );
    }

    const trends = await QMSAdvancedAnalytics.getComplianceTrends(days);

    return NextResponse.json({
      success: true,
      data: trends,
      period: `last_${days}_days`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch compliance trends',
      },
      { status: 500 }
    );
  }
}
