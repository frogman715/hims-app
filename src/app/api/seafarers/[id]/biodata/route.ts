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
    const crewId = id;

    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        assignments: {
          include: {
            vessel: {
              select: {
                id: true,
                name: true,
              }
            },
            principal: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        },
        applications: {
          select: {
            id: true,
            position: true,
            applicationDate: true,
            status: true,
          },
          orderBy: {
            applicationDate: 'desc'
          }
        },
        documents: {
          select: {
            id: true,
            docType: true,
            docNumber: true,
            issueDate: true,
            expiryDate: true,
            remarks: true,
          },
          orderBy: {
            expiryDate: 'desc'
          }
        }
      }
    });

    if (!crew) {
      return NextResponse.json({ error: "Seafarer not found" }, { status: 404 });
    }

    // Transform assignments to match frontend interface expectations
    const transformedCrew = {
      ...crew,
      assignments: crew.assignments.map(assignment => ({
        id: assignment.id,
        rank: assignment.rank,
        signOnDate: assignment.startDate,
        signOffPlan: assignment.endDate || assignment.startDate, // Use endDate as signOffPlan, fallback to startDate
        signOffDate: assignment.endDate,
        status: assignment.status,
        vessel: assignment.vessel,
        principal: assignment.principal,
      })),
    };

    return NextResponse.json(transformedCrew);
  } catch (error) {
    console.error("Error fetching seafarer biodata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}