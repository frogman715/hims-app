import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    const whereClause = assignmentId ? { assignmentId } : {};

    const replacements = await prisma.crewReplacement.findMany({
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true
          }
        },
        replacementCrew: {
          select: {
            id: true,
            fullName: true,
            nationality: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(replacements);
  } catch (error) {
    console.error("Error fetching crew replacements:", error);
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
    const { crewId, replacementCrewId, reason, requestedBy } = body;

    if (!crewId || !reason || !requestedBy) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Validate crew exists
    const crew = await prisma.crew.findUnique({
      where: { id: crewId }
    });
    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    // Validate replacement crew if provided
    if (replacementCrewId) {
      const replacementCrew = await prisma.crew.findUnique({
        where: { id: replacementCrewId }
      });
      if (!replacementCrew) {
        return NextResponse.json({ error: "Replacement crew not found" }, { status: 404 });
      }
    }

    const replacement = await prisma.crewReplacement.create({
      data: {
        crewId,
        replacementCrewId,
        reason,
        requestedBy,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true
          }
        },
        replacementCrew: {
          select: {
            id: true,
            fullName: true,
            nationality: true
          }
        }
      }
    });

    return NextResponse.json(replacement, { status: 201 });
  } catch (error) {
    console.error("Error creating crew replacement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}