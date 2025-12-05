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

    return NextResponse.json(crew);
  } catch (error) {
    console.error("Error fetching seafarer biodata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}