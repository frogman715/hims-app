import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { distributeDocument } from '@/lib/documents/service';
import type { Role } from '@prisma/client';
import { z } from 'zod';

const distributeDocumentSchema = z.object({
  recipientIds: z.array(z.string().min(1)).min(1, 'At least one recipient is required'),
}).strict();

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
    const parsedBody = distributeDocumentSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid document distribution payload', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsedBody.data;

    const distributions = await distributeDocument(
      id,
      data.recipientIds,
      session.user.id,
      session.user.role as Role
    );

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'DOCUMENT_CONTROL_DISTRIBUTED',
        entityType: 'DocumentControl',
        entityId: id,
        metadataJson: {
          recipientCount: data.recipientIds.length,
        },
      },
    });

    return NextResponse.json(distributions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to distribute document';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
