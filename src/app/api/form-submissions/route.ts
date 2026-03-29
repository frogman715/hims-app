import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FORM_APPROVAL_STATUSES, type FormApprovalStatusValue } from "@/lib/form-submission-workflow";
import { handleApiError } from "@/lib/error-handler";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

const formApprovalStatuses = new Set<FormApprovalStatusValue>(FORM_APPROVAL_STATUSES);

// GET /api/form-submissions - Get all form submissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/form-submissions",
      "GET",
      "Insufficient permissions to view form submissions"
    );
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const prepareJoiningId = searchParams.get("prepareJoiningId");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      if (!formApprovalStatuses.has(status as FormApprovalStatusValue)) {
        return NextResponse.json({ error: "Invalid form submission status filter" }, { status: 400 });
      }
      where.status = status as FormApprovalStatusValue;
    }
    if (prepareJoiningId) {
      where.prepareJoiningId = prepareJoiningId;
    }

    const forms = await prisma.prepareJoiningForm.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            formName: true,
            formCategory: true,
          },
        },
        prepareJoining: {
          select: {
            id: true,
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
              },
            },
            principal: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: forms, total: forms.length });
  } catch (error) {
    return handleApiError(error);
  }
}
