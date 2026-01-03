import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { approveDocument, rejectDocument } from '@/lib/documents/service';
import type { Role } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, approvalId } = await params;
    const data = await req.json();

    if (!data.action || !['approve', 'reject'].includes(data.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (data.action === 'reject' && !data.rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    let result;
    if (data.action === 'approve') {
      result = await approveDocument(
        id,
        approvalId,
        session.user.id,
        session.user.role as Role,
        data.comments
      );
    } else {
      result = await rejectDocument(
        id,
        approvalId,
        session.user.id,
        data.rejectionReason as string
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process approval';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
