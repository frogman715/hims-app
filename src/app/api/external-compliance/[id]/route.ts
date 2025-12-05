import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { ComplianceStatus } from "@prisma/client";

/**
 * GET /api/external-compliance/[id]
 * Get specific external compliance record
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await withPermission("compliance", PermissionLevel.VIEW_ACCESS, async (req, session) => {
      const compliance = await prisma.externalCompliance.findUnique({
        where: { id: params.id },
        include: {
          crew: true,
        },
      });

      if (!compliance) {
        throw new ApiError(404, "Compliance record not found", "NOT_FOUND");
      }

      return NextResponse.json({ data: compliance });
    })(req, { params } as any);

    return session;
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
    const session = await withPermission("compliance", PermissionLevel.EDIT_ACCESS, async (req, session) => {
      const body = await req.json();
      const { certificateId, issueDate, expiryDate, status, verificationUrl, notes } = body;

      // Validate status if provided
      if (status && !Object.values(ComplianceStatus).includes(status)) {
        throw new ApiError(400, "Invalid status", "INVALID_STATUS");
      }

      const compliance = await prisma.externalCompliance.update({
        where: { id: params.id },
        data: {
          ...(certificateId !== undefined && { certificateId }),
          ...(issueDate && { issueDate: new Date(issueDate) }),
          ...(expiryDate && { expiryDate: new Date(expiryDate) }),
          ...(status && { status }),
          ...(verificationUrl !== undefined && { verificationUrl }),
          ...(notes !== undefined && { notes }),
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
    })(req, { params } as any);

    return session;
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
    const session = await withPermission("compliance", PermissionLevel.FULL_ACCESS, async (req, session) => {
      await prisma.externalCompliance.delete({
        where: { id: params.id },
      });

      return NextResponse.json({ message: "Compliance record deleted successfully" });
    })(req, { params } as any);

    return session;
  } catch (error) {
    return handleApiError(error);
  }
}
