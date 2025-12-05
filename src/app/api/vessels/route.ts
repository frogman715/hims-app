import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, vesselsGuard, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check vessels permission
    if (!vesselsGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const vessels = await prisma.vessel.findMany({
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(vessels);
  } catch (error) {
    console.error("Error fetching vessels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check vessels permission for editing
    if (!checkPermission(session, 'vessels', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create vessels" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      imoNumber,
      type,
      flag,
      gt,
      dwt,
      status,
      principalId
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const vessel = await prisma.vessel.create({
      data: {
        name,
        imoNumber: imoNumber || null,
        flag: flag || "PANAMA",
        type: type || "TANKER",
        dwt: dwt || null,
        gt: gt || null,
        status: status || "ACTIVE",
        principalId: principalId || null,
      },
    });

    return NextResponse.json(vessel, { status: 201 });
  } catch (error) {
    console.error("Error creating vessel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}