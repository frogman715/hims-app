import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HR, CDMO, and DIRECTOR can approve
    if (!['HR', 'HR_ADMIN', 'CDMO', 'DIRECTOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve submissions' },
        { status: 403 }
      );
    }

    const { submissionId } = await params;

    const body = await request.json();
    const { remarks } = body;

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

    // Check submission can be approved
    if (!['SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW'].includes(submission.status)) {
      return NextResponse.json(
        { error: `Cannot approve ${submission.status} submission` },
        { status: 409 }
      );
    }

    // Check all documents are verified
    const unverifiedDocs = await prisma.documentUpload.count({
      where: {
        submissionId,
        verificationStatus: 'PENDING',
      },
    });

    if (unverifiedDocs > 0) {
      return NextResponse.json(
        {
          error: `Cannot approve. ${unverifiedDocs} document(s) pending verification`,
        },
        { status: 400 }
      );
    }

    // Update submission to APPROVED
    const updatedSubmission = await prisma.hGFSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: session.user.id,
        approvalRemarks: remarks || null,
      },
    });

    // Log the action
    await prisma.hGFSubmissionAuditLog.create({
      data: {
        submissionId,
        action: 'APPROVE',
        changedFields: {
          status: 'SUBMITTED -> APPROVED',
          approvedBy: session.user.id,
        },
        performedById: session.user.id,
        reason: remarks || null,
      },
    });

    return NextResponse.json({
      data: updatedSubmission,
      message: 'Submission approved successfully',
    });
  } catch (error) {
    console.error('Error approving HGF submission:', error);
    return NextResponse.json(
      { error: 'Failed to approve HGF submission' },
      { status: 500 }
    );
  }
}
