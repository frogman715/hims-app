import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CrewingChecklistStatus } from '@prisma/client';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';
import { handleApiError } from '@/lib/error-handler';

/**
 * GET /api/crewing/checklists
 * Fetch checklists with optional filters
 * 
 * Query params:
 * - applicationId?: string - Filter by application
 * - crewId?: string - Filter by crew member
 * - status?: string - Filter by checklist status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crewing/checklists', 'GET');
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const crewId = searchParams.get('crewId');
    const statusParam = searchParams.get('status');

    interface ChecklistWhereInput {
      applicationId?: string | null;
      crewId?: string | null;
      status?: CrewingChecklistStatus;
    }
    
    const where: ChecklistWhereInput = {};
    
    if (applicationId) where.applicationId = applicationId;
    if (crewId) where.crewId = crewId;
    if (statusParam && Object.values(CrewingChecklistStatus).includes(statusParam as CrewingChecklistStatus)) {
      where.status = statusParam as CrewingChecklistStatus;
    }

    const checklists = await prisma.crewingChecklist.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            position: true,
            applicationDate: true,
            crew: { select: { id: true, fullName: true } }
          }
        },
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true
          }
        },
        submittedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      count: checklists.length,
      data: checklists,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/crewing/checklists
 * Create a new checklist for an application or crew member
 * 
 * TEMPORARILY DISABLED - CrewingChecklist table missing from production database
 * TODO: Run Prisma migration to create table
 */
export async function POST() {
  return NextResponse.json(
    { error: 'CrewingChecklist feature temporarily disabled. Database table is missing.' },
    { status: 503 }
  );
}
