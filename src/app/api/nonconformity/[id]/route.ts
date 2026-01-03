import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as auditService from '@/lib/audit/service';

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
      status,
      session.user.id
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
