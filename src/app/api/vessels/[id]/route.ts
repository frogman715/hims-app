import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkPermission(session, 'vessels', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const vessel = await prisma.vessel.findUnique({
      where: { id: params.id },
      include: {
        principal: {
          select: {
            id: true,
            name: true,
            country: true,
          }
        }
      }
    });

    if (!vessel) {
      return NextResponse.json({ error: 'Vessel not found' }, { status: 404 });
    }

    return NextResponse.json(vessel);
  } catch (error) {
    console.error('Error fetching vessel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkPermission(session, 'vessels', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      imoNumber,
      flag,
      type,
      dwt,
      gt,
      status,
      principalId
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (imoNumber !== undefined) updateData.imoNumber = imoNumber;
    if (flag !== undefined) updateData.flag = flag;
    if (type !== undefined) updateData.type = type;
    if (dwt !== undefined) updateData.dwt = dwt;
    if (gt !== undefined) updateData.gt = gt;
    if (status !== undefined) updateData.status = status;
    if (principalId !== undefined) updateData.principalId = principalId;

    const vessel = await prisma.vessel.update({
      where: { id: params.id },
      data: updateData,
      include: {
        principal: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(vessel);
  } catch (error) {
    console.error('Error updating vessel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkPermission(session, 'vessels', PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if vessel has any assignments
    const vessel = await prisma.vessel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    if (!vessel) {
      return NextResponse.json({ error: 'Vessel not found' }, { status: 404 });
    }

    if (vessel._count.assignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vessel with existing assignments' },
        { status: 400 }
      );
    }

    await prisma.vessel.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Vessel deleted successfully' });
  } catch (error) {
    console.error('Error deleting vessel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
