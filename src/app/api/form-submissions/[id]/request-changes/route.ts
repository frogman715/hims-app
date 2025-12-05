import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// POST /api/form-submissions/[id]/request-changes - Request changes to form submission
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only CDMO and DIRECTOR can request changes
    const role = session?.user?.role;
    if (role !== "CDMO" && role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Only CDMO and Director can request changes" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { changes } = body;

    if (!changes) {
      return NextResponse.json(
        { error: "Change requests are required" },
        { status: 400 }
      );
    }

    const form = await prisma.prepareJoiningForm.update({
      where: { id: params.id },
      data: {
        status: "CHANGES_REQUESTED",
        reviewedBy: session?.user?.email || "Unknown",
        reviewedAt: new Date(),
        formData: {
          ...(typeof form === "object" && form !== null ? form : {}),
          requestedChanges: changes,
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
