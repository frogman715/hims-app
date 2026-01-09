import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, principalsGuard, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check principals permission
    if (!principalsGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const principals = await prisma.principal.findMany({
      include: {
        vessels: {
          orderBy: {
            name: 'asc'
          }
        },
        _count: {
          select: {
            assignments: true,
            vessels: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(principals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check principals permission for editing
    if (!checkPermission(session, 'principals', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create principals" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      address,
      contactPerson,
      phone,
      email,
      taxId,
      registrationNumber,
      agreementDate,
      agreementExpiry,
      status
    } = body;

    if (!name) {
      throw new ApiError(400, "Company name is required", "VALIDATION_ERROR");
    }

    const principal = await prisma.principal.create({
      data: {
        name,
        country: "INDONESIA", // Default country, can be made configurable later
        address: address || "",
        contactPerson,
        phone,
        email,
        taxId,
        registrationNumber,
        agreementDate: agreementDate ? new Date(agreementDate) : null,
        agreementExpiry: agreementExpiry ? new Date(agreementExpiry) : null,
        status: status || "ACTIVE"
      }
    });

    return NextResponse.json(principal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check principals permission for editing
    if (!checkPermission(session, 'principals', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to update principals" }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      address,
      contactPerson,
      phone,
      email,
      taxId,
      registrationNumber,
      agreementDate,
      agreementExpiry,
      status
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const principal = await prisma.principal.update({
      where: { id: id },
      data: {
        name,
        address,
        contactPerson,
        phone,
        email,
        taxId,
        registrationNumber,
        agreementDate: agreementDate ? new Date(agreementDate) : null,
        agreementExpiry: agreementExpiry ? new Date(agreementExpiry) : null,
        status: status || "ACTIVE"
      }
    });

    return NextResponse.json(principal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check principals permission for full access (delete operation)
    if (!checkPermission(session, 'principals', PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to delete principals" }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      throw new ApiError(400, "ID is required", "VALIDATION_ERROR");
    }

    await prisma.principal.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Principal deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}