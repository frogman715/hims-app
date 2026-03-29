import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { prisma } from "@/lib/prisma";
import { generateCrewCvPdf } from "@/lib/crew-ops";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withPermission<RouteContext>(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async (req: NextRequest, _session, { params }) => {
    const { id } = await params;
    const format = new URL(req.url).searchParams.get("format");

    const crew = await prisma.crew.findUnique({
      where: { id },
      select: {
        id: true,
        crewCode: true,
        fullName: true,
        rank: true,
        nationality: true,
        placeOfBirth: true,
        dateOfBirth: true,
        phone: true,
        email: true,
        address: true,
        crewStatus: true,
        documents: {
          where: { isActive: true },
          orderBy: { expiryDate: "asc" },
          select: {
            docType: true,
            docNumber: true,
            expiryDate: true,
          },
        },
        seaServiceHistories: {
          orderBy: [{ signOnDate: "desc" }, { createdAt: "desc" }],
          select: {
            vesselName: true,
            companyName: true,
            flag: true,
            rank: true,
            vesselType: true,
            grt: true,
            engineOutput: true,
            status: true,
            signOnDate: true,
            signOffDate: true,
            reasonForSignOff: true,
          },
        },
      },
    });

    if (!crew) {
      return NextResponse.json({ error: "Seafarer not found" }, { status: 404 });
    }

    if (format?.toLowerCase() !== "pdf") {
      return NextResponse.json(crew);
    }

    const safeCode = (crew.crewCode ?? crew.id).replace(/[^A-Z0-9_-]/gi, "_");
    const filename = `${safeCode}_cv.pdf`;
    const pdfResult = await generateCrewCvPdf(crew, filename);

    if (!pdfResult.success || !pdfResult.path) {
      return NextResponse.json(
        { error: pdfResult.error ?? "Failed to generate CV PDF" },
        { status: 500 }
      );
    }

    const absolutePath = path.join(process.cwd(), "public", pdfResult.path.replace(/^\//, ""));
    const pdfBuffer = await readFile(absolutePath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  }
);
