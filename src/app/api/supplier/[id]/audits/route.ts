import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as supplierService from '@/lib/supplier/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { id } = await params;

    const audit = await supplierService.scheduleSupplierAudit({
      supplierId: id,
      auditCode: data.auditCode,
      title: data.title,
      scope: data.scope,
      plannedDate: new Date(data.plannedDate),
      auditorId: session.user.id,
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('Error scheduling audit:', error);
    return NextResponse.json(
      { error: 'Failed to schedule audit' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const audits = await supplierService.listSupplierAudits({
      supplierId: id,
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
