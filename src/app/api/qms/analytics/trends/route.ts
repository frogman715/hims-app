import { NextRequest, NextResponse } from 'next/server';
import { QMSAdvancedAnalytics } from '@/lib/qms/advanced-analytics';

/**
 * GET /api/qms/analytics/trends
 * Get compliance trends over time
 * Query params: days=30 (default)
 */
export async function GET(request: NextRequest) {
  try {
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
