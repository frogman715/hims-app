import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, assignmentsGuard, PermissionLevel } from "@/lib/permission-middleware";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check assignments permission
    if (!assignmentsGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const vesselId = searchParams.get('vesselId');

    const whereClause = vesselId ? { vesselId } : {};

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        crew: {
          select: {
            fullName: true,
            nationality: true,
          }
        },
        vessel: {
          select: {
            name: true,
          }
        },
        principal: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
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

    // Check assignments permission for editing
    if (!checkPermission(session, 'assignments', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create assignments" }, { status: 403 });
    }

    const body = await request.json();
    const { crewId, vesselId, principalId, rank, startDate, endDate } = body;

    if (!crewId || !vesselId || !principalId || !startDate) {
      return NextResponse.json({ error: "Crew, vessel, principal IDs, and start date are required" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        crewId,
        vesselId,
        principalId,
        rank,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
      },
      include: {
        crew: {
          select: {
            fullName: true,
          }
        },
        vessel: {
          select: {
            name: true,
          }
        },
        principal: {
          select: {
            name: true,
          }
        }
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}