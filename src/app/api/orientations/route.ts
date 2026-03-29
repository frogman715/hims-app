import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check quality permission for orientations access
    if (!checkPermission(session, 'quality', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const orientations = await prisma.orientation.findMany({
      include: {
        crew: {
          select: {
            fullName: true,
            rank: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(orientations);
  } catch (error) {
    console.error('Error fetching orientations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orientations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check quality permission for orientations editing
    if (!checkPermission(session, 'quality', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { crewId, startDate, remarks } = body;

    // Validate required fields
    if (!crewId || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if crew exists
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
    });

    if (!crew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    const parsedStartDate = new Date(startDate);
    if (Number.isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { error: 'Orientation date must be a valid calendar date' },
        { status: 400 }
      );
    }

    const existingOrientation = await prisma.orientation.findFirst({
      where: {
        crewId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      select: {
        id: true,
        status: true,
        startDate: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    if (existingOrientation) {
      return NextResponse.json(
        {
          error: `This employee already has an open orientation workflow (${existingOrientation.status}) started on ${existingOrientation.startDate.toISOString().split('T')[0]}. Update that record instead of scheduling a duplicate session.`,
        },
        { status: 409 }
      );
    }

    const orientation = await prisma.$transaction(async (tx) => {
      const createdOrientation = await tx.orientation.create({
        data: {
          crewId: crewId,
          startDate: parsedStartDate,
          remarks,
        },
        include: {
          crew: {
            select: {
              fullName: true,
              rank: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "ORIENTATION_CREATED",
          entityType: "Orientation",
          entityId: createdOrientation.id,
          metadataJson: {
            crewId,
            crewName: crew.fullName,
            startDate: createdOrientation.startDate,
            status: createdOrientation.status,
          },
        },
      });

      return createdOrientation;
    });

    return NextResponse.json(orientation, { status: 201 });
  } catch (error) {
    console.error('Error creating orientation:', error);
    return NextResponse.json(
      { error: 'Failed to create orientation' },
      { status: 500 }
    );
  }
}
