import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import {
  buildCrewFilePath,
  generateSafeFilename,
  getRelativePath,
  getMaxFileSize,
} from "@/lib/upload-path";

// Configure max body size for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: seafarerId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size using centralized config
    const maxFileSize = getMaxFileSize();
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { error: `File size must be less than ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Get crew info for directory name
    const crew = await prisma.crew.findUnique({
      where: { id: seafarerId },
      select: { fullName: true },
    });

    if (!crew) {
      return NextResponse.json(
        { error: "Seafarer not found" },
        { status: 404 }
      );
    }

    // Generate crew slug from full name
    const crewSlug = crew.fullName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    // Generate safe filename
    const filename = generateSafeFilename(seafarerId, "photo", file.name);

    // Build full file path using centralized utility
    const filepath = buildCrewFilePath(seafarerId, crewSlug, filename);

    // Save file with error handling and logging
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('[PHOTO_UPLOAD] Attempting to write file:', {
      filepath,
      filename,
      bufferSize: buffer.length,
      timestamp: new Date().toISOString()
    });
    
    try {
      await writeFile(filepath, buffer);
      console.log('[PHOTO_UPLOAD] File written successfully:', filepath);
    } catch (writeError) {
      console.error('[PHOTO_UPLOAD] writeFile failed:', {
        error: writeError instanceof Error ? writeError.message : String(writeError),
        code: (writeError as NodeJS.ErrnoException)?.code,
        errno: (writeError as NodeJS.ErrnoException)?.errno,
        filepath,
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

    // Store relative path in database for portability
    const relativePath = getRelativePath(filepath);
    const photoUrl = `/api/files/${relativePath}`;

    // Update crew/seafarer with photoUrl
    await prisma.crew.update({
      where: { id: seafarerId },
      data: { photoUrl },
    });

    return NextResponse.json(
      { photoUrl, message: "Photo uploaded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
