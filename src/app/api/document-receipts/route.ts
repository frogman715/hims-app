import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Number.parseInt(limitParam, 10) || 20, 100) : 20;

    const receipts = await prisma.documentReceipt.findMany({
      where: crewId ? { crewId } : undefined,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Error fetching document receipts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
