import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePrincipalSession } from "@/lib/principal-session";
import {
  parseApplicationFlowState,
  resolveHgiApplicationStage,
} from "@/lib/application-flow-state";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const principalError = ensurePrincipalSession(session);
  if (principalError) {
    return principalError;
  }

  const { id } = await context.params;
  const application = await prisma.application.findFirst({
    where: {
      id,
      principalId: session.user.principalId,
    },
    include: {
      crew: {
        select: {
          id: true,
          fullName: true,
          rank: true,
          nationality: true,
          dateOfBirth: true,
          passportNumber: true,
          passportExpiry: true,
          seamanBookNumber: true,
          seamanBookExpiry: true,
          phone: true,
          email: true,
          documents: {
            where: { isActive: true },
            select: {
              id: true,
              docType: true,
              docNumber: true,
              issueDate: true,
              expiryDate: true,
              remarks: true,
            },
            orderBy: {
              expiryDate: "asc",
            },
            take: 12,
          },
          medicalChecks: {
            select: {
              id: true,
              checkDate: true,
              expiryDate: true,
              clinicName: true,
              doctorName: true,
              result: true,
              remarks: true,
            },
            orderBy: {
              checkDate: "desc",
            },
            take: 3,
          },
          seaServiceHistories: {
            select: {
              id: true,
              vesselName: true,
              companyName: true,
              vesselType: true,
              flag: true,
              grt: true,
              engineOutput: true,
              rank: true,
              signOnDate: true,
              signOffDate: true,
              status: true,
              verificationStatus: true,
              remarks: true,
            },
            orderBy: {
              signOnDate: "desc",
            },
            take: 6,
          },
          prepareJoinings: {
            where: {
              status: {
                in: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY", "DISPATCHED"],
              },
            },
            select: { id: true },
            take: 1,
          },
        },
      },
      principal: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const flow = parseApplicationFlowState(application.attachments);
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "Application",
      entityId: application.id,
      action: {
        in: [
          "APPLICATION_CV_READY",
          "APPLICATION_TRANSITION",
          "OWNER_APPROVED_APPLICATION",
          "OWNER_REJECTED_APPLICATION",
        ],
      },
    },
    select: {
      id: true,
      action: true,
      metadataJson: true,
      createdAt: true,
      actor: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  });

  return NextResponse.json({
    ...application,
    auditLogs,
    hgiStage: resolveHgiApplicationStage({
      status: application.status,
      attachments: application.attachments,
      hasPrepareJoining: application.crew.prepareJoinings.length > 0,
    }),
    cvReadyAt: flow.cvReadyAt,
    cvReadyBy: flow.cvReadyBy,
    hasPrepareJoining: application.crew.prepareJoinings.length > 0,
  });
}
