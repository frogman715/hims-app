import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Access to crew biodata is restricted for your role." },
        { status: 403 }
      );
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
        signOffPlan: assignment.endDate || assignment.startDate, // Use endDate as plan, fallback needed for UI
        signOffDate: assignment.endDate, // Actual sign-off date (can be null if still onboard)
        status: assignment.status,
        vessel: assignment.vessel,
        principal: assignment.principal,
        remarks: assignment.remarks,
      })),
    };

    return NextResponse.json(transformedCrew);
  } catch (error) {
    console.error("Error fetching seafarer biodata:", error);
    return NextResponse.json(
      { error: "Crew biodata could not be loaded. Please try again or contact admin." },
      { status: 500 }
    );
  }
}
