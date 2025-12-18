import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission(
  "assignments",
  PermissionLevel.VIEW_ACCESS,
  async (request: NextRequest) => {
    try {
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
      console.error("Error fetching assignments:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

export const POST = withPermission(
  "assignments",
  PermissionLevel.EDIT_ACCESS,
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { crewId, vesselId, principalId, rank, startDate, endDate } = body;

      if (!crewId || !vesselId || !principalId || !startDate) {
        return NextResponse.json(
          { error: "Crew, vessel, principal IDs, and start date are required" },
          { status: 400 }
        );
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
      console.error("Error creating assignment:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);