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

    // Check insurance permission
    if (!checkPermission(session, 'insurance', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const records = await prisma.insuranceRecord.findMany({
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
      orderBy: {
        expiryDate: 'desc',
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching insurance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance records' },
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

    // Check insurance permission for editing
    if (!checkPermission(session, 'insurance', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    const record = await prisma.insuranceRecord.create({
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
        status: body.status || 'ACTIVE',
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

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance record:', error);
    return NextResponse.json(
      { error: 'Failed to create insurance record' },
      { status: 500 }
    );
  }
}