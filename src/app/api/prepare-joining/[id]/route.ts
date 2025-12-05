import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// GET /api/prepare-joining/[id] - Get single prepare joining record
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

    const prepareJoining = await prisma.prepareJoining.findUnique({
      where: { id: params.id },
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
            passportIssueDate: true,
            passportExpiryDate: true,
            seamanBookNumber: true,
            seamanBookIssueDate: true,
            seamanBookExpiryDate: true,
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
            contactEmail: true,
            contactPhone: true,
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
    const {
      status,
      passportValid,
      seamanBookValid,
      certificatesValid,
      medicalValid,
      visaValid,
      orientationCompleted,
      ticketBooked,
      hotelBooked,
      transportArranged,
      medicalCheckDate,
      medicalExpiry,
      orientationDate,
      departureDate,
      departurePort,
      arrivalPort,
      flightNumber,
      hotelName,
      remarks,
      vesselId,
      principalId,
    } = body;

    // Build update data object
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (passportValid !== undefined) updateData.passportValid = passportValid;
    if (seamanBookValid !== undefined)
      updateData.seamanBookValid = seamanBookValid;
    if (certificatesValid !== undefined)
      updateData.certificatesValid = certificatesValid;
    if (medicalValid !== undefined) updateData.medicalValid = medicalValid;
    if (visaValid !== undefined) updateData.visaValid = visaValid;
    if (orientationCompleted !== undefined)
      updateData.orientationCompleted = orientationCompleted;
    if (ticketBooked !== undefined) updateData.ticketBooked = ticketBooked;
    if (hotelBooked !== undefined) updateData.hotelBooked = hotelBooked;
    if (transportArranged !== undefined)
      updateData.transportArranged = transportArranged;

    if (medicalCheckDate !== undefined)
      updateData.medicalCheckDate = medicalCheckDate
        ? new Date(medicalCheckDate)
        : null;
    if (medicalExpiry !== undefined)
      updateData.medicalExpiry = medicalExpiry ? new Date(medicalExpiry) : null;
    if (orientationDate !== undefined)
      updateData.orientationDate = orientationDate
        ? new Date(orientationDate)
        : null;
    if (departureDate !== undefined)
      updateData.departureDate = departureDate ? new Date(departureDate) : null;
    if (departurePort !== undefined) updateData.departurePort = departurePort;
    if (arrivalPort !== undefined) updateData.arrivalPort = arrivalPort;
    if (flightNumber !== undefined) updateData.flightNumber = flightNumber;
    if (hotelName !== undefined) updateData.hotelName = hotelName;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (vesselId !== undefined) updateData.vesselId = vesselId;
    if (principalId !== undefined) updateData.principalId = principalId;

    const prepareJoining = await prisma.prepareJoining.update({
      where: { id: params.id },
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

    await prisma.prepareJoining.delete({
      where: { id: params.id },
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