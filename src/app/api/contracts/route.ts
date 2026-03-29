import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasExplicitRoleAccess } from "@/lib/authorization";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { handleApiError, ApiError } from "@/lib/error-handler";
import {
  ACTIVE_CONTRACT_STATUSES,
  contractDateRangesOverlap,
  normalizeContractNumber,
} from "@/lib/data-quality-hardening";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/contracts",
      "GET",
      "Insufficient permissions to view contracts"
    );
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const crewId = searchParams.get('crewId');

    const whereClause: Record<string, unknown> = {};
    const subject = {
      roles: session.user.roles,
      role: session.user.role,
      isSystemAdmin: session.user.isSystemAdmin === true,
    };
    const canViewIdentityFields = hasExplicitRoleAccess(subject, ["DIRECTOR", "OPERATIONAL"]);
    const canViewWageScaleItems = hasExplicitRoleAccess(subject, ["DIRECTOR", "ACCOUNTING"]);

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
            passportNumber: canViewIdentityFields,
            seamanBookNumber: canViewIdentityFields,
            dateOfBirth: true
          }
        },
        vessel: true,
        principal: true,
        wageScaleHeader: true,
        wageScaleItems: canViewWageScaleItems ? {
          include: {
            wageScaleHeader: true
          }
        } : false
      }
    });

    return NextResponse.json(contracts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/contracts",
      "POST",
      "Insufficient permissions to create contracts"
    );
    if (authError) return authError;

    const body = await request.json();

    // Validate required fields
    if (!body.contractNumber || !body.crewId || !body.rank || !body.contractStart || !body.contractEnd) {
      throw new ApiError(400, "Required fields are missing: contractNumber, crewId, rank, contractStart, contractEnd", "VALIDATION_ERROR");
    }

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

    const normalizedContractNumber = normalizeContractNumber(contractNumber);
    const parsedContractStart = new Date(contractStart);
    const parsedContractEnd = new Date(contractEnd);
    const normalizedRank = String(rank).trim();

    if (
      Number.isNaN(parsedContractStart.getTime()) ||
      Number.isNaN(parsedContractEnd.getTime())
    ) {
      throw new ApiError(400, "Contract start and end dates must be valid calendar dates", "VALIDATION_ERROR");
    }

    if (parsedContractEnd <= parsedContractStart) {
      throw new ApiError(400, "Contract end date must be later than the contract start date", "VALIDATION_ERROR");
    }

    const [crew, duplicateContractNumber, overlappingContract] = await Promise.all([
      prisma.crew.findUnique({
        where: { id: crewId },
        select: { id: true, fullName: true },
      }),
      prisma.employmentContract.findFirst({
        where: { contractNumber: normalizedContractNumber },
        select: { id: true },
      }),
      prisma.employmentContract.findFirst({
        where: {
          crewId,
          status: { in: [...ACTIVE_CONTRACT_STATUSES] },
          contractKind: contractKind || "SEA",
          contractStart: { lte: parsedContractEnd },
          contractEnd: { gte: parsedContractStart },
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
      throw new ApiError(409, "Contract number is already registered. Use the existing contract record instead of creating a duplicate.", "DUPLICATE_CONTRACT_NUMBER");
    }

    if (
      overlappingContract &&
      contractDateRangesOverlap(
        overlappingContract.contractStart,
        overlappingContract.contractEnd,
        parsedContractStart,
        parsedContractEnd
      )
    ) {
      throw new ApiError(
        409,
        `Crew already has an overlapping ${overlappingContract.status.toLowerCase()} contract (${overlappingContract.contractNumber}) in this date range.`,
        "CONTRACT_OVERLAP"
      );
    }

    const contract = await prisma.$transaction(async (tx) => {
      const createdContract = await tx.employmentContract.create({
        data: {
          contractNumber: normalizedContractNumber,
          crewId,
          vesselId,
          principalId,
          rank: normalizedRank,
          contractStart: parsedContractStart,
          contractEnd: parsedContractEnd,
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

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "CONTRACT_CREATED",
          entityType: "EmploymentContract",
          entityId: createdContract.id,
          metadataJson: {
            crewId,
            crewName: crew.fullName,
            contractNumber: createdContract.contractNumber,
            contractKind: createdContract.contractKind,
            contractStart: createdContract.contractStart,
            contractEnd: createdContract.contractEnd,
          },
        },
      });

      return createdContract;
    });

    return NextResponse.json(contract);
  } catch (error) {
    return handleApiError(error);
  }
}
