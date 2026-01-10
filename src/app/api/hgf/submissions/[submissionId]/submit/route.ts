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

    const { submissionId } = await params;

    const body = await request.json();
    const { remarks } = body;

    // Get current submission with form details
    const submission = await prisma.hGFSubmission.findUnique({
      where: { id: submissionId },
      include: {
        form: { select: { requiredDocs: true } },
        documents: { select: { documentCode: true } },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check submission can be submitted
    if (!['DRAFT', 'REVISIONS_NEEDED'].includes(submission.status)) {
      return NextResponse.json(
        { error: `Cannot submit ${submission.status} submission` },
        { status: 409 }
      );
    }

    // Validate required documents if specified
    if (submission.form?.requiredDocs && Array.isArray(submission.form.requiredDocs)) {
      const requiredDocs = submission.form.requiredDocs as Array<Record<string, unknown>>;
      const requiredDocCodes = requiredDocs
        .filter((doc) => doc.required !== false)
        .map((doc) => String(doc.code));

      const uploadedDocCodes = submission.documents.map((doc) => doc.documentCode).filter(Boolean);

      const missingDocs = requiredDocCodes.filter((code) => !uploadedDocCodes.includes(code));

      if (missingDocs.length > 0) {
        return NextResponse.json(
          {
            error: 'Missing required documents',
            missingDocuments: missingDocs,
          },
          { status: 400 }
        );
      }
    }

    // Update submission to SUBMITTED
    const updatedSubmission = await prisma.hGFSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedById: session.user.id,
        remarks: remarks || null,
      },
    });

    // Log the action
    await prisma.hGFSubmissionAuditLog.create({
      data: {
        submissionId,
        action: 'SUBMIT',
        changedFields: { status: 'DRAFT -> SUBMITTED' },
        performedById: session.user.id,
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

      // Send confirmation email to crew
      await notifications.sendSubmissionConfirmation(submissionId);

      // Send approval request email to managers
      await notifications.sendApprovalRequest(submissionId);
    } catch (error) {
      console.warn('Failed to send notification emails:', error);
      // Don't fail the API response if emails fail
    }

    return NextResponse.json({
      data: updatedSubmission,
      message: 'Submission submitted successfully. Pending review.',
    });
  } catch (error) {
    console.error('Error submitting HGF submission:', error);
    return NextResponse.json(
      { error: 'Failed to submit HGF submission' },
      { status: 500 }
    );
  }
}
