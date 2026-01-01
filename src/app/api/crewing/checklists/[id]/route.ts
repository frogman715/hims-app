import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/crewing/checklists/[id]
 * Fetch a specific checklist
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const checklist = await prisma.crewingChecklist.findUnique({
      where: { id },
      include: {
        application: { select: { id: true, position: true } },
        crew: { select: { id: true, fullName: true } },
        submittedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      }
    });

    if (!checklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: checklist,
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crewing/checklists/[id]
 * Update checklist status and items
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, itemsJson, remarks, completionPercent } = body;

    const checklist = await prisma.crewingChecklist.update({
      where: { id },
      data: {
        status: status || undefined,
        itemsJson: itemsJson || undefined,
        completionPercent: completionPercent || undefined,
        remarks: remarks || undefined,
      },
      include: {
        application: { select: { id: true, position: true } },
        crew: { select: { id: true, fullName: true } },
        submittedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Checklist updated successfully',
      data: checklist,
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crewing/checklists/[id]/approve
 * Approve a checklist
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, remarks } = body;

    if (action === 'approve') {
      const checklist = await prisma.crewingChecklist.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: session.user.id || null,
          remarks: remarks || undefined,
        },
        include: {
          application: { select: { id: true, position: true } },
          crew: { select: { id: true, fullName: true } },
          approvedBy: { select: { id: true, name: true } },
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Checklist approved successfully',
        data: checklist,
      });
    } else if (action === 'reject') {
      const checklist = await prisma.crewingChecklist.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedById: session.user.id || null,
          remarks: remarks || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Checklist rejected',
        data: checklist,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing checklist action:', error);
    return NextResponse.json(
      { error: 'Failed to process checklist action' },
      { status: 500 }
    );
  }
}
