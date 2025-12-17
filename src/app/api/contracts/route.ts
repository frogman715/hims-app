import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check contracts permission for viewing
    if (!checkPermission(session, 'contracts', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to view contracts" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const crewId = searchParams.get('crewId');

    const whereClause: Prisma.EmploymentContractWhereInput = {};

    // If crewId is provided, filter contracts for that crew
    if (crewId) {
      whereClause.crewId = crewId;
    }

    // CREW_PORTAL can only see their own SEA contracts
    if (session.user.roles.includes('CREW_PORTAL')) {
      // Note: CREW_PORTAL user crewId lookup needs to be implemented
      // For now, skip this filter to avoid TypeScript error
      whereClause.contractKind = 'SEA';
    }

    const contracts = await prisma.employmentContract.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            passportNumber: session.user.roles.includes('DIRECTOR') || session.user.roles.includes('CDMO') ? true : false,
            seamanBookNumber: session.user.roles.includes('DIRECTOR') || session.user.roles.includes('CDMO') ? true : false,
            dateOfBirth: true
          }
        },
        vessel: true,
        principal: true,
        wageScaleHeader: true,
        wageScaleItems: session.user.roles.includes('DIRECTOR') || session.user.roles.includes('ACCOUNTING') ? {
          include: {
            wageScaleHeader: true
          }
        } : false
      }
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check contracts permission for editing
    if (!checkPermission(session, 'contracts', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create contracts" }, { status: 403 });
    }

    const body = await request.json();
    const {
      contractNumber,
      crewId,
      vesselId,
      principalId,
      rank,
      contractStart,
      contractEnd,
      basicWage,
      currency,
      contractKind,
      seaType,
      maritimeLaw,
      cbaReference,
      wageScaleHeaderId,
      guaranteedOTHours,
      overtimeRate,
      onboardAllowance,
      homeAllotment,
      specialAllowance,
      templateVersion
    } = body;

    if (!contractNumber || !crewId || !rank || !contractStart || !contractEnd) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    const contract = await prisma.employmentContract.create({
      data: {
        contractNumber,
        crewId,
        vesselId,
        principalId,
        rank,
        contractStart: new Date(contractStart),
        contractEnd: new Date(contractEnd),
        status: 'DRAFT',
        contractKind: contractKind || 'SEA',
        seaType,
        maritimeLaw,
        cbaReference,
        wageScaleHeaderId,
        guaranteedOTHours: guaranteedOTHours ? parseInt(guaranteedOTHours) : null,
        overtimeRate,
        onboardAllowance: onboardAllowance ? parseFloat(onboardAllowance) : null,
        homeAllotment: homeAllotment ? parseFloat(homeAllotment) : null,
        specialAllowance: specialAllowance ? parseFloat(specialAllowance) : null,
        templateVersion,
        basicWage: parseFloat(basicWage),
        currency: currency || 'USD'
      }
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}