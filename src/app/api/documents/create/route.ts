import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDocument } from '@/lib/documents/service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Validate required fields
    if (!data.code || !data.title || !data.documentType || !data.department) {
      return NextResponse.json(
        { error: 'Missing required fields: code, title, documentType, department' },
        { status: 400 }
      );
    }

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

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create document';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
