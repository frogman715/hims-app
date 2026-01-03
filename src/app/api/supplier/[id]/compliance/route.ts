import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as supplierService from '@/lib/supplier/service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const compliance = await supplierService.listSupplierCompliance(params.id);
    return NextResponse.json(compliance);
  } catch (error) {
    console.error('Error listing compliance:', error);
    return NextResponse.json(
      { error: 'Failed to list compliance' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const compliance = await supplierService.recordSupplierCompliance({
      supplierId: params.id,
      requirement: data.requirement,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      evidence: data.evidence,
      notes: data.notes,
    });

    return NextResponse.json(compliance, { status: 201 });
  } catch (error) {
    console.error('Error recording compliance:', error);
    return NextResponse.json(
      { error: 'Failed to record compliance' },
      { status: 500 }
    );
  }
}
