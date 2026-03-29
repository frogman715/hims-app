import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkPermission(session, 'quality', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nonConformities = await prisma.nonConformity.findMany({
      include: {
        audit: {
          select: {
            id: true,
            auditNumber: true,
          },
        },
        finding: {
          select: {
            id: true,
            findingCode: true,
            description: true,
            severity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      nonConformities.map((item) => ({
        id: item.id,
        auditId: item.auditId,
        findingId: item.findingId,
        description: item.description,
        status: item.status,
        severity: item.finding?.severity ?? 'MINOR',
        dueDate: item.targetDate?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error listing non-conformities:', error);
    return NextResponse.json(
      { error: 'Failed to list non-conformities' },
      { status: 500 }
    );
  }
}
