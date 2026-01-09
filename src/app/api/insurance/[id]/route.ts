import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkPermission(session, 'insurance', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const record = await prisma.insuranceRecord.findUnique({
      where: {
        id: id,
      },
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
        vessel: {
          select: {
            name: true,
          },
        },
        principal: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Insurance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching insurance record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkPermission(session, 'insurance', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = await params;

    const record = await prisma.insuranceRecord.update({
      where: {
        id: id,
      },
      data: {
        crewId: body.crewId,
        vesselId: body.vesselId,
        principalId: body.principalId,
        insuranceType: body.insuranceType,
        provider: body.provider,
        policyNumber: body.policyNumber,
        coverageAmount: body.coverageAmount,
        premiumAmount: body.premiumAmount,
        currency: body.currency,
        startDate: new Date(body.startDate),
        expiryDate: new Date(body.expiryDate),
        status: body.status,
      },
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
        vessel: {
          select: {
            name: true,
          },
        },
        principal: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating insurance record:', error);
    return NextResponse.json(
      { error: 'Failed to update insurance record' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkPermission(session, 'insurance', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.insuranceRecord.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Insurance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting insurance record:', error);
    return NextResponse.json(
      { error: 'Failed to delete insurance record' },
      { status: 500 }
    );
  }
}