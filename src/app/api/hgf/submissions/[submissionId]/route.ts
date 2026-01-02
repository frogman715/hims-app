import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submissionId } = await params;

    const submission = await prisma.hGFSubmission.findUnique({
      where: { id: submissionId },
      include: {
        form: true,
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            seamanBookNumber: true,
          },
        },
        application: true,
        submittedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
        documents: {
          include: {
            uploadedBy: { select: { name: true } },
            verifiedBy: { select: { name: true } },
          },
        },
        auditLog: {
          orderBy: { performedAt: 'desc' },
          take: 20,
          include: { performedBy: { select: { name: true } } },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error('Error fetching HGF submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HGF submission' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { submittedData, remarks } = body;

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

    // Only draft submissions can be updated
    if (submission.status !== 'DRAFT' && submission.status !== 'REVISIONS_NEEDED') {
      return NextResponse.json(
        { error: 'Only DRAFT and REVISIONS_NEEDED submissions can be updated' },
        { status: 409 }
      );
    }

    // Update submission
    const updatedSubmission = await prisma.hGFSubmission.update({
      where: { id: submissionId },
      data: {
        ...(submittedData && { submittedData }),
        ...(remarks && { remarks }),
        updatedAt: new Date(),
      },
    });

    // Log the change
    await prisma.hGFSubmissionAuditLog.create({
      data: {
        submissionId,
        action: 'UPDATE',
        changedFields: {
          submittedData: !!submittedData,
          remarks: !!remarks,
        },
        performedById: session.user.id,
      },
    });

    return NextResponse.json({
      data: updatedSubmission,
      message: 'Submission updated successfully',
    });
  } catch (error) {
    console.error('Error updating HGF submission:', error);
    return NextResponse.json(
      { error: 'Failed to update HGF submission' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submissionId } = await params;

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

    // Only draft submissions can be deleted
    if (submission.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT submissions can be deleted' },
        { status: 409 }
      );
    }

    // Delete documents first
    await prisma.documentUpload.deleteMany({
      where: { submissionId },
    });

    // Delete audit logs
    await prisma.hGFSubmissionAuditLog.deleteMany({
      where: { submissionId },
    });

    // Delete submission
    await prisma.hGFSubmission.delete({
      where: { id: submissionId },
    });

    return NextResponse.json({
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting HGF submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete HGF submission' },
      { status: 500 }
    );
  }
}
