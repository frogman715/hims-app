import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasExplicitRoleAccess } from "@/lib/authorization";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { ApiError, handleApiError } from "@/lib/error-handler";
import {
  ACTIVE_CONTRACT_STATUSES,
  contractDateRangesOverlap,
  normalizeContractNumber,
} from "@/lib/data-quality-hardening";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/contracts/detail", "GET");
    if (authError) return authError;

    const { id } = await params;
    const subject = {
      roles: session.user.roles,
      role: session.user.role,
      isSystemAdmin: session.user.isSystemAdmin === true,
    };
    const canViewIdentityFields = hasExplicitRoleAccess(subject, ["DIRECTOR", "OPERATIONAL"]);
    const canViewWageScaleItems = hasExplicitRoleAccess(subject, ["DIRECTOR", "ACCOUNTING"]);

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
            passportNumber: canViewIdentityFields,
            address: canViewIdentityFields
          },
        },
        vessel: true,
        principal: true,
        wageScaleHeader: true,
        wageScaleItems: canViewWageScaleItems ? {
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
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/contracts/detail",
      "PUT",
      "Insufficient permissions to update contracts"
    );
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const existingContract = await prisma.employmentContract.findUnique({
      where: { id },
      select: {
        id: true,
        contractNumber: true,
        crewId: true,
        contractKind: true,
        contractStart: true,
        contractEnd: true,
      },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const nextCrewId = String(body.crewId || existingContract.crewId).trim();
    const nextContractKind = body.contractKind || existingContract.contractKind || 'SEA';
    const nextContractNumber = normalizeContractNumber(
      body.contractNumber || existingContract.contractNumber
    );
    const nextContractStart = body.contractStart
      ? new Date(body.contractStart)
      : existingContract.contractStart;
    const nextContractEnd = body.contractEnd
      ? new Date(body.contractEnd)
      : existingContract.contractEnd;

    if (
      Number.isNaN(nextContractStart.getTime()) ||
      Number.isNaN(nextContractEnd.getTime())
    ) {
      throw new ApiError(400, "Contract start and end dates must be valid calendar dates", "VALIDATION_ERROR");
    }

    if (nextContractEnd <= nextContractStart) {
      throw new ApiError(400, "Contract end date must be later than the contract start date", "VALIDATION_ERROR");
    }

    const [crew, duplicateContractNumber, overlappingContract] = await Promise.all([
      prisma.crew.findUnique({
        where: { id: nextCrewId },
        select: { id: true, fullName: true },
      }),
      prisma.employmentContract.findFirst({
        where: {
          contractNumber: nextContractNumber,
          id: { not: id },
        },
        select: { id: true },
      }),
      prisma.employmentContract.findFirst({
        where: {
          crewId: nextCrewId,
          id: { not: id },
          status: { in: [...ACTIVE_CONTRACT_STATUSES] },
          contractKind: nextContractKind,
          contractStart: { lte: nextContractEnd },
          contractEnd: { gte: nextContractStart },
        },
        select: {
          id: true,
          contractNumber: true,
          contractStart: true,
          contractEnd: true,
          status: true,
        },
      }),
    ]);

    if (!crew) {
      throw new ApiError(404, "Crew record was not found for this contract", "NOT_FOUND");
    }

    if (duplicateContractNumber) {
      throw new ApiError(409, "Contract number is already registered on another contract record.", "DUPLICATE_CONTRACT_NUMBER");
    }

    if (
      overlappingContract &&
      contractDateRangesOverlap(
        overlappingContract.contractStart,
        overlappingContract.contractEnd,
        nextContractStart,
        nextContractEnd
      )
    ) {
      throw new ApiError(
        409,
        `Crew already has an overlapping ${overlappingContract.status.toLowerCase()} contract (${overlappingContract.contractNumber}) in this date range.`,
        "CONTRACT_OVERLAP"
      );
    }

    const contract = await prisma.$transaction(async (tx) => {
      const updatedContract = await tx.employmentContract.update({
        where: {
          id: id,
        },
        data: {
          contractNumber: nextContractNumber,
          contractKind: nextContractKind,
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
          crewId: nextCrewId,
          vesselId: body.vesselId || null,
          principalId: body.principalId || null,
          rank: String(body.rank || "").trim(),
          contractStart: nextContractStart,
          contractEnd: nextContractEnd,
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

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "CONTRACT_UPDATED",
          entityType: "EmploymentContract",
          entityId: updatedContract.id,
          metadataJson: {
            crewId: updatedContract.crewId,
            crewName: crew.fullName,
            contractNumber: updatedContract.contractNumber,
            contractKind: updatedContract.contractKind,
            status: updatedContract.status,
          },
        },
      });

      return updatedContract;
    });

    return NextResponse.json(contract);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check contracts permission for full access (delete operation)
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/contracts/detail",
      "DELETE",
      "Insufficient permissions to delete contracts"
    );
    if (authError) return authError;

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
