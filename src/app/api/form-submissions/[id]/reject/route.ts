import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isReviewerSession,
  isValidFormApprovalTransition,
} from "@/lib/form-submission-workflow";
import { handleApiError } from "@/lib/error-handler";

// POST /api/form-submissions/[id]/reject - Reject form submission
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isReviewerSession(session)) {
      return NextResponse.json(
        { error: "Only Operational and Director can reject forms" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const existingForm = await prisma.prepareJoiningForm.findUnique({
      where: { id },
      select: { id: true, status: true, prepareJoiningId: true, templateId: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!isValidFormApprovalTransition(existingForm.status, "REJECTED")) {
      return NextResponse.json(
        { error: `Form cannot move from ${existingForm.status} to REJECTED` },
        { status: 400 }
      );
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedBy: session?.user?.email || "Unknown",
        reviewedAt: new Date(),
      },
      include: {
        template: true,
        prepareJoining: {
          include: {
            crew: true,
            principal: true,
          },
        },
      },
    });

    if (session.user?.id) {
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "PREPARE_JOINING_FORM_REJECTED",
          entityType: "PrepareJoiningForm",
          entityId: form.id,
          metadataJson: {
            prepareJoiningId: existingForm.prepareJoiningId,
            templateId: existingForm.templateId,
            previousStatus: existingForm.status,
            nextStatus: "REJECTED",
          },
        },
      });
    }

    return NextResponse.json({
      message: "Form rejected successfully",
      form,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
