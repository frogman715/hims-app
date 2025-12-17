import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OFFICE_ROLE_SET } from "@/lib/roles";
import type { AppRole } from "@/lib/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = Array.isArray(session.user.roles) ? session.user.roles : [];
    const hasOfficeRole = userRoles.some((role) => OFFICE_ROLE_SET.has(role as AppRole));
    if (!hasOfficeRole) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const crewId = id;

    const documents = await prisma.crewDocument.findMany({
      where: { crewId },
      orderBy: {
        expiryDate: 'desc'
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching seafarer documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}