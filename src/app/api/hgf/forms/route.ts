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
    const formType = searchParams.get('formType');
    const isActive = searchParams.get('isActive');

    const where: Record<string, Record<string, string | boolean> | string | boolean> = {};
    if (formCode) where.formCode = { contains: formCode, mode: 'insensitive' };
    if (formType) where.formType = formType;
    if (isActive !== null) where.isActive = isActive === 'true';

    const forms = await prisma.hGFForm.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: { select: { id: true, status: true } },
        validationRules: { select: { id: true, fieldName: true, ruleType: true } },
      },
    });

    // Map forms with metadata
    const formsWithMetadata = forms.map((form) => ({
      ...form,
      submissionCount: form.submissions.length,
      submissionStats: {
        total: form.submissions.length,
        approved: form.submissions.filter((s) => s.status === 'APPROVED').length,
        pending: form.submissions.filter((s) => s.status === 'PENDING_REVIEW' || s.status === 'SUBMITTED').length,
        rejected: form.submissions.filter((s) => s.status === 'REJECTED').length,
      },
      validationRuleCount: form.validationRules.length,
      submissions: undefined, // Remove for cleaner response
    }));

    return NextResponse.json({
      data: formsWithMetadata,
      count: forms.length,
    });
  } catch (error) {
    console.error('Error fetching HGF forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HGF forms' },
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

    // Only QMR and higher can create forms
    if (!['QMR', 'CDMO', 'DIRECTOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Only QMR and above can create forms' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { formCode, procedureId, name, description, formType, fieldsJson, sectionsJson, validationJson, requiredDocs } = body;

    // Validate required fields
    if (!formCode || !name || !formType || !fieldsJson) {
      return NextResponse.json(
        { error: 'Missing required fields: formCode, name, formType, fieldsJson' },
        { status: 400 }
      );
    }

    // Check if form code already exists
    const existingForm = await prisma.hGFForm.findUnique({
      where: { formCode },
    });

    if (existingForm) {
      return NextResponse.json(
        { error: 'Form code already exists' },
        { status: 409 }
      );
    }

    // Create the form
    const form = await prisma.hGFForm.create({
      data: {
        formCode,
        procedureId,
        name,
        description,
        formType,
        fieldsJson: fieldsJson,
        sectionsJson: sectionsJson || null,
        validationJson: validationJson || null,
        requiredDocs: requiredDocs || null,
        isActive: true,
        version: 1,
      },
    });

    // If validation rules provided, create them
    if (body.validationRules && Array.isArray(body.validationRules)) {
      interface ValidationRuleInput {
        fieldName: string;
        ruleType: string;
        ruleValue?: string;
        errorMessage: string;
        dependsOnField?: string;
        dependsOnValue?: string;
        orderIndex?: number;
      }

      await Promise.all(
        body.validationRules.map((rule: ValidationRuleInput) =>
          prisma.formValidationRule.create({
            data: {
              formId: form.id,
              fieldName: rule.fieldName,
              ruleType: rule.ruleType,
              ruleValue: rule.ruleValue || null,
              errorMessage: rule.errorMessage,
              dependsOnField: rule.dependsOnField || null,
              dependsOnValue: rule.dependsOnValue || null,
              orderIndex: rule.orderIndex || 0,
            },
          })
        )
      );
    }

    return NextResponse.json(
      {
        data: form,
        message: 'HGF form created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating HGF form:', error);
    return NextResponse.json(
      { error: 'Failed to create HGF form' },
      { status: 500 }
    );
  }
}
