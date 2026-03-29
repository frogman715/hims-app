import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';

/**
 * GET /api/principals/[id]/vessels
 * Fetch all vessels for a specific principal
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      '/api/principals',
      'GET',
      'Insufficient permissions to view principal vessels'
    );
    if (authError) {
      return authError;
    }

    const { id } = await params;

    // Fetch principal with vessels
    const principal = await prisma.principal.findUnique({
      where: { id },
      include: {
        vessels: {
          select: {
            id: true,
            name: true,
            imoNumber: true,
            type: true,
            flag: true,
            status: true,
          },
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!principal) {
      return NextResponse.json(
        { error: 'Principal not found' },
        { status: 404 }
      );
    }

    // Return only vessels
    return NextResponse.json(principal.vessels);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vessels' },
      { status: 500 }
    );
  }
}
