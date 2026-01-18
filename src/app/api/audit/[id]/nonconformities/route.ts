import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { handleApiError } from '@/lib/error-handler';
import { randomUUID } from 'crypto';

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

    const nonConformities = await prisma.nonConformity.findMany({
      where: { auditId: id },
      include: {
        audit: true,
        finding: true,
        assignedTo: true,
        verifiedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(nonConformities);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
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

    const nonConformity = await prisma.nonConformity.create({
      data: {
        id: randomUUID(),
        auditId: id,
        description: body.description,
        status: body.status || 'OPEN',
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

    return NextResponse.json(nonConformity, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
