import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { resolveStoredFileUrl } from "@/lib/upload-path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Access to crew documents is restricted for your role." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const crewId = id;

    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      select: { id: true },
    });

    if (!crew) {
      return NextResponse.json({ error: "Seafarer not found" }, { status: 404 });
    }

    const documents = await prisma.crewDocument.findMany({
      where: { crewId, isActive: true },
      orderBy: {
        expiryDate: 'desc'
      }
    });

    return NextResponse.json(
      documents.map((document) => ({
        ...document,
        fileUrl: resolveStoredFileUrl(document.fileUrl),
      }))
    );
  } catch (error) {
    console.error("[api/seafarers/documents][GET] failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Crew documents could not be loaded. Please try again or contact admin." },
      { status: 500 }
    );
  }
}
