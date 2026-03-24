import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePDF, generateFormSubmissionHTML } from "@/lib/pdf-generator";
import {
  isReviewerSession,
  isValidFormApprovalTransition,
} from "@/lib/form-submission-workflow";
import { handleApiError } from "@/lib/error-handler";

function mergeApprovalNotes(formData: unknown, notes: string): unknown {
  if (formData && typeof formData === "object" && !Array.isArray(formData)) {
    return { ...(formData as Record<string, unknown>), approvalNotes: notes };
  }
  return { approvalNotes: notes };
}

// POST /api/form-submissions/[id]/approve - Approve form submission
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
        { error: "Only Operational and Director can approve forms" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as unknown;
    const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const notes = typeof bodyRecord.notes === "string" ? bodyRecord.notes : "";

    const existingForm = await prisma.prepareJoiningForm.findUnique({
      where: { id },
      select: { formData: true, status: true, prepareJoiningId: true, templateId: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!isValidFormApprovalTransition(existingForm.status, "APPROVED")) {
      return NextResponse.json(
        { error: `Form cannot move from ${existingForm.status} to APPROVED` },
        { status: 400 }
      );
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: session?.user?.email || "Unknown",
        approvedAt: new Date(),
        formData: mergeApprovalNotes(existingForm.formData, notes) as unknown as object,
      },
      include: {
        template: true,
        prepareJoining: {
          include: {
            crew: true,
            principal: true,
            vessel: true,
          },
        },
      },
    });

    // Generate PDF after approval
    if (form.prepareJoining?.crew && form.prepareJoining?.principal) {
      const formatDate = (date: Date | null): string => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      };

      const htmlContent = generateFormSubmissionHTML({
        crewName: form.prepareJoining.crew.fullName || "N/A",
        rank: form.prepareJoining.crew.rank || "N/A",
        vessel: form.prepareJoining.vessel?.name || "N/A",
        principal: form.prepareJoining.principal.name || "N/A",
        department: "N/A",
        joinDate: formatDate(form.prepareJoining.departureDate),
        contractEndDate: formatDate(new Date()),
        formContent: (form.formData as Record<string, unknown>) || {},
        approvedBy: session?.user?.name || "System",
        approvedAt: new Date(),
      });

      const timestamp = Date.now();
      const pdfFilename = `form-submission-${id}-${timestamp}.pdf`;
      const pdfResult = await generatePDF(htmlContent, pdfFilename);

      if (pdfResult.success && pdfResult.path) {
        // Update form with PDF path
        await prisma.prepareJoiningForm.update({
          where: { id },
          data: {
            finalPdfPath: pdfResult.path,
          },
        });
      }
    }

    if (session.user?.id) {
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "PREPARE_JOINING_FORM_APPROVED",
          entityType: "PrepareJoiningForm",
          entityId: form.id,
          metadataJson: {
            prepareJoiningId: existingForm.prepareJoiningId,
            templateId: existingForm.templateId,
            previousStatus: existingForm.status,
            nextStatus: "APPROVED",
          },
        },
      });
    }

    return NextResponse.json({
      message: "Form approved successfully",
      form,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
