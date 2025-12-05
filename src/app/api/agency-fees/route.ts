import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, agencyFeesGuard, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check agency fees permission
    if (!agencyFeesGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const fees = await prisma.agencyFee.findMany({
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
      orderBy: {
        dueDate: 'desc',
      },
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Error fetching agency fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency fees' },
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

    // Check agency fees permission for editing
    if (!checkPermission(session, 'agencyFees', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create agency fees" }, { status: 403 });
    }
    const body = await request.json();

    const fee = await prisma.agencyFee.create({
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
        status: body.status || 'PENDING',
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

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error('Error creating agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to create agency fee' },
      { status: 500 }
    );
  }
}