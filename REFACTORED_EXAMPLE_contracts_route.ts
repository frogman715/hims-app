/**
 * REFACTORED VERSION - src/app/api/contracts/route.ts
 * 
 * IMPROVEMENTS:
 * 1. ✅ Removed console.error → uses logger
 * 2. ✅ Better type safety with Prisma types
 * 3. ✅ Proper role-based data filtering
 * 4. ✅ Input validation with Zod
 * 5. ✅ Constants instead of magic values
 * 6. ✅ Proper pagination
 * 7. ✅ Structured error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { logger } from "@/lib/logger";
import { 
  DEFAULT_PAGE_SIZE, 
  MAX_PAGE_SIZE,
  MIN_CONTRACT_DURATION_MONTHS,
  MAX_CONTRACT_DURATION_MONTHS 
} from "@/lib/constants";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// ============================================
// TYPE DEFINITIONS
// ============================================

const CreateContractSchema = z.object({
  contractNumber: z.string().min(1, "Contract number required"),
  crewId: z.string().cuid("Invalid crew ID"),
  vesselId: z.string().cuid("Invalid vessel ID").optional(),
  principalId: z.string().cuid("Invalid principal ID").optional(),
  rank: z.string().min(1, "Rank required"),
  contractStart: z.string().datetime("Invalid start date"),
  contractEnd: z.string().datetime("Invalid end date"),
  basicWage: z.number().positive("Wage must be positive").or(z.string().transform(Number)),
  currency: z.enum(['USD', 'EUR', 'SGD', 'IDR']).default('USD'),
  contractKind: z.enum(['SEA', 'OFFICE_PKL']).default('SEA'),
  seaType: z.string().optional(),
  maritimeLaw: z.string().optional(),
  cbaReference: z.string().optional(),
  wageScaleHeaderId: z.string().cuid().optional(),
  guaranteedOTHours: z.number().int().nonnegative().optional().or(z.string().transform(Number)),
  overtimeRate: z.number().positive().optional(),
  onboardAllowance: z.number().nonnegative().optional().or(z.string().transform(Number)),
  homeAllotment: z.number().nonnegative().optional().or(z.string().transform(Number)),
  specialAllowance: z.number().nonnegative().optional().or(z.string().transform(Number)),
  templateVersion: z.string().optional()
});

type CreateContractInput = z.infer<typeof CreateContractSchema>;

// ============================================
// GET /api/contracts
// ============================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check
    if (!checkPermission(session, 'contracts', PermissionLevel.VIEW_ACCESS)) {
      logger.warn('Unauthorized contract access attempt', {
        userId: session.user.id,
        roles: session.user.roles,
        endpoint: '/api/contracts'
      });
      return NextResponse.json(
        { error: "Insufficient permissions to view contracts" }, 
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const crewId = searchParams.get('crewId');
    const principalId = searchParams.get('principalId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)),
      MAX_PAGE_SIZE
    );

    // Build where clause based on role and filters
    const where: Prisma.EmploymentContractWhereInput = {};

    // Apply role-based filters
    const userRoles = session.user.roles || [];
    
    if (userRoles.includes('CREW_PORTAL')) {
      // Crew can only see their own contracts
      // TODO: Get crewId from user profile
      const userCrewProfile = await prisma.crew.findFirst({
        where: { userId: session.user.id },
        select: { id: true }
      });
      
      if (userCrewProfile) {
        where.crewId = userCrewProfile.id;
      } else {
        // No crew profile = no contracts
        return NextResponse.json({ 
          data: [], 
          total: 0,
          page,
          limit 
        });
      }
      
      // Crew portal only sees SEA contracts (not OFFICE_PKL)
      where.contractKind = 'SEA';
    }

    if (userRoles.includes('OPERATIONAL')) {
      // Operational only sees active/pending contracts
      where.status = { in: ['ACTIVE', 'PENDING', 'DRAFT'] };
    }

    // Apply query filters (if authorized)
    if (crewId && !userRoles.includes('CREW_PORTAL')) {
      where.crewId = crewId;
    }

    if (principalId) {
      where.principalId = principalId;
    }

    if (status) {
      where.status = status as Prisma.EnumContractStatusFilter;
    }

    // Build select clause based on role (data masking)
    const includeWageData = 
      userRoles.includes('DIRECTOR') || 
      userRoles.includes('ACCOUNTING');

    const includeSensitiveData = 
      userRoles.includes('DIRECTOR') || 
      userRoles.includes('CDMO');

    // Fetch contracts with pagination
    const [contracts, total] = await prisma.$transaction([
      prisma.employmentContract.findMany({
        where,
        select: {
          id: true,
          contractNumber: true,
          rank: true,
          contractStart: true,
          contractEnd: true,
          status: true,
          contractKind: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          
          // Basic wage - only for authorized roles
          ...(includeWageData && {
            basicWage: true,
            guaranteedOTHours: true,
            overtimeRate: true,
            onboardAllowance: true,
            homeAllotment: true,
            specialAllowance: true
          }),
          
          // Crew details with role-based masking
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
              nationality: true,
              
              // RED level data - only DIRECTOR/CDMO
              ...(includeSensitiveData && {
                passportNumber: true,
                seamanBookNumber: true,
                dateOfBirth: true
              })
            }
          },
          
          // Vessel & Principal (non-sensitive)
          vessel: {
            select: {
              id: true,
              name: true,
              vesselType: true,
              flag: true
            }
          },
          principal: {
            select: {
              id: true,
              name: true,
              country: true
            }
          },
          
          // Wage scale - only for authorized roles
          ...(includeWageData && {
            wageScaleHeader: {
              select: {
                id: true,
                name: true,
                currency: true
              }
            },
            wageScaleItems: {
              include: {
                wageScaleHeader: true
              }
            }
          })
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      
      // Count total for pagination
      prisma.employmentContract.count({ where })
    ]);

    const duration = Date.now() - startTime;
    
    logger.info('Contracts fetched successfully', {
      userId: session.user.id,
      roles: userRoles,
      count: contracts.length,
      total,
      page,
      duration
    });

    return NextResponse.json({
      data: contracts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to fetch contracts', error as Error, {
      userId: (await getServerSession(authOptions))?.user?.id,
      endpoint: '/api/contracts',
      method: 'GET',
      duration
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/contracts
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check
    if (!checkPermission(session, 'contracts', PermissionLevel.EDIT_ACCESS)) {
      logger.warn('Unauthorized contract creation attempt', {
        userId: session.user.id,
        roles: session.user.roles
      });
      return NextResponse.json(
        { error: "Insufficient permissions to create contracts" },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    
    let validatedData: CreateContractInput;
    try {
      validatedData = CreateContractSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Validation failed", 
            details: validationError.errors 
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Business logic validation
    const contractStart = new Date(validatedData.contractStart);
    const contractEnd = new Date(validatedData.contractEnd);
    const durationMonths = (contractEnd.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (contractStart >= contractEnd) {
      return NextResponse.json(
        { error: "Contract end date must be after start date" },
        { status: 400 }
      );
    }

    if (durationMonths < MIN_CONTRACT_DURATION_MONTHS) {
      return NextResponse.json(
        { error: `Contract duration must be at least ${MIN_CONTRACT_DURATION_MONTHS} month(s)` },
        { status: 400 }
      );
    }

    if (durationMonths > MAX_CONTRACT_DURATION_MONTHS) {
      return NextResponse.json(
        { error: `Contract duration cannot exceed ${MAX_CONTRACT_DURATION_MONTHS} months (MLC requirement)` },
        { status: 400 }
      );
    }

    // Check for duplicate contract number
    const existingContract = await prisma.employmentContract.findFirst({
      where: { contractNumber: validatedData.contractNumber }
    });

    if (existingContract) {
      return NextResponse.json(
        { error: "Contract number already exists" },
        { status: 409 }
      );
    }

    // Create contract with type-safe data
    const createData: Prisma.EmploymentContractCreateInput = {
      contractNumber: validatedData.contractNumber,
      rank: validatedData.rank,
      contractStart,
      contractEnd,
      basicWage: validatedData.basicWage,
      currency: validatedData.currency,
      status: 'DRAFT',
      contractKind: validatedData.contractKind,
      
      // Relations
      crew: { connect: { id: validatedData.crewId } },
      ...(validatedData.vesselId && {
        vessel: { connect: { id: validatedData.vesselId } }
      }),
      ...(validatedData.principalId && {
        principal: { connect: { id: validatedData.principalId } }
      }),
      ...(validatedData.wageScaleHeaderId && {
        wageScaleHeader: { connect: { id: validatedData.wageScaleHeaderId } }
      }),
      
      // Optional fields
      ...(validatedData.seaType && { seaType: validatedData.seaType }),
      ...(validatedData.maritimeLaw && { maritimeLaw: validatedData.maritimeLaw }),
      ...(validatedData.cbaReference && { cbaReference: validatedData.cbaReference }),
      ...(validatedData.guaranteedOTHours && { guaranteedOTHours: validatedData.guaranteedOTHours }),
      ...(validatedData.overtimeRate && { overtimeRate: validatedData.overtimeRate }),
      ...(validatedData.onboardAllowance && { onboardAllowance: validatedData.onboardAllowance }),
      ...(validatedData.homeAllotment && { homeAllotment: validatedData.homeAllotment }),
      ...(validatedData.specialAllowance && { specialAllowance: validatedData.specialAllowance }),
      ...(validatedData.templateVersion && { templateVersion: validatedData.templateVersion })
    };

    const contract = await prisma.employmentContract.create({
      data: createData,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true
          }
        },
        vessel: true,
        principal: true
      }
    });

    const duration = Date.now() - startTime;
    
    logger.info('Contract created successfully', {
      userId: session.user.id,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      crewId: validatedData.crewId,
      duration
    });

    return NextResponse.json(contract, { status: 201 });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to create contract', error as Error, {
      userId: (await getServerSession(authOptions))?.user?.id,
      endpoint: '/api/contracts',
      method: 'POST',
      duration
    });

    // Check for Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Contract number already exists" },
          { status: 409 }
        );
      }
      
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: "Referenced crew, vessel, or principal not found" },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
