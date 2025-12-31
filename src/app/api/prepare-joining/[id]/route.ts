import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

enum PrepareJoiningStatus {
  PREPARING = "PREPARING",
  DOCUMENTS_READY = "DOCUMENTS_READY",
  READY = "READY",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

type UpdatePrepareJoiningPayload = {
  status?: string;
  passportValid?: boolean;
  seamanBookValid?: boolean;
  certificatesValid?: boolean;
  medicalValid?: boolean;
  visaValid?: boolean;
  orientationCompleted?: boolean;
  ticketBooked?: boolean;
  hotelBooked?: boolean;
  transportArranged?: boolean;
  medicalCheckDate?: string | null;
  medicalExpiry?: string | null;
  orientationDate?: string | null;
  departureDate?: string | null;
  departurePort?: string | null;
  arrivalPort?: string | null;
  flightNumber?: string | null;
  hotelName?: string | null;
  remarks?: string | null;
  vesselId?: string | null;
  principalId?: string | null;
};

const prepareJoiningStatuses = new Set<PrepareJoiningStatus>([
  ...Object.values(PrepareJoiningStatus),
]);

function parseDateOrNull(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function parseStringOrNull(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

// GET /api/prepare-joining/[id] - Get single prepare joining record
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

    const prepareJoining = await prisma.prepareJoining.findUnique({
      where: { id },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            nationality: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            passportNumber: true,
            passportExpiry: true,
            seamanBookNumber: true,
            seamanBookExpiry: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            type: true,
            imoNumber: true,
            flag: true,
          },
        },
        principal: {
          select: {
            id: true,
            name: true,
            country: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!prepareJoining) {
      return NextResponse.json(
        { error: "Prepare joining not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(prepareJoining);
  } catch (error) {
    console.error("Error fetching prepare joining:", error);
    return NextResponse.json(
      { error: "Failed to fetch prepare joining" },
      { status: 500 }
    );
  }
}

// PUT /api/prepare-joining/[id] - Update prepare joining record
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

    const body = (await req.json()) as UpdatePrepareJoiningPayload;

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const normalizedStatus = body.status?.trim();
      if (
        !normalizedStatus ||
        !prepareJoiningStatuses.has(normalizedStatus as PrepareJoiningStatus)
      ) {
        return NextResponse.json(
          { error: "Invalid prepare joining status" },
          { status: 400 }
        );
      }
      updateData.status = normalizedStatus as PrepareJoiningStatus;
    }

    const passportValid = parseOptionalBoolean(body.passportValid);
    if (passportValid !== undefined) {
      updateData.passportValid = passportValid;
    }

    const seamanBookValid = parseOptionalBoolean(body.seamanBookValid);
    if (seamanBookValid !== undefined) {
      updateData.seamanBookValid = seamanBookValid;
    }

    const certificatesValid = parseOptionalBoolean(body.certificatesValid);
    if (certificatesValid !== undefined) {
      updateData.certificatesValid = certificatesValid;
    }

    const medicalValid = parseOptionalBoolean(body.medicalValid);
    if (medicalValid !== undefined) {
      updateData.medicalValid = medicalValid;
    }

    const visaValid = parseOptionalBoolean(body.visaValid);
    if (visaValid !== undefined) {
      updateData.visaValid = visaValid;
    }

    const orientationCompleted = parseOptionalBoolean(
      body.orientationCompleted
    );
    if (orientationCompleted !== undefined) {
      updateData.orientationCompleted = orientationCompleted;
    }

    const ticketBooked = parseOptionalBoolean(body.ticketBooked);
    if (ticketBooked !== undefined) {
      updateData.ticketBooked = ticketBooked;
    }

    const hotelBooked = parseOptionalBoolean(body.hotelBooked);
    if (hotelBooked !== undefined) {
      updateData.hotelBooked = hotelBooked;
    }

    const transportArranged = parseOptionalBoolean(body.transportArranged);
    if (transportArranged !== undefined) {
      updateData.transportArranged = transportArranged;
    }

    if (body.medicalCheckDate !== undefined) {
      updateData.medicalCheckDate = parseDateOrNull(body.medicalCheckDate);
    }

    if (body.medicalExpiry !== undefined) {
      updateData.medicalExpiry = parseDateOrNull(body.medicalExpiry);
    }

    if (body.orientationDate !== undefined) {
      updateData.orientationDate = parseDateOrNull(body.orientationDate);
    }

    if (body.departureDate !== undefined) {
      updateData.departureDate = parseDateOrNull(body.departureDate);
    }

    const departurePort = parseStringOrNull(body.departurePort);
    if (departurePort !== undefined) {
      updateData.departurePort = departurePort;
    }

    const arrivalPort = parseStringOrNull(body.arrivalPort);
    if (arrivalPort !== undefined) {
      updateData.arrivalPort = arrivalPort;
    }

    const flightNumber = parseStringOrNull(body.flightNumber);
    if (flightNumber !== undefined) {
      updateData.flightNumber = flightNumber;
    }

    const hotelName = parseStringOrNull(body.hotelName);
    if (hotelName !== undefined) {
      updateData.hotelName = hotelName;
    }

    const remarks = parseStringOrNull(body.remarks);
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const vesselId = parseStringOrNull(body.vesselId);
    if (vesselId !== undefined) {
      updateData.vessel = vesselId ? { connect: { id: vesselId } } : { disconnect: true };
    }

    const principalId = parseStringOrNull(body.principalId);
    if (principalId !== undefined) {
      updateData.principal = principalId ? { connect: { id: principalId } } : { disconnect: true };
    }

    const prepareJoining = await prisma.prepareJoining.update({
      where: { id },
      data: updateData,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            nationality: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        principal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(prepareJoining);
  } catch (error) {
    console.error("Error updating prepare joining:", error);
    return NextResponse.json(
      { error: "Failed to update prepare joining" },
      { status: 500 }
    );
  }
}

// DELETE /api/prepare-joining/[id] - Delete prepare joining record
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.prepareJoining.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Prepare joining deleted" });
  } catch (error) {
    console.error("Error deleting prepare joining:", error);
    return NextResponse.json(
      { error: "Failed to delete prepare joining" },
      { status: 500 }
    );
  }
}