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

    // Check wage scales permission
    if (!checkPermission(session, 'wageScales', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const wageScales = await prisma.wageScaleHeader.findMany({
      include: {
        items: true,
        principal: true
      },
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(wageScales);
  } catch (error) {
    console.error("Error fetching wage scales:", error);
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

    // Check wage scales permission for editing
    if (!checkPermission(session, 'wageScales', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create wage scales" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      principalId,
      rank,
      items
    } = body;

    if (!name || !rank) {
      return NextResponse.json(
        { error: "Name and rank are required" },
        { status: 400 }
      );
    }

    const wageScaleHeader = await prisma.wageScaleHeader.create({
      data: {
        name,
        principalId,
        rank,
        items: {
          create: items?.map((item: any) => ({
            component: item.component,
            amount: parseFloat(item.amount),
            currency: item.currency || 'USD',
            frequency: item.frequency || 'MONTHLY',
            isActive: item.isActive !== undefined ? item.isActive : true
          })) || []
        }
      },
      include: {
        items: true,
        principal: true
      }
    });

    return NextResponse.json(wageScaleHeader);
  } catch (error) {
    console.error("Error creating wage scale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}