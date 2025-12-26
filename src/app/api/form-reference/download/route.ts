import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFileSync } from "fs";
import { join } from "path";
import { existsSync } from "fs";

const FORM_REFERENCE_PATH = join(
  process.cwd(),
  "src/form_reference"
);

const CATEGORY_MAPPING: Record<string, string> = {
  "hgf-cr": "CR",
  "hgf-ad": "AD",
  "hgf-ac": "AC",
  intergis: "INTEGRIS CO.,LTD",
  lundqvist: "LUNDQVIST REDERIERNA",
};

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    pdf: "application/pdf",
    jpg: "image/jpeg",
    png: "image/png",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export const GET = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Allow directors, HR staff, and system admins
    const userRoles = session.user?.roles || [];
    const hasAccess =
      userRoles.includes("DIRECTOR") ||
      userRoles.includes("HR") ||
      userRoles.includes("HR_ADMIN") ||
      session.user?.isSystemAdmin;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const filename = searchParams.get("filename");

    if (!categoryParam || !filename) {
      return NextResponse.json(
        { error: "Missing category or filename" },
        { status: 400 }
      );
    }

    const categoryPath = CATEGORY_MAPPING[categoryParam];
    if (!categoryPath) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    const filePath = join(FORM_REFERENCE_PATH, categoryPath, filename);

    // Verify file exists and is within the form reference path
    if (!existsSync(filePath) || !filePath.startsWith(FORM_REFERENCE_PATH)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Read and serve the file
    const fileContent = readFileSync(filePath);
    const mimeType = getMimeType(filename);

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileContent.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
