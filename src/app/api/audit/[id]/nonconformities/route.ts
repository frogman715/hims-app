import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as auditService from '@/lib/audit/service';

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

    const nc = await auditService.createNonConformity({
      auditId: id,
      ncNumber: data.ncNumber,
      description: data.description,
      rootCause: data.rootCause,
      assignedToId: data.assignedToId,
      targetDate: new Date(data.targetDate),
    });

    return NextResponse.json(nc, { status: 201 });
  } catch (error) {
    console.error('Error creating non-conformity:', error);
    return NextResponse.json(
      { error: 'Failed to create non-conformity' },
      { status: 500 }
    );
  }
}
