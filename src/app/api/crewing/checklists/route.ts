import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CrewingChecklistStatus } from '@prisma/client';

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
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    console.error('Error fetching checklists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crewing/checklists
 * Create a new checklist for an application or crew member
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { applicationId, crewId, procedureId, checklistCode, itemsJson = [] } = body;

    // Validate required fields
    if (!applicationId && !crewId) {
      return NextResponse.json(
        { error: 'Either applicationId or crewId is required' },
        { status: 400 }
      );
    }

    if (!procedureId) {
      return NextResponse.json(
        { error: 'procedureId is required' },
        { status: 400 }
      );
    }

    if (!checklistCode) {
      return NextResponse.json(
        { error: 'checklistCode is required' },
        { status: 400 }
      );
    }

    const checklist = await prisma.crewingChecklist.create({
      data: {
        procedureId,
        checklistCode,
        applicationId: applicationId || null,
        crewId: crewId || null,
        status: 'NOT_STARTED',
        itemsJson: itemsJson || [],
        submittedById: session.user.id || null,
      },
      include: {
        application: { select: { id: true, position: true } },
        crew: { select: { id: true, fullName: true } },
        submittedBy: { select: { id: true, name: true } },
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Checklist created successfully',
        data: checklist,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating checklist:', error);
    return NextResponse.json(
      { error: 'Failed to create checklist' },
      { status: 500 }
    );
  }
}
