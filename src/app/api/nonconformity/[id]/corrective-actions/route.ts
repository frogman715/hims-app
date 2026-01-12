import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
// import * as auditService from '@/lib/audit/service'; // Disabled - schema mismatch

// TODO: FIXME - This route is disabled because createCorrectiveAction doesn't match schema
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'createCorrectiveAction disabled due to schema mismatch - needs refactoring' },
    { status: 501 }
  );
}
