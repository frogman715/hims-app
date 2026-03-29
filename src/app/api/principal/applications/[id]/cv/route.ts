import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePrincipalSession } from "@/lib/principal-session";
import { generateCrewCvPdf } from "@/lib/crew-ops";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const principalError = ensurePrincipalSession(session);
  if (principalError) {
    return principalError;
  }

  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format");

  const application = await prisma.application.findFirst({
    where: {
      id,
      principalId: session.user.principalId,
    },
    select: {
      id: true,
      crew: {
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
          assignments: {
            orderBy: { startDate: "desc" },
            take: 6,
            select: {
              rank: true,
              status: true,
              startDate: true,
              endDate: true,
              vessel: {
                select: {
                  name: true,
                },
              },
              principal: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (format?.toLowerCase() !== "pdf") {
    return NextResponse.json(application.crew);
  }

  const safeCode = (application.crew.crewCode ?? application.crew.id).replace(/[^A-Z0-9_-]/gi, "_");
  const filename = `${safeCode}_principal_cv.pdf`;
  const pdfResult = await generateCrewCvPdf(application.crew, filename);

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
