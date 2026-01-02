import { NextRequest, NextResponse } from 'next/server';
import { EmailDistributionService } from '@/lib/qms/email-distribution';

/**
 * Execute pending report distributions
 * GET /api/qms/reports/execute-distributions
 * This endpoint should be called by a cron job or scheduler
 * In production, would be triggered by: node-cron, bull, AWS EventBridge, etc.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization - in production would check API key or service account
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SCHEDULER_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Execute pending distributions
    const results = await EmailDistributionService.executePendingDistributions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      message: `Executed ${results.success} successful distributions, ${results.failed} failed`,
    });
  } catch (error) {
    console.error('Distribution execution error:', error);
    return NextResponse.json(
      { error: 'Execution failed' },
      { status: 500 }
    );
  }
}

/**
 * List pending distributions (debug endpoint)
 * GET /api/qms/reports/pending-distributions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SCHEDULER_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { action, jobId } = body;

    if (action === 'pause' && typeof jobId === 'string') {
      const success = await EmailDistributionService.toggleSchedule(jobId, false);
      return NextResponse.json({
        success,
        message: success ? 'Distribution paused' : 'Distribution not found',
      });
    }

    if (action === 'resume' && typeof jobId === 'string') {
      const success = await EmailDistributionService.toggleSchedule(jobId, true);
      return NextResponse.json({
        success,
        message: success ? 'Distribution resumed' : 'Distribution not found',
      });
    }

    if (action === 'remove' && typeof jobId === 'string') {
      const success = await EmailDistributionService.removeDistribution(jobId);
      return NextResponse.json({
        success,
        message: success ? 'Distribution removed' : 'Distribution not found',
      });
    }

    if (action === 'details' && typeof jobId === 'string') {
      const details = await EmailDistributionService.getDistributionDetails(jobId);
      return NextResponse.json({
        found: details !== null,
        details,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: pause, resume, remove, details' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Distribution management error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Management failed' },
      { status: 500 }
    );
  }
}
