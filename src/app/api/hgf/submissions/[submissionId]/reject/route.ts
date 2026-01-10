import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { env } from '@/lib/env';
import { getEmailServiceInstance } from '@/lib/email';
import { createHGFEmailNotifications } from '@/lib/email/hgf-notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HR, CDMO, and DIRECTOR can reject
    if (!['HR', 'HR_ADMIN', 'CDMO', 'DIRECTOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to reject submissions' },
        { status: 403 }
      );
    }

    const { submissionId } = await params;

    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get current submission
    const submission = await prisma.hGFSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check submission can be rejected
    if (!['SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW'].includes(submission.status)) {
      return NextResponse.json(
        { error: `Cannot reject ${submission.status} submission` },
        { status: 409 }
      );
    }

    // Update submission to REJECTED
    const updatedSubmission = await prisma.hGFSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: session.user.id,
        rejectionReason,
      },
    });

    // Log the action
    await prisma.hGFSubmissionAuditLog.create({
      data: {
        submissionId,
        action: 'REJECT',
        changedFields: {
          status: 'SUBMITTED -> REJECTED',
          rejectedBy: session.user.id,
        },
        performedById: session.user.id,
        reason: rejectionReason,
      },
    });

    // Send email notifications
    try {
      const emailService = getEmailServiceInstance();
      const notifications = createHGFEmailNotifications({
        emailService,
        prisma,
        appBaseUrl: env.NEXTAUTH_URL || 'http://localhost:3000',
      });

      // Send rejection notification email to crew
      await notifications.sendRejectionNotification(submissionId, rejectionReason);
    } catch (error) {
      console.warn('Failed to send rejection notification email:', error);
      // Don't fail the API response if emails fail
    }

    return NextResponse.json({
      data: updatedSubmission,
      message: 'Submission rejected',
    });
  } catch (error) {
    console.error('Error rejecting HGF submission:', error);
    return NextResponse.json(
      { error: 'Failed to reject HGF submission' },
      { status: 500 }
    );
  }
}
