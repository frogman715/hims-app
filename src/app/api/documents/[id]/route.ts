import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check documents permission
    if (!checkPermission(session, 'documents', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const documentId = id;

    const document = await prisma.crewDocument.findUnique({
      where: { id: documentId },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check documents permission for editing
    if (!checkPermission(session, 'documents', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to update documents" }, { status: 403 });
    }

    const { id } = await params;
    const documentId = id;

    const formData = await request.formData();
    const docType = formData.get('docType') as string;
    const docNumber = formData.get('docNumber') as string;
    const issueDate = formData.get('issueDate') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const remarks = formData.get('remarks') as string;
    const file = formData.get('file') as File;

    if (!docType || !docNumber || !issueDate || !expiryDate) {
      return NextResponse.json({
        error: "Document type, document number, issue date, and expiry date are required"
      }, { status: 400 });
    }

    // Check if document exists
    const existingDocument = await prisma.crewDocument.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const updateData: {
      docType: string;
      docNumber: string;
      issueDate: Date;
      expiryDate: Date;
      remarks: string | null;
      filePath?: string;
      fileName?: string;
      fileSize?: number;
    } = {
      docType,
      docNumber,
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      remarks: remarks || null,
    };

    // Handle file upload if provided
    if (file && file.size > 0) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch {
        // Directory might already exist
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // In a real app, you'd store the file path or URL in the database
      // For now, we'll just update the document
    }

    // Update document
    const document = await prisma.crewDocument.update({
      where: { id: documentId },
      data: updateData,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check documents permission for full access (delete operation)
    if (!checkPermission(session, 'documents', PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to delete documents" }, { status: 403 });
    }

    const { id } = await params;
    const documentId = id;

    // Check if document exists
    const existingDocument = await prisma.crewDocument.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete document
    await prisma.crewDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}