import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { UserRole } from "@/lib/permissions";

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

    // Check contracts permission
    if (!checkPermission(session, 'contracts', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;

    // For CREW_PORTAL, check if this contract belongs to them
    if (session.user.roles.includes('CREW_PORTAL')) {
      const contractCheck = await prisma.employmentContract.findUnique({
        where: { id },
        select: { crewId: true, contractKind: true }
      });
      // Note: CREW_PORTAL crewId validation needs to be implemented
      // For now, allow access to SEA contracts only
      if (!contractCheck || contractCheck.contractKind !== 'SEA') {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const contract = await prisma.employmentContract.findUnique({
      where: {
        id: id,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            dateOfBirth: true,
            passportNumber: session.user.roles.includes('DIRECTOR') || session.user.roles.includes('CDMO') ? true : false,
            address: session.user.roles.includes('DIRECTOR') || session.user.roles.includes('CDMO') ? true : false
          },
        },
        vessel: true,
        principal: true,
        wageScaleHeader: true,
        wageScaleItems: session.user.roles.includes('DIRECTOR') || session.user.roles.includes('ACCOUNTING') ? {
          include: {
            wageScaleHeader: true
          }
        } : false
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
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

    // Check contracts permission for editing
    if (!checkPermission(session, 'contracts', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to update contracts" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const contract = await prisma.employmentContract.update({
      where: {
        id: id,
      },
      data: {
        contractNumber: body.contractNumber,
        contractKind: body.contractKind || 'SEA',
        seaType: body.seaType,
        maritimeLaw: body.maritimeLaw,
        cbaReference: body.cbaReference,
        wageScaleHeaderId: body.wageScaleHeaderId,
        guaranteedOTHours: body.guaranteedOTHours ? parseInt(body.guaranteedOTHours) : null,
        overtimeRate: body.overtimeRate,
        onboardAllowance: body.onboardAllowance ? parseFloat(body.onboardAllowance) : null,
        homeAllotment: body.homeAllotment ? parseFloat(body.homeAllotment) : null,
        specialAllowance: body.specialAllowance ? parseFloat(body.specialAllowance) : null,
        templateVersion: body.templateVersion,
        crewId: body.crewId,
        vesselId: body.vesselId || null,
        principalId: body.principalId || null,
        rank: body.rank,
        contractStart: new Date(body.contractStart),
        contractEnd: new Date(body.contractEnd),
        status: body.status,
        basicWage: parseFloat(body.basicWage),
        currency: body.currency || 'USD'
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            dateOfBirth: true,
            passportNumber: true,
            address: true
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            flag: true,
            imoNumber: true
          },
        },
        principal: {
          select: {
            id: true,
            name: true,
            address: true
          },
        },
        wageScaleItems: {
          include: {
            wageScaleHeader: {
              select: {
                name: true,
                principalId: true
              }
            }
          }
        }
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
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

    // Check contracts permission for full access (delete operation)
    if (!checkPermission(session, 'contracts', PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to delete contracts" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.employmentContract.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
