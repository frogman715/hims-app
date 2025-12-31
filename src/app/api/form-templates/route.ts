import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";


interface CreateTemplatePayload {
  principalId: string;
  formName: string;
  formCategory: string;
  templatePath: string;
  isRequired?: boolean;
  displayOrder?: number;
  description?: string | null;
}

function isCreateTemplatePayload(value: unknown): value is CreateTemplatePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<CreateTemplatePayload>;
  return (
    typeof payload.principalId === "string" &&
    payload.principalId.trim().length > 0 &&
    typeof payload.formName === "string" &&
    payload.formName.trim().length > 0 &&
    typeof payload.formCategory === "string" &&
    payload.formCategory.trim().length > 0 &&
    typeof payload.templatePath === "string" &&
    payload.templatePath.trim().length > 0 &&
    (payload.isRequired === undefined || typeof payload.isRequired === "boolean") &&
    (payload.displayOrder === undefined || typeof payload.displayOrder === "number") &&
    (payload.description === undefined || payload.description === null || typeof payload.description === "string")
  );
}

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

    const where: Record<string, unknown> = {};
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

    const payload = (await req.json()) as unknown;

    if (!isCreateTemplatePayload(payload)) {
      return NextResponse.json(
        { error: "Invalid form template payload" },
        { status: 400 }
      );
    }

    const template = await prisma.principalFormTemplate.create({
      data: {
        principalId: payload.principalId,
        formName: payload.formName,
        formCategory: payload.formCategory,
        templatePath: payload.templatePath,
        isRequired: payload.isRequired ?? true,
        displayOrder: payload.displayOrder ?? 0,
        description: payload.description ?? null,
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
