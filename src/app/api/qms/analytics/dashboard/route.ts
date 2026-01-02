import { NextRequest, NextResponse } from 'next/server';
import { QMSAdvancedAnalytics } from '@/lib/qms/advanced-analytics';

/**
 * GET /api/qms/analytics/dashboard
 * Get complete dashboard metrics and KPIs
 */
export async function GET(request: NextRequest) {
  try {
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
