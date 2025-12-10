import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { ComplianceStatus } from "@prisma/client";

type ComplianceHandlerContext = { params: { id: string } };

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  return undefined;
}

/**
 * GET /api/external-compliance/[id]
 * Get specific external compliance record
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withPermission<ComplianceHandlerContext>("compliance", PermissionLevel.VIEW_ACCESS, async (req, session, context) => {
      const compliance = await prisma.externalCompliance.findUnique({
        where: { id: context.params.id },
        include: {
          crew: true,
        },
      });

      if (!compliance) {
        throw new ApiError(404, "Compliance record not found", "NOT_FOUND");
      }

      return NextResponse.json({ data: compliance });
    })(req, { params });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/external-compliance/[id]
 * Update external compliance record
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withPermission<ComplianceHandlerContext>("compliance", PermissionLevel.EDIT_ACCESS, async (req, session, context) => {
      const body = await req.json();
      const { certificateId, issueDate, expiryDate, status, verificationUrl, notes } = body as Record<string, unknown>;

      const nextStatus = typeof status === "string" ? (status as ComplianceStatus | string) : undefined;

      // Validate status if provided
      if (nextStatus && !Object.values(ComplianceStatus).includes(nextStatus as ComplianceStatus)) {
        throw new ApiError(400, "Invalid status", "INVALID_STATUS");
      }

      const issueDateValue = parseOptionalDate(issueDate);
      const expiryDateValue = parseOptionalDate(expiryDate);

      const compliance = await prisma.externalCompliance.update({
        where: { id: context.params.id },
        data: {
          ...(typeof certificateId === "string" && { certificateId }),
          ...(issueDateValue && { issueDate: issueDateValue }),
          ...(expiryDateValue && { expiryDate: expiryDateValue }),
          ...(nextStatus && { status: nextStatus as ComplianceStatus }),
          ...(typeof verificationUrl === "string" && { verificationUrl }),
          ...(typeof notes === "string" && { notes }),
        },
        include: {
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
            },
          },
        },
      });

      return NextResponse.json({ data: compliance });
    })(req, { params });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/external-compliance/[id]
 * Delete external compliance record
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withPermission<ComplianceHandlerContext>("compliance", PermissionLevel.FULL_ACCESS, async (req, session, context) => {
      await prisma.externalCompliance.delete({
        where: { id: context.params.id },
      });

      return NextResponse.json({ message: "Compliance record deleted successfully" });
    })(req, { params });
  } catch (error) {
    return handleApiError(error);
  }
}
