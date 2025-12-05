import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check dispatches permission
    if (!checkPermission(session, 'dispatches', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const dispatches = await prisma.dispatch.findMany({
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(dispatches);
  } catch (error) {
    console.error("Error fetching dispatches:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispatches" },
      { status: 500 }
    );
  }
}