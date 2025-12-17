import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type UpdateVesselPayload = {
  name?: string;
  imoNumber?: string | null;
  flag?: string | null;
  type?: string | null;
  dwt?: number | string | null;
  gt?: number | string | null;
  status?: string | null;
  principalId?: string | null;
};

const allowedVesselStatuses = new Set(['ACTIVE', 'INACTIVE', 'UNDER_REPAIR']);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkPermission(session, 'vessels', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const vessel = await prisma.vessel.findUnique({
      where: { id },
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkPermission(session, 'vessels', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = (await req.json()) as UpdateVesselPayload;
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

    const updateData: Prisma.VesselUpdateInput = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Invalid vessel name' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (imoNumber !== undefined) {
      if (imoNumber === null) {
        updateData.imoNumber = null;
      } else if (typeof imoNumber === 'string') {
        updateData.imoNumber = imoNumber.trim();
      } else {
        return NextResponse.json({ error: 'Invalid IMO number' }, { status: 400 });
      }
    }

    if (flag !== undefined) {
      if (typeof flag === 'string' && flag.trim()) {
        updateData.flag = flag.trim();
      } else {
        return NextResponse.json({ error: 'Invalid flag value' }, { status: 400 });
      }
    }

    if (type !== undefined) {
      if (typeof type === 'string' && type.trim()) {
        updateData.type = type.trim();
      } else {
        return NextResponse.json({ error: 'Invalid vessel type' }, { status: 400 });
      }
    }

    if (dwt !== undefined) {
      if (dwt === null) {
        updateData.dwt = null;
      } else if (typeof dwt === 'number' && Number.isFinite(dwt)) {
        updateData.dwt = dwt;
      } else if (typeof dwt === 'string' && dwt.trim() !== '') {
        const parsedDwt = Number.parseFloat(dwt);
        if (Number.isNaN(parsedDwt)) {
          return NextResponse.json({ error: 'Invalid DWT value' }, { status: 400 });
        }
        updateData.dwt = parsedDwt;
      } else {
        return NextResponse.json({ error: 'Invalid DWT value' }, { status: 400 });
      }
    }

    if (gt !== undefined) {
      if (gt === null) {
        updateData.gt = null;
      } else if (typeof gt === 'number' && Number.isFinite(gt)) {
        updateData.gt = gt;
      } else if (typeof gt === 'string' && gt.trim() !== '') {
        const parsedGt = Number.parseFloat(gt);
        if (Number.isNaN(parsedGt)) {
          return NextResponse.json({ error: 'Invalid GT value' }, { status: 400 });
        }
        updateData.gt = parsedGt;
      } else {
        return NextResponse.json({ error: 'Invalid GT value' }, { status: 400 });
      }
    }

    if (status !== undefined) {
      if (status === null) {
        return NextResponse.json({ error: 'Status cannot be null' }, { status: 400 });
      }
      if (typeof status !== 'string') {
        return NextResponse.json({ error: 'Invalid vessel status' }, { status: 400 });
      }
      const normalizedStatus = status.trim().toUpperCase();
      if (!allowedVesselStatuses.has(normalizedStatus)) {
        return NextResponse.json({ error: 'Invalid vessel status' }, { status: 400 });
      }
      updateData.status = normalizedStatus;
    }

    if (principalId !== undefined) {
      if (principalId === null) {
        updateData.principal = { disconnect: true };
      } else if (typeof principalId === 'string' && principalId.trim()) {
        updateData.principal = { connect: { id: principalId.trim() } };
      } else {
        return NextResponse.json({ error: 'Invalid principal ID' }, { status: 400 });
      }
    }

    const vessel = await prisma.vessel.update({
      where: { id },
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkPermission(session, 'vessels', PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if vessel has any assignments
    const vessel = await prisma.vessel.findUnique({
      where: { id },
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
      where: { id },
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
