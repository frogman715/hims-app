import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, agencyFeesGuard, PermissionLevel } from "@/lib/permission-middleware";

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

    // Check agency fees permission
    if (!agencyFeesGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const fee = await prisma.agencyFee.findUnique({
      where: {
        id: id,
      },
      include: {
        principal: {
          select: {
            name: true,
          },
        },
        contract: {
          select: {
            contractNumber: true,
          },
        },
      },
    });

    if (!fee) {
      return NextResponse.json(
        { error: 'Agency fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Error fetching agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency fee' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check agency fees permission for editing
    if (!checkPermission(session, 'agencyFees', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to update agency fees" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const fee = await prisma.agencyFee.update({
      where: {
        id: id,
      },
      data: {
        principalId: body.principalId,
        contractId: body.contractId,
        feeType: body.feeType,
        amount: body.amount,
        currency: body.currency,
        percentage: body.percentage || null,
        description: body.description,
        dueDate: new Date(body.dueDate),
        paidDate: body.paidDate ? new Date(body.paidDate) : null,
        status: body.status,
      },
      include: {
        principal: {
          select: {
            name: true,
          },
        },
        contract: {
          select: {
            contractNumber: true,
          },
        },
      },
    });

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Error updating agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to update agency fee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check agency fees permission for full access (delete operation)
    if (!checkPermission(session, 'agencyFees', PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to delete agency fees" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.agencyFee.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Agency fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to delete agency fee' },
      { status: 500 }
    );
  }
}