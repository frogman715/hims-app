import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

enum FormApprovalStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

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
    
    // Only CDMO and DIRECTOR can approve
    const role = session?.user?.role;
    if (role !== "CDMO" && role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Only CDMO and Director can approve forms" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as unknown;
    const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const notes = typeof bodyRecord.notes === "string" ? bodyRecord.notes : "";

    const existingForm = await prisma.prepareJoiningForm.findUnique({
      where: { id },
      select: { formData: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id },
      data: {
        status: FormApprovalStatus.APPROVED,
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
          },
        },
      },
    });

    // TODO: Generate PDF after approval
    // This would involve converting the formData to a PDF using a library like puppeteer
    // and saving it to finalPdfPath

    return NextResponse.json({
      message: "Form approved successfully",
      form,
    });
  } catch (error) {
    console.error("Error approving form:", error);
    return NextResponse.json(
      { error: "Failed to approve form" },
      { status: 500 }
    );
  }
}
