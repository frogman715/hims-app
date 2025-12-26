import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";
import { join } from "path";
import { existsSync } from "fs";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun } from "docx";

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

// Map crew data to form fields
const CREW_DATA_MAPPER = {
  "name": (crew: any) => crew.fullName,
  "fullName": (crew: any) => crew.fullName,
  "passport": (crew: any) => crew.passportNumber,
  "passportNumber": (crew: any) => crew.passportNumber,
  "passportExpiry": (crew: any) => crew.passportExpiry?.toISOString().split('T')[0],
  "rank": (crew: any) => crew.rank,
  "position": (crew: any) => crew.rank,
  "email": (crew: any) => crew.email,
  "phone": (crew: any) => crew.phone,
  "address": (crew: any) => crew.address,
  "dateOfBirth": (crew: any) => crew.dateOfBirth?.toISOString().split('T')[0],
  "dob": (crew: any) => crew.dateOfBirth?.toISOString().split('T')[0],
  "nationality": (crew: any) => crew.nationality,
  "seamanBookNumber": (crew: any) => crew.seamanBookNumber,
  "seamanBookExpiry": (crew: any) => crew.seamanBookExpiry?.toISOString().split('T')[0],
  "emergencyContact": (crew: any) => crew.emergencyContactName,
  "emergencyContactName": (crew: any) => crew.emergencyContactName,
  "emergencyContactPhone": (crew: any) => crew.emergencyContactPhone,
  "emergencyContactRelation": (crew: any) => crew.emergencyContactRelation,
  "bloodType": (crew: any) => crew.bloodType,
  "height": (crew: any) => crew.heightCm?.toString(),
  "weight": (crew: any) => crew.weightKg?.toString(),
};

async function fillExcelForm(filePath: string, crewData: any): Promise<Buffer> {
  try {
    const fileContent = readFileSync(filePath);
    const workbook = XLSX.read(fileContent, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Simple approach: Find cells that match crew field names and fill them
    for (const cell in worksheet) {
      if (cell.startsWith("!")) continue;
      
      const cellValue = worksheet[cell].v;
      if (!cellValue) continue;

      const cellStr = String(cellValue).toLowerCase();
      
      // Check if cell contains a crew field reference
      for (const [fieldKey, mapper] of Object.entries(CREW_DATA_MAPPER)) {
        if (cellStr.includes(fieldKey.toLowerCase()) || cellStr.includes(`{${fieldKey}}`)) {
          const value = mapper(crewData);
          if (value) {
            worksheet[cell].v = value;
          }
        }
      }
    }

    // Also fill based on cell position patterns (for forms with standard layouts)
    const updatedContent = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return updatedContent;
  } catch (error) {
    console.error("Error filling Excel form:", error);
    // Return original file if filling fails
    return readFileSync(filePath);
  }
}

async function fillWordForm(filePath: string, crewData: any): Promise<Buffer> {
  try {
    // For Word documents, we'll create a simple approach with placeholder replacement
    const fileContent = readFileSync(filePath);
    
    // Create a new document with crew info header
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "PRE-FILLED FORM DATA",
              bold: true,
              size: 28,
            }),
            new Paragraph({
              text: `Crew Name: ${crewData.fullName || "N/A"}`,
              size: 22,
            }),
            new Paragraph({
              text: `Rank: ${crewData.rank || "N/A"}`,
              size: 22,
            }),
            new Paragraph({
              text: `Passport: ${crewData.passportNumber || "N/A"}`,
              size: 22,
            }),
            new Paragraph({
              text: `Email: ${crewData.email || "N/A"}`,
              size: 22,
            }),
            new Paragraph({
              text: `Phone: ${crewData.phone || "N/A"}`,
              size: 22,
            }),
            new Paragraph({
              text: "---",
              size: 22,
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    console.error("Error filling Word form:", error);
    // Return original file if filling fails
    return readFileSync(filePath);
  }
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
    const crewId = searchParams.get("crewId");

    if (!categoryParam || !filename || !crewId) {
      return NextResponse.json(
        { error: "Missing category, filename, or crewId" },
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

    // Verify file exists
    if (!existsSync(filePath) || !filePath.startsWith(FORM_REFERENCE_PATH)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Fetch crew data
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
    });

    if (!crew) {
      return NextResponse.json(
        { error: "Crew not found" },
        { status: 404 }
      );
    }

    // Fill form based on file type
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    let fileContent: Buffer;

    if (["xlsx", "xls"].includes(ext)) {
      fileContent = await fillExcelForm(filePath, crew);
    } else if (["docx", "doc"].includes(ext)) {
      fileContent = await fillWordForm(filePath, crew);
    } else {
      // For other types, just return original
      fileContent = readFileSync(filePath);
    }

    // Determine MIME type
    const mimeTypes: Record<string, string> = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
      pdf: "application/pdf",
    };

    const mimeType = mimeTypes[ext] || "application/octet-stream";
    
    // Rename file to include crew name
    const crewNameSlug = crew.fullName?.replace(/\s+/g, "_").toLowerCase() || "crew";
    const nameWithoutExt = filename.replace(`.${ext}`, "");
    const newFilename = `${nameWithoutExt}_${crewNameSlug}.${ext}`;

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${newFilename}"`,
        "Content-Length": fileContent.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
