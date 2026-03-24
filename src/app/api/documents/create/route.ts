import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDocument } from '@/lib/documents/service';
import { z } from 'zod';

const createDocumentSchema = z.object({
  code: z.string().min(1, 'Document code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().trim().optional().nullable(),
  documentType: z.string().min(1, 'Document type is required'),
  department: z.string().min(1, 'Department is required'),
  retentionPeriod: z.string().optional(),
  effectiveDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  contentUrl: z.string().url().optional().nullable().or(z.literal("")),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parsedBody = createDocumentSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid document payload', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsedBody.data;

    const document = await createDocument({
      code: data.code,
      title: data.title,
      description: data.description,
      documentType: data.documentType,
      department: data.department,
      retentionPeriod: data.retentionPeriod || 'ONE_YEAR',
      effectiveDate: new Date(data.effectiveDate || new Date()),
      createdById: session.user.id,
      contentUrl: data.contentUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'DOCUMENT_CONTROL_CREATED',
        entityType: 'DocumentControl',
        entityId: document.id,
        metadataJson: {
          code: document.code,
          title: document.title,
          documentType: document.documentType,
          department: document.department,
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create document';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
