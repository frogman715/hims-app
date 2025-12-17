import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { prisma } from "@/lib/prisma";

interface CrewingOverviewResponse {
  stats: {
    activeSeafarers: number;
    principalCount: number;
    vesselCount: number;
    activeAssignments: number;
    plannedAssignments: number;
    pendingApplications: number;
    applicationInProgress: number;
    scheduledInterviews: number;
    prepareJoiningInProgress: number;
    crewReplacementPending: number;
    documentsExpiringSoon: number;
    complianceRate: number | null;
    documentReceiptsTotal: number;
    trainingInProgress: number;
    signOffThisMonth: number;
    externalComplianceActive: number;
  };
  recentActivities: Array<{
    id: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "crewing", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const now = new Date();
    const fourteenMonthsFromNow = new Date(now.getTime());
    fourteenMonthsFromNow.setMonth(fourteenMonthsFromNow.getMonth() + 14);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const activeAssignmentStatuses = ["ONBOARD", "ASSIGNED", "ACTIVE"];
    const plannedAssignmentStatuses = ["PLANNED", "ASSIGNED"];
    const [activeSeafarers, principalCount, vesselCount, activeAssignments, plannedAssignments, pendingApplications, applicationInProgress, scheduledInterviews, prepareJoiningInProgress, crewReplacementPending, documentsExpiringSoon, compliantDocuments, totalDocuments, documentReceiptsTotal, trainingInProgress, signOffThisMonth, externalComplianceActive, recentActivitiesRaw] = await Promise.all([
      prisma.crew.count({
        where: {
          status: "ONBOARD",
        },
      }),
      prisma.principal.count(),
      prisma.vessel.count(),
      prisma.assignment.count({
        where: {
          status: {
            in: activeAssignmentStatuses,
          },
        },
      }),
      prisma.assignment.count({
        where: {
          status: {
            in: plannedAssignmentStatuses,
          },
        },
      }),
      prisma.application.count({
        where: {
          status: {
            in: ["RECEIVED", "REVIEWING"],
          },
        },
      }),
      prisma.application.count({
        where: {
          status: {
            in: ["INTERVIEW", "PASSED", "OFFERED", "ACCEPTED"],
          },
        },
      }),
      prisma.interview.count({
        where: {
          status: "SCHEDULED",
        },
      }),
      prisma.prepareJoining.count({
        where: {
          status: {
            in: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY"],
          },
        },
      }),
      prisma.crewReplacement.count({
        where: {
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      }),
      prisma.crewDocument.count({
        where: {
          expiryDate: {
            lte: fourteenMonthsFromNow,
            gte: now,
          },
          isActive: true,
        },
      }),
      prisma.crewDocument.count({
        where: {
          OR: [
            { expiryDate: null },
            {
              expiryDate: {
                gt: now,
              },
            },
          ],
        },
      }),
      prisma.crewDocument.count(),
      prisma.documentReceipt.count(),
      prisma.orientation.count({
        where: {
          status: {
            not: "COMPLETED",
          },
        },
      }),
      prisma.crewSignOff.count({
        where: {
          signOffDate: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      }),
      prisma.externalCompliance.count({
        where: {
          status: {
            in: ["PENDING", "VERIFIED"],
          },
        },
      }),
      prisma.activityLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const complianceRate = totalDocuments === 0 ? null : Math.round((compliantDocuments / totalDocuments) * 100);

    const recentActivities = recentActivitiesRaw.map((activity) => ({
      id: activity.id,
      userName: activity.user?.name ?? "System",
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      createdAt: activity.createdAt.toISOString(),
    }));

    const payload: CrewingOverviewResponse = {
      stats: {
        activeSeafarers,
        principalCount,
        vesselCount,
        activeAssignments,
        plannedAssignments,
        pendingApplications,
        applicationInProgress,
        scheduledInterviews,
        prepareJoiningInProgress,
        crewReplacementPending,
        documentsExpiringSoon,
        complianceRate,
        documentReceiptsTotal,
        trainingInProgress,
        signOffThisMonth,
        externalComplianceActive,
      },
      recentActivities,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error loading crewing overview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
