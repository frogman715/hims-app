import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteDocument } from '@/lib/documents/service';
import type { Role } from '@prisma/client';

export async function DELETE(
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

    const result = await deleteDocument(
      id,
      session.user.id,
      session.user.role as Role
    );

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'DOCUMENT_CONTROL_DELETED',
        entityType: 'DocumentControl',
        entityId: id,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
