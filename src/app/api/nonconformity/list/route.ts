import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement non-conformity listing from database
    // For now, return empty array as placeholder
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error listing non-conformities:', error);
    return NextResponse.json(
      { error: 'Failed to list non-conformities' },
      { status: 500 }
    );
  }
}
