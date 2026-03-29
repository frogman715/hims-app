import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';
import { handleApiError } from '@/lib/error-handler';
import { resolveHgiApplicationStage } from '@/lib/application-flow-state';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crewing/workflow/stats', 'GET');
    if (authError) {
      return authError;
    }

    const [applications, activePrepareJoinings, readyToOnboard, onboarded] = await Promise.all([
      prisma.application.findMany({
        select: {
          id: true,
          crewId: true,
          status: true,
          attachments: true,
        },
      }),
      prisma.prepareJoining.findMany({
        where: {
          status: {
            in: ['PENDING', 'DOCUMENTS', 'MEDICAL', 'TRAINING', 'TRAVEL', 'READY', 'DISPATCHED'],
          },
        },
        select: {
          crewId: true,
          status: true,
        },
      }),
      prisma.prepareJoining.count({
        where: { status: 'READY' }
      }),
      prisma.prepareJoining.count({
        where: { status: 'DISPATCHED' }
      }),
    ]);

    const prepareJoiningCrewIds = new Set(activePrepareJoinings.map((item) => item.crewId));
    const counters = {
      draft: 0,
      documentCheck: 0,
      cvReady: 0,
      submittedToDirector: 0,
      directorApproved: 0,
      sentToOwner: 0,
      ownerApproved: 0,
      ownerRejected: 0,
      preJoining: 0,
    };

    for (const application of applications) {
      const stage = resolveHgiApplicationStage({
        status: application.status,
        attachments: application.attachments,
        hasPrepareJoining: prepareJoiningCrewIds.has(application.crewId),
      });

      switch (stage) {
        case 'DRAFT':
          counters.draft += 1;
          break;
        case 'DOCUMENT_CHECK':
          counters.documentCheck += 1;
          break;
        case 'CV_READY':
          counters.cvReady += 1;
          break;
        case 'SUBMITTED_TO_DIRECTOR':
          counters.submittedToDirector += 1;
          break;
        case 'DIRECTOR_APPROVED':
          counters.directorApproved += 1;
          break;
        case 'SENT_TO_OWNER':
          counters.sentToOwner += 1;
          break;
        case 'OWNER_APPROVED':
          counters.ownerApproved += 1;
          break;
        case 'OWNER_REJECTED':
          counters.ownerRejected += 1;
          break;
      }
    }

    counters.preJoining = activePrepareJoinings.filter((item) =>
      ['PENDING', 'DOCUMENTS', 'MEDICAL', 'TRAINING', 'TRAVEL'].includes(item.status)
    ).length;

    return NextResponse.json({
      ...counters,
      readyToOnboard,
      onboarded,
      total:
        counters.draft +
        counters.documentCheck +
        counters.cvReady +
        counters.submittedToDirector +
        counters.directorApproved +
        counters.sentToOwner +
        counters.ownerApproved +
        counters.ownerRejected +
        counters.preJoining +
        readyToOnboard +
        onboarded
    });

  } catch (error) {
    return handleApiError(error);
  }
}
