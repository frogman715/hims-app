import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// POST /api/form-submissions/[id]/reject - Reject form submission
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only CDMO and DIRECTOR can reject
    const role = session?.user?.role;
    if (role !== "CDMO" && role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Only CDMO and Director can reject forms" },
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

    const form = await prisma.prepareJoiningForm.update({
      where: { id: params.id },
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

    return NextResponse.json({
      message: "Form rejected successfully",
      form,
    });
  } catch (error) {
    console.error("Error rejecting form:", error);
    return NextResponse.json(
      { error: "Failed to reject form" },
      { status: 500 }
    );
  }
}
