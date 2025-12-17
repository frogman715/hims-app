import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormApprovalStatus, Prisma } from "@prisma/client";

function mergeRequestedChanges(formData: Prisma.JsonValue | null | undefined, changes: string): Prisma.JsonValue {
  if (formData && typeof formData === "object" && !Array.isArray(formData)) {
    return { ...formData, requestedChanges: changes } as Prisma.JsonObject;
  }
  return { requestedChanges: changes } satisfies Prisma.JsonObject;
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
    
    // Only CDMO and DIRECTOR can request changes
    const role = session?.user?.role;
    if (role !== "CDMO" && role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Only CDMO and Director can request changes" },
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
      select: { formData: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id },
      data: {
        status: FormApprovalStatus.CHANGES_REQUESTED,
        reviewedBy: session?.user?.email || "Unknown",
        reviewedAt: new Date(),
        formData: mergeRequestedChanges(existingForm.formData, changes),
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

    return NextResponse.json({
      message: "Changes requested successfully",
      form,
    });
  } catch (error) {
    console.error("Error requesting changes:", error);
    return NextResponse.json(
      { error: "Failed to request changes" },
      { status: 500 }
    );
  }
}
