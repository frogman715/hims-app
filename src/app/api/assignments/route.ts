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

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if (Number.isNaN(parsedStartDate.getTime()) || (parsedEndDate && Number.isNaN(parsedEndDate.getTime()))) {
      throw new ApiError(400, "Start date and end date must use valid date values", "VALIDATION_ERROR");
    }

    if (parsedEndDate && parsedEndDate < parsedStartDate) {
      throw new ApiError(400, "End date must be on or after the start date", "VALIDATION_ERROR");
    }

    const [crew, vessel, principal] = await Promise.all([
      prisma.crew.findUnique({
        where: { id: crewId },
        select: { id: true, fullName: true, rank: true, crewStatus: true, status: true },
      }),
      prisma.vessel.findUnique({
        where: { id: vesselId },
        select: { id: true, name: true, status: true },
      }),
      prisma.principal.findUnique({
        where: { id: principalId },
        select: { id: true, name: true, status: true },
      }),
    ]);

    if (!crew) {
      throw new ApiError(404, "Crew record was not found", "NOT_FOUND");
    }

    if (!vessel) {
      throw new ApiError(404, "Vessel record was not found", "NOT_FOUND");
    }

    if (!principal) {
      throw new ApiError(404, "Principal record was not found", "NOT_FOUND");
    }

    const existingActiveAssignment = await prisma.assignment.findFirst({
      where: {
        crewId,
        status: { in: ["PLANNED", "ASSIGNED", "ACTIVE", "ONBOARD"] },
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        vessel: { select: { name: true } },
      },
    });

    if (existingActiveAssignment) {
      throw new ApiError(
        409,
        `Crew already has an active assignment (${existingActiveAssignment.status}) on ${existingActiveAssignment.vessel?.name ?? "an assigned vessel"}. Close or complete that record first.`,
        "ASSIGNMENT_CONFLICT"
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        crewId,
        vesselId,
        principalId,
        rank: typeof rank === "string" && rank.trim().length > 0 ? rank.trim() : crew.rank ?? "Not specified",
        startDate: parsedStartDate,
        endDate: parsedEndDate ?? undefined,
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
