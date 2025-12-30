import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { DataSensitivity as PrismaDataSensitivity, Prisma } from "@prisma/client";
import { hasSensitivityAccess, UserRole, DataSensitivity } from "@/lib/permissions";
import { maskDocumentNumber } from "@/lib/masking";

// Configure max body size for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export const GET = withPermission(
  "documents",
  PermissionLevel.VIEW_ACCESS,
  async (_req, session) => {
    try {
      const userRoles = session.user.roles ?? [];
    const normalizedRoles = normalizeRoles(userRoles);
    const isCrewPortalOnly = normalizedRoles.length === 1 && normalizedRoles[0] === UserRole.CREW_PORTAL;

    const whereClause: Prisma.CrewDocumentWhereInput = {};
    if (isCrewPortalOnly) {
      whereClause.crewId = session.user.id;
    }

    const documents = await prisma.crewDocument.findMany({
      where: whereClause,
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

    const canViewAmber = hasSensitivityAccess(normalizedRoles, DataSensitivity.AMBER);
    const canViewRed = hasSensitivityAccess(normalizedRoles, DataSensitivity.RED);

    const sanitizedDocuments = documents.map((document) => {
      const prismaToLibSensitivity: Record<PrismaDataSensitivity, DataSensitivity> = {
        RED: DataSensitivity.RED,
        AMBER: DataSensitivity.AMBER,
        GREEN: DataSensitivity.GREEN,
      };
      const libSensitivity = prismaToLibSensitivity[document.sensitivity];
      const requiresMask =
        (libSensitivity === DataSensitivity.RED && !canViewRed) ||
        (libSensitivity === DataSensitivity.AMBER && !canViewAmber);

      return {
        ...document,
        docNumber:
          document.docNumber && requiresMask
            ? maskDocumentNumber(document.docNumber)
            : document.docNumber,
        fileUrl: requiresMask ? null : document.fileUrl,
      };
    });

      return NextResponse.json(sanitizedDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }
  }
);

export const POST = withPermission(
  "documents",
  PermissionLevel.EDIT_ACCESS,
  async (request: NextRequest, session) => {
    try {
      const userRoles = session.user.roles ?? [];
    const normalizedRoles = normalizeRoles(userRoles);
    const isCrewPortalOnly = normalizedRoles.length === 1 && normalizedRoles[0] === UserRole.CREW_PORTAL;

    const formData = await request.formData();
    const crewId = String(formData.get('seafarerId') ?? "").trim();
    const docType = String(formData.get('docType') ?? "").trim();
    const docNumber = String(formData.get('docNumber') ?? "").trim();
    const issueDate = String(formData.get('issueDate') ?? "").trim();
    const expiryDate = String(formData.get('expiryDate') ?? "").trim();
    const remarks = formData.get('remarks');
    const file = formData.get('file') as File | null;

    if (!crewId || !docType || !docNumber || !issueDate || !expiryDate || !file) {
      const missing = [];
      if (!crewId) missing.push('seafarerId');
      if (!docType) missing.push('docType');
      if (!docNumber) missing.push('docNumber');
      if (!issueDate) missing.push('issueDate');
      if (!expiryDate) missing.push('expiryDate');
      if (!file) missing.push('file');
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    if (isCrewPortalOnly && crewId !== session.user.id) {
      return NextResponse.json({ error: "Crew portal users can only upload their own documents" }, { status: 403 });
    }

    const crewExists = await prisma.crew.findUnique({
      where: { id: crewId },
      select: { id: true },
    });

    if (!crewExists) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    const parsedIssueDate = new Date(issueDate);
    const parsedExpiryDate = new Date(expiryDate);

    if (Number.isNaN(parsedIssueDate.getTime()) || Number.isNaN(parsedExpiryDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Please use YYYY-MM-DD format for both issue date and expiry date" },
        { status: 400 }
      );
    }

    if (parsedExpiryDate <= parsedIssueDate) {
      return NextResponse.json(
        { error: "Expiry date must be after issue date" },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Get crew name for readable filename
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      select: { fullName: true }
    });
    
    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    // Generate professional filename: {date}_{crewid}_{doctype}_{docnumber}.{ext}
    // Format: 20251230_clxuser001_coc_620027165IN20225.jpg
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const docNumberSafe = docNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
    const docTypeSafe = docType.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const fileName = `${timestamp}_${crewId}_${docTypeSafe}_${docNumberSafe}${allowedExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/documents/${fileName}`;

    const normalizedDocType = docType.toUpperCase();

    // Save to database
    const document = await prisma.crewDocument.create({
      data: {
        crewId,
        docType: normalizedDocType,
        docNumber,
        issueDate: parsedIssueDate,
        expiryDate: parsedExpiryDate,
        remarks: remarks ? String(remarks).trim() : null,
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
);

function normalizeRoles(roles: string[] | undefined): UserRole[] {
  if (!roles || roles.length === 0) {
    return [UserRole.CREW_PORTAL];
  }

  const validRoles = new Set<string>(Object.values(UserRole));
  const normalized = roles
    .map((role) => role.trim().toUpperCase())
    .filter((role) => validRoles.has(role)) as UserRole[];

  return normalized.length > 0 ? normalized : [UserRole.CREW_PORTAL];
}