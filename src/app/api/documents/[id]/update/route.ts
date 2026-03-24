import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateDocument } from '@/lib/documents/service';
import type { Role } from '@prisma/client';
import { z } from 'zod';

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  documentType: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  contentUrl: z.string().url().optional().nullable().or(z.literal("")),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
}).strict();

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
    const parsedBody = updateDocumentSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid document update payload', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsedBody.data;

    const document = await updateDocument(id, {
      ...data,
      userId: session.user.id,
      userRole: session.user.role as Role,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'DOCUMENT_CONTROL_UPDATED',
        entityType: 'DocumentControl',
        entityId: id,
      },
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
