import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormApprovalStatus, Prisma } from "@prisma/client";

function mergeApprovalNotes(formData: Prisma.JsonValue | null | undefined, notes: string): Prisma.JsonValue {
  if (formData && typeof formData === "object" && !Array.isArray(formData)) {
    return { ...formData, approvalNotes: notes } as Prisma.JsonObject;
  }
  return { approvalNotes: notes } satisfies Prisma.JsonObject;
}

// POST /api/form-submissions/[id]/approve - Approve form submission
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      where: { id: params.id },
      select: { formData: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id: params.id },
      data: {
        status: FormApprovalStatus.APPROVED,
        approvedBy: session?.user?.email || "Unknown",
        approvedAt: new Date(),
        formData: mergeApprovalNotes(existingForm.formData, notes),
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
