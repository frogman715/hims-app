import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as auditService from '@/lib/audit/service';
import { ComplianceAuditStatus, ComplianceAuditType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const audit = await auditService.createAudit({
      auditNumber: data.auditNumber,
      auditType: data.auditType,
      scope: data.scope,
      objectives: data.objectives,
      auditCriteria: data.auditCriteria,
      leadAuditorId: session.user.id,
      assistantAuditors: data.assistantAuditors,
      auditeeContactPerson: data.auditeeContactPerson,
      auditeeContactEmail: data.auditeeContactEmail,
      auditeeContactPhone: data.auditeeContactPhone,
      estimatedDuration: data.estimatedDuration,
      location: data.location,
      auditDate: data.auditDate ? new Date(data.auditDate) : undefined,
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('Error creating audit:', error);
    return NextResponse.json(
      { error: 'Failed to create audit' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const auditType = searchParams.get('auditType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const audits = await auditService.listAudits({
      status: status as ComplianceAuditStatus | undefined,
      auditType: auditType as ComplianceAuditType | undefined,
      limit,
      offset,
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error('Error listing audits:', error);
    return NextResponse.json(
      { error: 'Failed to list audits' },
      { status: 500 }
    );
  }
}
