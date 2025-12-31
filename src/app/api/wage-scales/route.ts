import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ApiError, validateRequired } from "@/lib/error-handler";

enum WageComponent {
  BASIC_WAGE = "BASIC_WAGE",
  FIXED_OVERTIME = "FIXED_OVERTIME",
  MONTHLY_WAGE = "MONTHLY_WAGE",
  LEAVE_PAY = "LEAVE_PAY",
  SPECIAL_ALLOWANCE = "SPECIAL_ALLOWANCE",
  BONUS = "BONUS",
}

type WageScaleItemPayload = {
  component: string;
  amount: number | string;
  currency?: string | null;
  frequency?: string | null;
  isActive?: boolean;
};

type CreateWageScalePayload = {
  name: string;
  principalId?: string | null;
  rank: string;
  items?: WageScaleItemPayload[];
};

const allowedWageComponents = new Set<WageComponent>([
  ...Object.values(WageComponent),
]);

function parseAmount(value: number | string, index: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  throw new ApiError(400, `Invalid amount for item ${index + 1}`, "INVALID_PAYLOAD");
}

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
    const body = (await req.json()) as CreateWageScalePayload;
    const { name, principalId, rank, items } = body;

    // Input validation
    validateRequired(name, "name");
    validateRequired(rank, "rank");

    if (typeof name !== "string" || !name.trim()) {
      throw new ApiError(400, "Invalid wage scale name", "INVALID_PAYLOAD");
    }

    if (typeof rank !== "string" || !rank.trim()) {
      throw new ApiError(400, "Invalid rank", "INVALID_PAYLOAD");
    }

    if (principalId !== undefined && principalId !== null && typeof principalId !== "string") {
      throw new ApiError(400, "Invalid principal ID", "INVALID_PAYLOAD");
    }

    if (items !== undefined && !Array.isArray(items)) {
      throw new ApiError(400, "Items must be an array", "INVALID_PAYLOAD");
    }

    const normalizedItems = (items ?? []).map((item, index) => {
      if (!item || typeof item !== "object") {
        throw new ApiError(400, `Invalid item at position ${index + 1}`, "INVALID_PAYLOAD");
      }

      const { component, amount, currency, frequency, isActive } = item;

      if (typeof component !== "string" || !component.trim()) {
        throw new ApiError(400, `Invalid component at position ${index + 1}`, "INVALID_PAYLOAD");
      }

      const normalizedComponent = component.trim().toUpperCase();
      if (!allowedWageComponents.has(normalizedComponent as WageComponent)) {
        throw new ApiError(400, `Unsupported component at position ${index + 1}`, "INVALID_PAYLOAD");
      }

      const numericAmount = parseAmount(amount, index);

      const normalizedCurrency =
        typeof currency === "string" && currency.trim()
          ? currency.trim().toUpperCase()
          : "USD";

      const normalizedFrequency =
        typeof frequency === "string" && frequency.trim()
          ? frequency.trim().toUpperCase()
          : "MONTHLY";

      return {
        component: normalizedComponent as WageComponent,
        amount: numericAmount,
        currency: normalizedCurrency,
        frequency: normalizedFrequency,
        isActive: typeof isActive === "boolean" ? isActive : true,
      };
    });

    // Create wage scale with items
    const wageScaleHeader = await prisma.wageScaleHeader.create({
      data: {
        name: name.trim(),
        principalId: principalId ?? null,
        rank: rank.trim(),
        items: {
          create: normalizedItems,
        },
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