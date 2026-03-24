import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isReviewerSession,
  isValidFormApprovalTransition,
} from "@/lib/form-submission-workflow";
import { handleApiError } from "@/lib/error-handler";

function mergeRequestedChanges(formData: unknown, changes: string): unknown {
  if (formData && typeof formData === "object" && !Array.isArray(formData)) {
    return { ...(formData as Record<string, unknown>), requestedChanges: changes };
  }
  return { requestedChanges: changes };
}

// POST /api/form-submissions/[id]/request-changes - Request changes to form submission
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isReviewerSession(session)) {
      return NextResponse.json(
        { error: "Only Operational and Director can request changes" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as unknown;
    const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const changes = typeof bodyRecord.changes === "string" ? bodyRecord.changes.trim() : "";

    if (!changes) {
      return NextResponse.json(
        { error: "Change requests are required" },
        { status: 400 }
      );
    }

    const existingForm = await prisma.prepareJoiningForm.findUnique({
      where: { id },
      select: { formData: true, status: true, prepareJoiningId: true, templateId: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!isValidFormApprovalTransition(existingForm.status, "CHANGES_REQUESTED")) {
      return NextResponse.json(
        { error: `Form cannot move from ${existingForm.status} to CHANGES_REQUESTED` },
        { status: 400 }
      );
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id },
      data: {
        status: "CHANGES_REQUESTED",
        reviewedBy: session?.user?.email || "Unknown",
        reviewedAt: new Date(),
        formData: mergeRequestedChanges(existingForm.formData, changes) as unknown as object,
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
          action: "PREPARE_JOINING_FORM_CHANGES_REQUESTED",
          entityType: "PrepareJoiningForm",
          entityId: form.id,
          metadataJson: {
            prepareJoiningId: existingForm.prepareJoiningId,
            templateId: existingForm.templateId,
            previousStatus: existingForm.status,
            nextStatus: "CHANGES_REQUESTED",
          },
        },
      });
    }

    return NextResponse.json({
      message: "Changes requested successfully",
      form,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
