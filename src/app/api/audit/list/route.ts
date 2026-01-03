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
      auditCode: data.auditCode,
      auditType: data.auditType,
      title: data.title,
      description: data.description,
      scope: data.scope,
      leadAuditorId: session.user.id,
      teamMembers: data.teamMembers,
      plannedDate: new Date(data.plannedDate),
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
    const status = searchParams.get('status');
    const auditType = searchParams.get('auditType');
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
