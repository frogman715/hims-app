import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as auditService from '@/lib/audit/service';

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

    const ca = await auditService.createCorrectiveAction({
      nonConformityId: params.id,
      caNumber: data.caNumber,
      action: data.action,
      assignedToId: data.assignedToId,
      dueDate: new Date(data.dueDate),
      evidenceDoc: data.evidenceDoc,
    });

    return NextResponse.json(ca, { status: 201 });
  } catch (error) {
    console.error('Error creating corrective action:', error);
    return NextResponse.json(
      { error: 'Failed to create corrective action' },
      { status: 500 }
    );
  }
}
