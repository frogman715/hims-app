import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public/uploads/photos");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Generate professional filename: {date}_{seafarerid}_{hash}.{ext}
    // Format: 20251230_cm123abc_a7f2e.jpg
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomHash = Math.random().toString(36).substring(2, 7);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${timestamp}_${seafarerId}_${randomHash}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const photoUrl = `/uploads/photos/${filename}`;

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
