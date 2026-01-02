import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formCode = searchParams.get('formCode');
    const status = searchParams.get('status');
    const crewId = searchParams.get('crewId');
    const applicationId = searchParams.get('applicationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, string | Record<string, unknown>> = {};
    if (formCode) where.formCode = formCode;
    if (status) where.status = status;
    if (crewId) where.crewId = crewId;
    if (applicationId) where.applicationId = applicationId;

    const [submissions, total] = await Promise.all([
      prisma.hGFSubmission.findMany({
        where,
        include: {
          form: { select: { name: true, formType: true } },
          crew: { select: { id: true, fullName: true } },
          application: { select: { id: true } },
          submittedBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
          documents: { select: { id: true, verificationStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.hGFSubmission.count({ where }),
    ]);

    return NextResponse.json({
      data: submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching HGF submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HGF submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { formId, crewId, applicationId, submittedData } = body;

    // Validate required fields
    if (!formId || (!crewId && !applicationId)) {
      return NextResponse.json(
        { error: 'Missing required fields: formId, and either crewId or applicationId' },
        { status: 400 }
      );
    }

    // Get form details
    const form = await prisma.hGFForm.findUnique({
      where: { id: formId },
      select: { formCode: true },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Check if submission already exists
    const existingSubmission = await prisma.hGFSubmission.findFirst({
      where: {
        formId,
        crewId: crewId || null,
        applicationId: applicationId || null,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Submission already exists for this form and crew/application combination' },
        { status: 409 }
      );
    }

    // Create submission
    const submission = await prisma.hGFSubmission.create({
      data: {
        formId,
        formCode: form.formCode,
        crewId: crewId || null,
        applicationId: applicationId || null,
        submittedData: submittedData || {},
        status: 'DRAFT',
      },
      include: {
        form: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        data: submission,
        message: 'Submission created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating HGF submission:', error);
    return NextResponse.json(
      { error: 'Failed to create HGF submission' },
      { status: 500 }
    );
  }
}
