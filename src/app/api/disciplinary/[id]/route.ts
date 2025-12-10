import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { disciplinaryGuard } from "@/lib/permission-middleware";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check disciplinary permission
    if (!disciplinaryGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const record = await prisma.disciplinaryRecord.findUnique({
      where: {
        id: id,
      },
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Disciplinary record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching disciplinary record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disciplinary record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { id } = await params;

    const record = await prisma.disciplinaryRecord.update({
      where: {
        id: id,
      },
      data: {
        crewId: body.crewId,
        vesselId: body.vesselId,
        incidentDate: new Date(body.incidentDate),
        reportedBy: body.reportedBy,
        description: body.description,
        action: body.action,
        severity: body.severity || 'MINOR',
        status: body.status,
        resolution: body.resolution,
        resolvedBy: body.resolvedBy,
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : null,
      },
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating disciplinary record:', error);
    return NextResponse.json(
      { error: 'Failed to update disciplinary record' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.disciplinaryRecord.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Disciplinary record deleted successfully' });
  } catch (error) {
    console.error('Error deleting disciplinary record:', error);
    return NextResponse.json(
      { error: 'Failed to delete disciplinary record' },
      { status: 500 }
    );
  }
}