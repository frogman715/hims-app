import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const crewId = searchParams.get("crewId");
      const limitParam = Number.parseInt(searchParams.get("limit") ?? "20", 10);
      const limit = Number.isFinite(limitParam)
        ? Math.max(1, Math.min(limitParam, 100))
        : 20;

      const receipts = await prisma.documentReceipt.findMany({
        where: crewId ? { crewId } : undefined,
        include: {
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return NextResponse.json(receipts);
    } catch (error) {
      console.error("Error fetching document receipts:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
