import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitForApproval } from '@/lib/documents/service';
import type { Role } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const document = await submitForApproval(
      id,
      session.user.id,
      session.user.role as Role
    );

    return NextResponse.json(document);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit for approval';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
