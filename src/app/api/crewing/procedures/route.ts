import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import proceduresData from '@/lib/data/crewing-procedures.json';

/**
 * GET /api/crewing/procedures
 * Fetch all crewing procedures from the HGQS manual
 * 
 * Query params:
 * - phase?: string - Filter by procedure phase (Pre-Deployment, Deployment, etc)
 * - search?: string - Search procedures by title or code
 * - format?: 'json' | 'db' - Return raw JSON or database format (default: json)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const phase = searchParams.get('phase');
    const search = searchParams.get('search')?.toLowerCase();

    let procedures: unknown[] = proceduresData.procedures;

    // Filter by phase if provided
    if (phase) {
      procedures = procedures.filter((p) => {
        const proc = p as Record<string, unknown>;
        return proc.phase === phase;
      });
    }

    // Filter by search if provided
    if (search) {
      procedures = procedures.filter((p) => {
        const proc = p as Record<string, unknown>;
        return (
          String(proc.title).toLowerCase().includes(search) ||
          String(proc.code).toLowerCase().includes(search) ||
          String(proc.description || '').toLowerCase().includes(search)
        );
      });
    }

    return NextResponse.json({
      success: true,
      count: procedures.length,
      data: procedures,
      note: 'This is the JSON data source. To sync with database, use POST /api/crewing/procedures/sync endpoint',
    });
  } catch (error) {
    console.error('Error fetching procedures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch procedures' },
      { status: 500 }
    );
  }
}
