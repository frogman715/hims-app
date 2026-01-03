import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateDocument } from '@/lib/documents/service';

export async function PUT(
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

    const document = await updateDocument(id, {
      ...data,
      userId: session.user.id,
      userRole: session.user.role as any,
    });

    return NextResponse.json(document);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update document';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
