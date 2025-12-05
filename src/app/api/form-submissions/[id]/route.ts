import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// GET /api/form-submissions/[id] - Get single form submission
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const form = await prisma.prepareJoiningForm.findUnique({
      where: { id: params.id },
      include: {
        template: {
          include: {
            principal: {
              select: {
                id: true,
                name: true,
                companyCode: true,
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
                companyCode: true,
              },
            },
            assignment: {
              select: {
                id: true,
                vessel: {
                  select: {
                    id: true,
                    name: true,
                    imoNumber: true,
                  },
                },
                joinDate: true,
                port: true,
              },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { formData, status } = body;

    const updateData: any = {};
    if (formData) updateData.formData = formData;
    
    // Status transitions
    if (status) {
      updateData.status = status;
      
      if (status === "SUBMITTED") {
        updateData.submittedBy = session?.user?.email || "Unknown";
        updateData.submittedAt = new Date();
      } else if (status === "UNDER_REVIEW") {
        updateData.reviewedBy = session?.user?.email || "Unknown";
        updateData.reviewedAt = new Date();
      } else if (status === "APPROVED") {
        updateData.approvedBy = session?.user?.email || "Unknown";
        updateData.approvedAt = new Date();
      }
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.prepareJoiningForm.delete({
      where: { id: params.id },
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
