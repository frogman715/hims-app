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

    const finding = await auditService.createAuditFinding({
      auditId: id,
      findingCode: data.findingCode,
      description: data.description,
      severity: data.severity,
      relatedDocId: data.relatedDocId,
      relatedProcess: data.relatedProcess,
      assignedToId: data.assignedToId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    return NextResponse.json(finding, { status: 201 });
  } catch (error) {
    console.error('Error creating finding:', error);
    return NextResponse.json(
      { error: 'Failed to create finding' },
      { status: 500 }
    );
  }
}
