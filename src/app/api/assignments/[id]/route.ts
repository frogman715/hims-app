import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withPermission<RouteContext>(
  "assignments",
  PermissionLevel.VIEW_ACCESS,
  async (_request: NextRequest, _session, { params }) => {
    try {
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
);

export const PUT = withPermission<RouteContext>(
  "assignments",
  PermissionLevel.EDIT_ACCESS,
  async (request: NextRequest, _session, { params }) => {
    try {
      const { id } = await params;

      const body = await request.json();
      const { rank, startDate, endDate, status } = body;

      const assignment = await prisma.assignment.update({
        where: { id },
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
);