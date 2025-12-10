import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const assignmentId = id; // Keep as string since id is cuid

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
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

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const assignmentId = id; // Keep as string since id is cuid

    const body = await request.json();
    const { rank, startDate, endDate, status } = body;

    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        rank,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
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

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}