import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check documents permission
    if (!checkPermission(session, 'documents', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const documents = await prisma.crewDocument.findMany({
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check documents permission for editing
    if (!checkPermission(session, 'documents', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to upload documents" }, { status: 403 });
    }

    const formData = await request.formData();
    const crewId = formData.get('seafarerId') as string;
    const docType = formData.get('docType') as string;
    const docNumber = formData.get('docNumber') as string;
    const issueDate = formData.get('issueDate') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const remarks = formData.get('remarks') as string;
    const file = formData.get('file') as File;

    if (!crewId || !docType || !docNumber || !issueDate || !expiryDate || !file) {
      return NextResponse.json({ error: "Crew ID, document type, document number, issue date, expiry date, and file are required" }, { status: 400 });
    }

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

    const publicUrl = `/uploads/documents/${fileName}`;

    // Save to database
    const document = await prisma.crewDocument.create({
      data: {
        crewId,
        docType,
        docNumber,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        remarks: remarks || null,
        fileUrl: publicUrl,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}