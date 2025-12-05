import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// POST /api/form-submissions/[id]/approve - Approve form submission
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only CDMO and DIRECTOR can approve
    const role = session?.user?.role;
    if (role !== "CDMO" && role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Only CDMO and Director can approve forms" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { notes } = body;

    const form = await prisma.prepareJoiningForm.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedBy: session?.user?.email || "Unknown",
        approvedAt: new Date(),
        formData: {
          ...(typeof form === "object" && form !== null ? form : {}),
          approvalNotes: notes || "",
        } as any,
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
