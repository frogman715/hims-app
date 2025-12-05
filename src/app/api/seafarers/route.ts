import { NextRequest, NextResponse } from "next/server";
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

    // Check crew permission
    if (!checkPermission(session, 'crew', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const seafarers = await prisma.crew.findMany({
      include: {
        assignments: {
          where: {
            status: {
              in: ['PLANNED', 'ONBOARD']
            }
          },
          include: {
            vessel: {
              select: {
                name: true,
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(seafarers);
  } catch (error) {
    console.error("Error fetching seafarers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, rank, nationality } = body;

    if (!fullName || !rank) {
      return NextResponse.json({ error: "Full name and rank are required" }, { status: 400 });
    }

    const seafarer = await prisma.crew.create({
      data: {
        fullName,
        rank,
        nationality,
      },
    });

    return NextResponse.json(seafarer, { status: 201 });
  } catch (error) {
    console.error("Error creating seafarer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}