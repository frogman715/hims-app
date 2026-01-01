import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import proceduresData from '@/lib/data/crewing-procedures.json';

/**
 * GET /api/crewing/procedures/[id]
 * Fetch a specific procedure by ID
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
    const procedure = proceduresData.procedures.find(p => p.id === id);

    if (!procedure) {
      return NextResponse.json(
        { error: 'Procedure not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: procedure,
    });
  } catch (error) {
    console.error('Error fetching procedure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch procedure' },
      { status: 500 }
    );
  }
}
