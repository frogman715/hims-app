import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ApiError, validateRequired } from "@/lib/error-handler";

/**
 * GET /api/wage-scales - Fetch all wage scale headers with items
 * Permission: VIEW_ACCESS on wageScales module
 */
export const GET = withPermission(
  "wageScales",
  PermissionLevel.VIEW_ACCESS,
  async () => {
    const wageScales = await prisma.wageScaleHeader.findMany({
      include: {
        items: true,
        principal: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ data: wageScales, total: wageScales.length });
  }
);

/**
 * POST /api/wage-scales - Create new wage scale header with items
 * Permission: EDIT_ACCESS on wageScales module
 */
export const POST = withPermission(
  "wageScales",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest) => {
    const body = await req.json();
    const { name, principalId, rank, items } = body;

    // Input validation
    validateRequired(name, "name");
    validateRequired(rank, "rank");

    // Create wage scale with items
    const wageScaleHeader = await prisma.wageScaleHeader.create({
      data: {
        name,
        principalId,
        rank,
        items: {
          create:
            items?.map((item: any) => ({
              component: item.component,
              amount: parseFloat(item.amount),
              currency: item.currency || "USD",
              frequency: item.frequency || "MONTHLY",
              isActive: item.isActive !== undefined ? item.isActive : true,
            })) || [],
        }
      },
      include: {
        items: true,
        principal: true,
      },
    });

    return NextResponse.json({
      data: wageScaleHeader,
      message: "Wage scale created successfully",
    }, { status: 201 });
  }
);