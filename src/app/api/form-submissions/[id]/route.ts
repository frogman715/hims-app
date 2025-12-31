import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

enum FormApprovalStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

interface UpdateFormSubmissionPayload {
  formData?: unknown;
  status?: FormApprovalStatus;
}

const FORM_STATUS_SET = new Set<FormApprovalStatus>([
  FormApprovalStatus.DRAFT,
  FormApprovalStatus.SUBMITTED,
  FormApprovalStatus.UNDER_REVIEW,
  FormApprovalStatus.CHANGES_REQUESTED,
  FormApprovalStatus.APPROVED,
  FormApprovalStatus.REJECTED,
]);

function isUpdateFormSubmissionPayload(value: unknown): value is UpdateFormSubmissionPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<UpdateFormSubmissionPayload>;

  if (payload.status !== undefined && !FORM_STATUS_SET.has(payload.status)) {
    return false;
  }

  return true;
}

// GET /api/form-submissions/[id] - Get single form submission
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const form = await prisma.prepareJoiningForm.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            principal: {
              select: {
                id: true,
                name: true,
                registrationNumber: true,
              },
            },
          },
        },
        prepareJoining: {
          include: {
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
                dateOfBirth: true,
                passportNumber: true,
                seamanBookNumber: true,
                phone: true,
                email: true,
              },
            },
            principal: {
              select: {
                id: true,
                name: true,
                registrationNumber: true,
              },
            },
            vessel: {
              select: {
                id: true,
                name: true,
                imoNumber: true,
                flag: true,
              },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    let assignmentData: {
      id: string;
      startDate: Date;
      endDate: Date | null;
      status: string;
      remarks: string | null;
      vessel: { id: string; name: string; imoNumber: string | null; flag: string | null } | null;
    } | null = null;

    const assignmentId = form.prepareJoining?.assignmentId;
    if (assignmentId) {
      assignmentData = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          remarks: true,
          vessel: {
            select: {
              id: true,
              name: true,
              imoNumber: true,
              flag: true,
            },
          },
        },
      });
    }

    const normalizePrincipal = (principal: { id: string; name: string; registrationNumber: string | null } | null | undefined) => {
      if (!principal) {
        return principal;
      }
      return {
        ...principal,
        companyCode: principal.registrationNumber ?? null,
      };
    };

    const normalizedForm = {
      ...form,
      template: form.template
        ? {
            ...form.template,
            principal: normalizePrincipal(form.template.principal),
          }
        : form.template,
      prepareJoining: form.prepareJoining
        ? {
            ...form.prepareJoining,
            principal: normalizePrincipal(form.prepareJoining.principal),
            assignment: assignmentData
              ? {
                  ...assignmentData,
                  joinDate: assignmentData.startDate,
                  port: assignmentData.remarks ?? null,
                }
              : null,
          }
        : form.prepareJoining,
    };

    return NextResponse.json(normalizedForm);
  } catch (error) {
    console.error("Error fetching form submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch form submission" },
      { status: 500 }
    );
  }
}

// PUT /api/form-submissions/[id] - Update form submission
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const parsedBody = (await req.json()) as unknown;

    if (!isUpdateFormSubmissionPayload(parsedBody)) {
      return NextResponse.json({ error: "Invalid form submission payload" }, { status: 400 });
    }

    const { formData, status } = parsedBody;

    const updateData: Record<string, unknown> = {};
    if (formData !== undefined) {
      updateData.formData = formData as unknown;
    }
    
    // Status transitions
    if (status) {
      updateData.status = status;

      if (status === FormApprovalStatus.SUBMITTED) {
        updateData.submittedBy = session?.user?.email || "Unknown";
        updateData.submittedAt = new Date();
      } else if (status === FormApprovalStatus.UNDER_REVIEW) {
        updateData.reviewedBy = session?.user?.email || "Unknown";
        updateData.reviewedAt = new Date();
      } else if (status === FormApprovalStatus.APPROVED) {
        updateData.approvedBy = session?.user?.email || "Unknown";
        updateData.approvedAt = new Date();
      }
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error updating form submission:", error);
    return NextResponse.json(
      { error: "Failed to update form submission" },
      { status: 500 }
    );
  }
}

// DELETE /api/form-submissions/[id] - Delete form submission
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.prepareJoiningForm.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Form submission deleted successfully" });
  } catch (error) {
    console.error("Error deleting form submission:", error);
    return NextResponse.json(
      { error: "Failed to delete form submission" },
      { status: 500 }
    );
  }
}
