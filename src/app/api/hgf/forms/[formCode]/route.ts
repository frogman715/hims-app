import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formCode: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formCode } = await params;

    const form = await prisma.hGFForm.findUnique({
      where: { formCode },
      include: {
        validationRules: true,
        submissions: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            submittedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: form });
  } catch (error) {
    console.error('Error fetching HGF form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HGF form' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formCode: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QMR and higher can update forms
    if (!['QMR', 'CDMO', 'DIRECTOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Only QMR and above can update forms' },
        { status: 403 }
      );
    }

    const { formCode } = await params;

    const body = await request.json();
    const { name, description, fieldsJson, sectionsJson, validationJson, requiredDocs, isActive } = body;

    // Update form
    const form = await prisma.hGFForm.update({
      where: { formCode },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(fieldsJson && { fieldsJson }),
        ...(sectionsJson !== undefined && { sectionsJson }),
        ...(validationJson !== undefined && { validationJson }),
        ...(requiredDocs !== undefined && { requiredDocs }),
        ...(isActive !== undefined && { isActive }),
        version: { increment: 1 },
      },
    });

    return NextResponse.json({
      data: form,
      message: 'Form updated successfully',
    });
  } catch (error) {
    console.error('Error updating HGF form:', error);
    return NextResponse.json(
      { error: 'Failed to update HGF form' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formCode: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only CDMO and DIRECTOR can delete forms
    if (!['CDMO', 'DIRECTOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Only CDMO and above can delete forms' },
        { status: 403 }
      );
    }

    const { formCode } = await params;

    // Check if form has submissions
    const submissionCount = await prisma.hGFSubmission.count({
      where: { formId: (await prisma.hGFForm.findUnique({ where: { formCode }, select: { id: true } }))?.id },
    });

    if (submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete form with existing submissions. Archive instead.' },
        { status: 409 }
      );
    }

    // Delete validation rules first (cascade)
    await prisma.formValidationRule.deleteMany({
      where: {
        form: { formCode },
      },
    });

    // Delete form
    await prisma.hGFForm.delete({
      where: { formCode },
    });

    return NextResponse.json({
      message: 'Form deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting HGF form:', error);
    return NextResponse.json(
      { error: 'Failed to delete HGF form' },
      { status: 500 }
    );
  }
}
