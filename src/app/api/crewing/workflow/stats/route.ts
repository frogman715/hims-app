import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crewing/workflow/stats', 'GET');
    if (authError) {
      return authError;
    }

    // Get counts for each workflow stage
    const [
      received,
      reviewing,
      interview,
      passed,
      preparing,
      ready
    ] = await Promise.all([
      // Applications received
      prisma.application.count({
        where: { status: 'RECEIVED' }
      }),
      // Applications being reviewed
      prisma.application.count({
        where: { status: 'REVIEWING' }
      }),
      // Applications in interview stage
      prisma.application.count({
        where: { status: 'INTERVIEW' }
      }),
      // Applications passed/offered
      prisma.application.count({
        where: { 
          status: { in: ['PASSED', 'OFFERED', 'ACCEPTED'] }
        }
      }),
      // Crew preparing to join
      prisma.prepareJoining.count({
        where: { 
          status: { in: ['DOCUMENTS', 'MEDICAL', 'TRAINING', 'TRAVEL'] }
        }
      }),
      // Crew ready to join
      prisma.prepareJoining.count({
        where: { status: 'READY' }
      })
    ]);

    return NextResponse.json({
      received,
      reviewing,
      interview,
      passed,
      preparing,
      ready,
      total: received + reviewing + interview + passed + preparing + ready
    });

  } catch (error) {
    return handleApiError(error);
  }
}
