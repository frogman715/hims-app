import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import {
  buildCrewFilePath,
  generateSafeFilename,
  getRelativePath,
  getMaxFileSize,
} from '@/lib/upload-path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const submissionId = formData.get('submissionId') as string;
    const documentType = formData.get('documentType') as string;
    const documentCode = formData.get('documentCode') as string | null;

    // Validate inputs
    if (!file || !submissionId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, submissionId, documentType' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Allowed: PDF, JPEG, PNG',
        },
        { status: 400 }
      );
    }

    // Validate file size using centralized config
    const maxFileSize = getMaxFileSize();
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${maxSizeMB}MB`,
        },
        { status: 400 }
      );
    }

    // Check submission exists and get crew info
    const submission = await prisma.hGFSubmission.findUnique({
      where: { id: submissionId },
      include: {
        crew: {
          select: { fullName: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Generate crew slug from full name
    const crewSlug = submission.crew.fullName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    // Generate unique filename with timestamp and document code
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${submissionId}-${documentCode || documentType}-${timestamp}.${ext}`;
    
    // Build full file path using centralized utility
    const filePath = buildCrewFilePath(submission.crewId, crewSlug, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Store relative path in database for portability
    const relativePath = getRelativePath(filePath);
    const fileUrl = `/api/files/${relativePath}`;

    // Create document record
    const documentRecord = await prisma.documentUpload.create({
      data: {
        submissionId,
        crewId: submission.crewId,
        documentType,
        documentCode: documentCode || null,
        documentTitle: file.name,
        fileName,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: session.user.id,
        uploadedAt: new Date(),
      },
    });

    // Log the action
    await prisma.hGFSubmissionAuditLog.create({
      data: {
        submissionId,
        action: 'UPLOAD_DOCUMENT',
        changedFields: {
          documentType,
          fileName,
        },
        performedById: session.user.id,
      },
    });

    return NextResponse.json(
      {
        data: documentRecord,
        message: 'Document uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId parameter is required' },
        { status: 400 }
      );
    }

    const documents = await prisma.documentUpload.findMany({
      where: { submissionId },
      include: {
        uploadedBy: { select: { name: true } },
        verifiedBy: { select: { name: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
