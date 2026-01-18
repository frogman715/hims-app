import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !checkPermission(session, 'quality', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nonConformity = await prisma.nonConformity.findUnique({
      where: { id },
      include: {
        audit: true,
        finding: true,
        assignedTo: true,
        verifiedBy: true,
      },
    });

    if (!nonConformity) {
      return NextResponse.json({ error: 'Non-conformity not found' }, { status: 404 });
    }

    return NextResponse.json(nonConformity);
  } catch (error) {
    return handleApiError(error);
  }
}

/*
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const nc = await auditService.getNonConformityWithActions(id);
    if (!nc) {
      return NextResponse.json(
        { error: 'Non-conformity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(nc);
  } catch (error) {
    console.error('Error fetching non-conformity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch non-conformity' },
      { status: 500 }
    );
  }
}
*/

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !checkPermission(session, 'quality', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    const nonConformity = await prisma.nonConformity.update({
      where: { id },
      data: {
        description: body.description,
        status: body.status,
        rootCause: body.rootCause,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
      },
      include: {
        audit: true,
        finding: true,
        assignedTo: true,
        verifiedBy: true,
      },
    });

    return NextResponse.json(nonConformity);
  } catch (error) {
    return handleApiError(error);
  }
}

/*
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { id } = await params;
    const { status } = data;

    const nc = await auditService.updateNonConformityStatus(
      id,
      status
    );

    return NextResponse.json(nc);
  } catch (error) {
    console.error('Error updating non-conformity:', error);
    return NextResponse.json(
      { error: 'Failed to update non-conformity' },
      { status: 500 }
    );
  }
}
*/
