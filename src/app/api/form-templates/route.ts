import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// GET /api/form-templates - Get all form templates
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
    const principalId = searchParams.get("principalId");

    const where: any = {};
    if (principalId) {
      where.principalId = principalId;
    }

    const templates = await prisma.principalFormTemplate.findMany({
      where,
      include: {
        principal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ principalId: "asc" }, { displayOrder: "asc" }],
    });

    return NextResponse.json({ data: templates, total: templates.length });
  } catch (error) {
    console.error("Error fetching form templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch form templates" },
      { status: 500 }
    );
  }
}

// POST /api/form-templates - Create new form template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      principalId,
      formName,
      formCategory,
      templatePath,
      isRequired,
      displayOrder,
      description,
    } = body;

    if (!principalId || !formName || !formCategory || !templatePath) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const template = await prisma.principalFormTemplate.create({
      data: {
        principalId,
        formName,
        formCategory,
        templatePath,
        isRequired: isRequired !== undefined ? isRequired : true,
        displayOrder: displayOrder || 0,
        description,
      },
      include: {
        principal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating form template:", error);
    return NextResponse.json(
      { error: "Failed to create form template" },
      { status: 500 }
    );
  }
}
