import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { distributeDocument } from '@/lib/documents/service';
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
    const data = await req.json();

    if (!data.recipientIds || !Array.isArray(data.recipientIds)) {
      return NextResponse.json(
        { error: 'recipientIds must be an array' },
        { status: 400 }
      );
    }

    const distributions = await distributeDocument(
      id,
      data.recipientIds,
      session.user.id,
      session.user.role as Role
    );

    return NextResponse.json(distributions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to distribute document';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
