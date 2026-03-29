import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePrincipalSession } from "@/lib/principal-session";
import { ApplicationStatus, Prisma } from "@prisma/client";
import {
  parseApplicationFlowState,
  resolveHgiApplicationStage,
} from "@/lib/application-flow-state";

const OWNER_VISIBLE_STATUSES = ["OFFERED", "ACCEPTED", "REJECTED"] as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const principalError = ensurePrincipalSession(session);
  if (principalError) {
    return principalError;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Prisma.ApplicationWhereInput = {
    principalId: session.user.principalId,
    ...(status && status !== "ALL"
      ? { status: status as ApplicationStatus }
      : {
          status: {
            in: [...OWNER_VISIBLE_STATUSES],
          },
        }),
  };

  const applications = await prisma.application.findMany({
    where,
    include: {
      crew: {
        select: {
          id: true,
          fullName: true,
          rank: true,
          nationality: true,
          passportExpiry: true,
          seamanBookExpiry: true,
          documents: {
            where: { isActive: true },
            select: {
              id: true,
              docType: true,
              expiryDate: true,
            },
            orderBy: {
              expiryDate: "asc",
            },
            take: 8,
          },
          medicalChecks: {
            select: {
              id: true,
              expiryDate: true,
              result: true,
            },
            orderBy: {
              checkDate: "desc",
            },
            take: 1,
          },
          seaServiceHistories: {
            select: {
              id: true,
              vesselName: true,
              companyName: true,
              vesselType: true,
              rank: true,
              signOnDate: true,
              signOffDate: true,
              verificationStatus: true,
            },
            orderBy: {
              signOnDate: "desc",
            },
            take: 3,
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
    orderBy: {
      applicationDate: "desc",
    },
  });

  return NextResponse.json({
    data: applications.map((application) => {
      const flow = parseApplicationFlowState(application.attachments);
      return {
        ...application,
        hgiStage: resolveHgiApplicationStage({
          status: application.status,
          attachments: application.attachments,
          hasPrepareJoining: application.crew.prepareJoinings.length > 0,
        }),
        cvReadyAt: flow.cvReadyAt,
        cvReadyBy: flow.cvReadyBy,
        hasPrepareJoining: application.crew.prepareJoinings.length > 0,
      };
    }),
    total: applications.length,
    principal: {
      id: session.user.principalId,
      name: session.user.principalName ?? null,
    },
  });
}
