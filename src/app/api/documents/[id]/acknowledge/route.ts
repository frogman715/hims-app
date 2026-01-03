import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { acknowledgeDocument } from '@/lib/documents/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await req.json();

    const acknowledgement = await acknowledgeDocument(
      id,
      session.user.id,
      data.remarks
    );

    return NextResponse.json(acknowledgement);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to acknowledge document';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
