import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/assignments", "GET");
    if (authError) {
      return authError;
    }

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
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

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/assignments", "PUT");
    if (authError) {
      return authError;
    }

    const { id } = await params;
    const body = await request.json();
    const { rank, startDate, endDate, status } = body;

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        crewId: true,
        status: true,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if ((startDate && (!parsedStartDate || Number.isNaN(parsedStartDate.getTime()))) || (endDate && (!parsedEndDate || Number.isNaN(parsedEndDate.getTime())))) {
      return NextResponse.json(
        { error: "Start date and end date must use valid date values" },
        { status: 400 }
      );
    }

    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      return NextResponse.json(
        { error: "End date must be on or after the start date" },
        { status: 400 }
      );
    }

    const normalizedStatus = typeof status === "string" ? status.trim().toUpperCase() : undefined;
    const allowedStatuses = new Set(["PLANNED", "ASSIGNED", "ACTIVE", "ONBOARD", "COMPLETED", "CANCELLED"]);
    if (normalizedStatus && !allowedStatuses.has(normalizedStatus)) {
      return NextResponse.json(
        { error: "Invalid assignment status" },
        { status: 400 }
      );
    }

    if (normalizedStatus === "ONBOARD" && !parsedStartDate && !startDate) {
      return NextResponse.json(
        { error: "Start date is required before marking an assignment onboard" },
        { status: 400 }
      );
    }

    if ((normalizedStatus === "COMPLETED" || normalizedStatus === "CANCELLED") && !parsedEndDate && !endDate) {
      return NextResponse.json(
        { error: "End date is required when completing or cancelling an assignment" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        rank: typeof rank === "string" ? rank.trim() : undefined,
        startDate: parsedStartDate ?? undefined,
        endDate: parsedEndDate ?? undefined,
        status: normalizedStatus,
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

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
