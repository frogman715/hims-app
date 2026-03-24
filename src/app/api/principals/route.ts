import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import {
  principalCreateSchema,
  principalUpdateSchema,
} from "@/lib/crewing-ops-schemas";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/principals", "GET");
    if (authError) {
      return authError;
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
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/principals",
      "POST",
      "Insufficient permissions to create principals"
    );
    if (authError) {
      return authError;
    }

    if (!session.user?.id) {
      throw new ApiError(401, "Unauthorized", "AUTHENTICATION_ERROR");
    }

    const parsedBody = principalCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid principal payload", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    const principal = await prisma.principal.create({
      data: {
        name: body.name,
        country: body.country ?? "INDONESIA",
        address: body.address ?? "",
        contactPerson: body.contactPerson,
        phone: body.phone,
        email: body.email,
        taxId: body.taxId,
        registrationNumber: body.registrationNumber,
        agreementDate: body.agreementDate ? new Date(body.agreementDate) : null,
        agreementExpiry: body.agreementExpiry ? new Date(body.agreementExpiry) : null,
        status: body.status ?? "ACTIVE"
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "PRINCIPAL_CREATED",
        entityType: "Principal",
        entityId: principal.id,
        metadataJson: {
          name: principal.name,
          status: principal.status,
          country: principal.country,
        },
      },
    });

    return NextResponse.json(principal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/principals",
      "PUT",
      "Insufficient permissions to update principals"
    );
    if (authError) {
      return authError;
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (!session.user?.id) {
      throw new ApiError(401, "Unauthorized", "AUTHENTICATION_ERROR");
    }

    const parsedBody = principalUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid principal payload", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    const principal = await prisma.principal.update({
      where: { id: id },
      data: {
        name: body.name,
        country: body.country ?? undefined,
        address: body.address ?? "",
        contactPerson: body.contactPerson,
        phone: body.phone,
        email: body.email,
        taxId: body.taxId,
        registrationNumber: body.registrationNumber,
        agreementDate:
          body.agreementDate === undefined
            ? undefined
            : body.agreementDate
              ? new Date(body.agreementDate)
              : null,
        agreementExpiry:
          body.agreementExpiry === undefined
            ? undefined
            : body.agreementExpiry
              ? new Date(body.agreementExpiry)
              : null,
        status: body.status ?? "ACTIVE"
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "PRINCIPAL_UPDATED",
        entityType: "Principal",
        entityId: principal.id,
        metadataJson: {
          name: principal.name,
          status: principal.status,
          country: principal.country,
        },
      },
    });

    return NextResponse.json(principal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/principals",
      "DELETE",
      "Insufficient permissions to delete principals"
    );
    if (authError) {
      return authError;
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      throw new ApiError(400, "ID is required", "VALIDATION_ERROR");
    }

    if (!session.user?.id) {
      throw new ApiError(401, "Unauthorized", "AUTHENTICATION_ERROR");
    }

    const principal = await prisma.principal.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });

    if (!principal) {
      throw new ApiError(404, "Principal not found", "NOT_FOUND");
    }

    await prisma.principal.delete({
      where: { id: id }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "PRINCIPAL_DELETED",
        entityType: "Principal",
        entityId: principal.id,
        metadataJson: {
          name: principal.name,
          status: principal.status,
        },
      },
    });

    return NextResponse.json({ message: "Principal deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
