import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// GET /api/form-submissions - Get all form submissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const prepareJoiningId = searchParams.get("prepareJoiningId");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (prepareJoiningId) {
      where.prepareJoiningId = prepareJoiningId;
    }

    const forms = await prisma.prepareJoiningForm.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            formName: true,
            formCategory: true,
          },
        },
        prepareJoining: {
          select: {
            id: true,
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
              },
            },
            principal: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: forms, total: forms.length });
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch form submissions" },
      { status: 500 }
    );
  }
}
