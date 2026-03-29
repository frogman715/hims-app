import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCrewingOverviewSummaryMetrics } from "@/lib/crewing-overview-summary";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

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
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/crewing/overview",
      "GET",
      "Insufficient permissions to view crewing overview"
    );
    if (authError) return authError;

    const now = new Date();
    const [summary, recentActivitiesRaw] = await Promise.all([
      getCrewingOverviewSummaryMetrics(prisma, now),
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

    const complianceRate = summary.totalDocuments === 0 ? null : Math.round((summary.compliantDocuments / summary.totalDocuments) * 100);

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
        activeSeafarers: summary.activeSeafarers,
        principalCount: summary.principalCount,
        vesselCount: summary.vesselCount,
        activeAssignments: summary.activeAssignments,
        plannedAssignments: summary.plannedAssignments,
        pendingApplications: summary.pendingApplications,
        applicationInProgress: summary.applicationInProgress,
        scheduledInterviews: summary.scheduledInterviews,
        prepareJoiningInProgress: summary.prepareJoiningInProgress,
        crewReplacementPending: summary.crewReplacementPending,
        documentsExpiringSoon: summary.documentsExpiringSoon,
        complianceRate,
        documentReceiptsTotal: summary.documentReceiptsTotal,
        trainingInProgress: summary.trainingInProgress,
        signOffThisMonth: summary.signOffThisMonth,
        externalComplianceActive: summary.externalComplianceActive,
      },
      recentActivities,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error loading crewing overview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
