import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { prisma } from "@/lib/prisma";

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  REVIEWING: "Under Review",
  INTERVIEW: "Interview",
  PASSED: "Passed",
  OFFERED: "Offered",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const APPLICATION_STATUS_ORDER = [
  "RECEIVED",
  "REVIEWING",
  "INTERVIEW",
  "PASSED",
  "OFFERED",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
];

const PREPARE_JOINING_LABELS: Record<string, string> = {
  PENDING: "Pending",
  DOCUMENTS: "Documents",
  MEDICAL: "Medical",
  TRAINING: "Training",
  TRAVEL: "Travel",
  READY: "Ready",
  DISPATCHED: "Dispatched",
  CANCELLED: "Cancelled",
};

const PREPARE_JOINING_ORDER = [
  "PENDING",
  "DOCUMENTS",
  "MEDICAL",
  "TRAINING",
  "TRAVEL",
  "READY",
  "DISPATCHED",
  "CANCELLED",
];

const ACTIVE_ASSIGNMENT_STATUSES = ["ONBOARD", "ASSIGNED", "PLANNED", "ACTIVE"] as const;

export const GET = withPermission("crewing", PermissionLevel.VIEW_ACCESS, async () => {
  try {
    const now = new Date();
    const fourteenMonthsFromNow = new Date(now.getTime());
    fourteenMonthsFromNow.setMonth(fourteenMonthsFromNow.getMonth() + 14);

    const [
      totalApplications,
      interviewsScheduled,
      crewReady,
      activeAssignments,
      applicationFunnelRaw,
      prepareJoiningRaw,
      upcomingAssignmentsRaw,
      principalAssignmentsRaw,
      expiringDocumentsCount,
      expiredDocumentsCount,
      totalDocuments,
      recentActivitiesRaw,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.interview.count({
        where: {
          status: "SCHEDULED",
          scheduledDate: {
            gte: now,
          },
        },
      }),
      prisma.prepareJoining.count({
        where: {
          status: "READY",
        },
      }),
      prisma.assignment.count({
        where: {
          status: {
            in: ACTIVE_ASSIGNMENT_STATUSES,
          },
        },
      }),
      prisma.application.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
      prisma.prepareJoining.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
      prisma.assignment.findMany({
        where: {
          startDate: {
            gte: now,
          },
          status: {
            in: ["PLANNED", "ASSIGNED"],
          },
        },
        include: {
          crew: {
            select: {
              fullName: true,
              rank: true,
            },
          },
          vessel: {
            select: {
              name: true,
              type: true,
            },
          },
          principal: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        take: 6,
      }),
      prisma.assignment.findMany({
        where: {
          status: {
            in: ACTIVE_ASSIGNMENT_STATUSES,
          },
        },
        select: {
          principal: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.crewDocument.count({
        where: {
          expiryDate: {
            gte: now,
            lte: fourteenMonthsFromNow,
          },
        },
      }),
      prisma.crewDocument.count({
        where: {
          expiryDate: {
            lt: now,
          },
        },
      }),
      prisma.crewDocument.count(),
      prisma.activityLog.findMany({
        take: 6,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const totalApplicationCount = applicationFunnelRaw.reduce((acc, row) => acc + row._count.status, 0);
    const applicationFunnel = APPLICATION_STATUS_ORDER.map((status) => {
      const row = applicationFunnelRaw.find((item) => item.status === status);
      const count = row?._count.status ?? 0;
      const percentage = totalApplicationCount === 0 ? 0 : Math.round((count / totalApplicationCount) * 100);

      return {
        status,
        label: APPLICATION_STATUS_LABELS[status] ?? status,
        count,
        percentage,
      };
    });

    const prepareJoiningBreakdown = PREPARE_JOINING_ORDER.map((status) => {
      const row = prepareJoiningRaw.find((item) => item.status === status);
      return {
        status,
        label: PREPARE_JOINING_LABELS[status] ?? status,
        count: row?._count.status ?? 0,
      };
    });

    const principalDistributionMap = new Map<string, { name: string; count: number }>();
    principalAssignmentsRaw.forEach((assignment) => {
      const key = assignment.principal?.id ?? "unassigned";
      const name = assignment.principal?.name ?? "Unassigned";
      const current = principalDistributionMap.get(key) ?? { name, count: 0 };
      current.count += 1;
      principalDistributionMap.set(key, current);
    });

    const principalDistribution = Array.from(principalDistributionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item) => ({
        principalName: item.name,
        activeCrew: item.count,
      }));

    const compliantDocuments = Math.max(totalDocuments - expiredDocumentsCount, 0);
    const complianceRate = totalDocuments === 0 ? null : Math.round((compliantDocuments / totalDocuments) * 100);

    const upcomingAssignments = upcomingAssignmentsRaw.map((assignment) => ({
      id: assignment.id,
      crewName: assignment.crew?.fullName ?? "Unknown Crew",
      rank: assignment.crew?.rank ?? "",
      vesselName: assignment.vessel?.name ?? "Unknown Vessel",
      vesselType: assignment.vessel?.type ?? "",
      principalName: assignment.principal?.name ?? "Unassigned",
      startDate: assignment.startDate.toISOString(),
      status: assignment.status,
    }));

    const recentActivities = recentActivitiesRaw.map((activity) => ({
      id: activity.id,
      userName: activity.user?.name ?? "System",
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      createdAt: activity.createdAt.toISOString(),
    }));

    return NextResponse.json({
      stats: {
        totalApplications,
        interviewsScheduled,
        crewReady,
        documentsExpiringSoon: expiringDocumentsCount,
        activeAssignments,
      },
      applicationFunnel,
      prepareJoining: prepareJoiningBreakdown,
      documentCompliance: {
        total: totalDocuments,
        compliant: compliantDocuments,
        expiringSoon: expiringDocumentsCount,
        expired: expiredDocumentsCount,
        complianceRate,
      },
      principalDistribution,
      upcomingAssignments,
      recentActivities,
    });
  } catch (error) {
    console.error("Error generating crewing reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
