import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import { extname, join } from "path";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import {
  buildCrewFilePath,
  getRelativePath,
  getMaxFileSize,
  generateCrewDocumentFilename,
  getAbsolutePath,
  deleteFileSafe,
} from "@/lib/upload-path";

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

    // Authorization: Check ownership or admin role
    // Non-admin users can only view their own crew's documents
    const isAdmin = session.user?.roles?.includes('ADMIN') || session.user?.roles?.includes('DIRECTOR');
    const isOwnDocument = document.crew.id === session.user?.id; // Assuming crewId is stored in session.user.id
    
    if (!isAdmin && !isOwnDocument) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Normalize dates to ISO strings for consistent FE handling
    // Normalize fileUrl: ensure leading slash for legacy values
    let normalizedFileUrl = document.fileUrl;
    if (normalizedFileUrl && !normalizedFileUrl.startsWith('/')) {
      normalizedFileUrl = `/${normalizedFileUrl}`;
    }

    const response = {
      ...document,
      issueDate: document.issueDate ? new Date(document.issueDate).toISOString() : null,
      expiryDate: document.expiryDate ? new Date(document.expiryDate).toISOString() : null,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
      fileUrl: normalizedFileUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
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
      return NextResponse.json(
        { error: "Insufficient permissions to update documents" },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: "Document type, document number, issue date, and expiry date are required" },
        { status: 400 }
      );
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
      fileUrl?: string | null;
    } = {
      docType,
      docNumber,
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      remarks: remarks || null,
    };

    // Handle file upload if provided
    if (file && file.size > 0) {
      const MAX_FILE_SIZE = getMaxFileSize();
      const ALLOWED_MIME_TYPES: Record<string, string> = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/msword": ".doc",
      };

      const mimeType = file.type || "";
      const declaredExtension = extname(file.name || "").toLowerCase();
      const allowedExtension = ALLOWED_MIME_TYPES[mimeType];

      if (!allowedExtension || (declaredExtension && declaredExtension !== allowedExtension)) {
        const allowedMimes = Object.keys(ALLOWED_MIME_TYPES).join(", ");
        return NextResponse.json(
          { error: `Unsupported file type: ${mimeType || 'unknown'}. Allowed MIME types: ${allowedMimes}` },
          { status: 415 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
        return NextResponse.json(
          { error: `File size (${fileSizeMB}MB) exceeds maximum allowed (${maxSizeMB}MB)` },
          { status: 413 }
        );
      }

      const crew = await prisma.crew.findUnique({
        where: { id: existingDocument.crewId },
        select: { fullName: true, rank: true },
      });

      if (!crew) {
        return NextResponse.json({ error: "Crew not found" }, { status: 404 });
      }

      const crewSlug = crew.fullName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");

      const fileName = generateCrewDocumentFilename({
        crewName: crew.fullName,
        rank: crew.rank,
        docType,
        docNumber,
        extension: allowedExtension,
        issuedAt: updateData.issueDate,
      });

      const filePath = buildCrewFilePath(existingDocument.crewId, crewSlug, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      const relativePath = getRelativePath(filePath);
      updateData.fileUrl = `/api/files/${relativePath}`;
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json(
        { error: "Insufficient permissions to delete documents" },
        { status: 403 }
      );
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

    // Delete file from disk if it exists
    if (existingDocument.fileUrl) {
      try {
        if (existingDocument.fileUrl.startsWith("/api/files/")) {
          const relativePath = existingDocument.fileUrl.replace("/api/files/", "");
          const absolutePath = getAbsolutePath(relativePath);
          deleteFileSafe(absolutePath);
        } else {
          const fileName = existingDocument.fileUrl.split("/").pop();

          // Validate fileName to prevent directory traversal attacks
          if (fileName && /^[\w\-\.]+$/.test(fileName)) {
            const filePath = join(process.cwd(), "public", "uploads", "documents", fileName);

            try {
              await unlink(filePath);
            } catch (fileError) {
              // File might not exist, which is acceptable
              // Continue with database delete even if file delete fails
              if ((fileError as NodeJS.ErrnoException).code !== "ENOENT") {
                console.warn("Warning: File deletion failed but was not ENOENT:", fileError);
              }
            }
          } else {
            console.warn("Invalid fileName format, skipping file deletion:", fileName);
          }
        }
      } catch (fileError) {
        console.error("Error processing file deletion:", fileError);
        // Continue with database delete even if file deletion fails
      }
    }

    // Delete document from database
    await prisma.crewDocument.delete({
      where: { id: documentId },
    });

    console.info("Document deleted", {
      documentId,
      crewId: existingDocument.crewId,
      docType: existingDocument.docType,
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
