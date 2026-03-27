import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { handleApiError, ApiError } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/assignments", "GET");
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const vesselId = searchParams.get("vesselId");
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "200", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 200))
      : 200;

    const whereClause = vesselId ? { vesselId } : {};

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        crew: {
          select: {
            fullName: true,
            nationality: true,
          },
        },
        vessel: {
          select: {
            name: true,
          },
        },
        principal: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
      take: limit,
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/assignments", "POST");
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const { crewId, vesselId, principalId, rank, startDate, endDate } = body;

    if (!crewId || !vesselId || !principalId || !startDate) {
      throw new ApiError(400, "Crew, vessel, principal IDs, and start date are required", "VALIDATION_ERROR");
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
          },
        },
        vessel: {
          select: {
            name: true,
          },
        },
        principal: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
