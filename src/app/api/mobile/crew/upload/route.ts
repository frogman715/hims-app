import { NextRequest, NextResponse } from "next/server";
import { requireUserApi } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

// Configure max body size for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(req: NextRequest) {
  const auth = await requireUserApi(["CREW", "CREW_PORTAL"]);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const rawType = formData.get("type");

  if (!(file instanceof File) || typeof rawType !== "string" || !rawType.trim()) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const uploadType = rawType.trim();

  try {
    const sessionEmail = auth.session.user.email ?? null;
    let crew = await prisma.crew.findUnique({
      where: { id: auth.user.id },
      select: { id: true },
    });

    if (!crew && sessionEmail) {
      crew = await prisma.crew.findFirst({
        where: { email: sessionEmail },
        select: { id: true },
      });
    }

    if (!crew) {
      console.warn("Mobile upload: crew record not found", {
        userId: auth.user.id,
        email: sessionEmail,
        uploadType,
      });
      return NextResponse.json({ error: "Crew record not found" }, { status: 404 });
    }

    // Validate file
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_MIME_TYPES: Record<string, string> = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/heic": ".heic",
      "image/heif": ".heif",
    };

    const mimeType = file.type || "";
    const declaredExtension = extname(file.name || "").toLowerCase();
    const allowedExtension = ALLOWED_MIME_TYPES[mimeType];

    if (!allowedExtension || (declaredExtension && declaredExtension !== allowedExtension)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds maximum allowed (10MB)" }, { status: 413 });
    }

    // Create uploads directory if it doesn't exist
    // Use absolute path: in standalone mode process.cwd() is .next/standalone, not app root
    const uploadsDir = process.env.UPLOADS_DIR || join('/var/www/hims-app', "public", "uploads", "documents");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Generate professional filename: {date}_{crewid}_{uploadtype}_{hash}.{ext}
    // Format: 20251230_cm123abc_medical_a7f2e.jpg
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomHash = Math.random().toString(36).substring(2, 7);
    const uploadTypeSafe = uploadType.toLowerCase().replace(/\s+/g, '_');
    const fileName = `${timestamp}_${crew.id}_${uploadTypeSafe}_${randomHash}${allowedExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file with error handling and logging
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('[MOBILE_UPLOAD] Attempting to write file:', {
      filePath,
      uploadsDir,
      fileName,
      bufferSize: buffer.length,
      timestamp: new Date().toISOString()
    });
    
    try {
      await writeFile(filePath, buffer);
      console.log('[MOBILE_UPLOAD] File written successfully:', filePath);
    } catch (writeError) {
      console.error('[MOBILE_UPLOAD] writeFile failed:', {
        error: writeError instanceof Error ? writeError.message : String(writeError),
        code: (writeError as NodeJS.ErrnoException)?.code,
        errno: (writeError as NodeJS.ErrnoException)?.errno,
        filePath,
        stack: writeError instanceof Error ? writeError.stack : undefined
      });
      
      return NextResponse.json(
        { 
          error: "Failed to save file to disk",
          details: writeError instanceof Error ? writeError.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    const publicUrl = `/uploads/documents/${fileName}`;

    // Save document record to database with PENDING status
    const document = await prisma.crewDocument.create({
      data: {
        crewId: crew.id,
        docType: uploadType.toUpperCase(),
        docNumber: "PENDING",
        issueDate: new Date(),
        expiryDate: null,
        fileUrl: publicUrl,
        remarks: "Uploaded via mobile app - pending review",
      },
    });

    console.info("Mobile upload saved successfully", {
      crewId: crew.id,
      userId: auth.user.id,
      uploadType,
      fileName: file.name,
      fileSize: file.size,
      documentId: document.id,
    });

    return NextResponse.json({ ok: true, documentId: document.id }, { status: 201 });
  } catch (error) {
    console.error("Mobile upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
