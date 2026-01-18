import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { handleApiError } from '@/lib/error-handler';

// NOTE: CorrectiveAction model doesn't have nonconformity relationship
// This endpoint returns CAPA records instead

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !checkPermission(session, 'quality', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return all CAPA actions (not tied to specific nonconformity)
    const capaActions = await prisma.correctiveAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(capaActions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !checkPermission(session, 'quality', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // CorrectiveAction model doesn't support this structure
    return NextResponse.json(
      { error: 'CorrectiveAction creation not supported via this endpoint' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
