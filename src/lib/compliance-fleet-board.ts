import { ComplianceStatus, PrepareJoiningStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFleetRiskLevel, summarizeFleetRows } from "@/lib/fleet-metrics";

const ACTIVE_ASSIGNMENT_STATUSES = ["PLANNED", "ASSIGNED", "ACTIVE", "ONBOARD"];
const ACTIVE_PREPARE_JOINING_STATUSES: PrepareJoiningStatus[] = [
  PrepareJoiningStatus.PENDING,
  PrepareJoiningStatus.DOCUMENTS,
  PrepareJoiningStatus.MEDICAL,
  PrepareJoiningStatus.TRAINING,
  PrepareJoiningStatus.TRAVEL,
  PrepareJoiningStatus.READY,
];

export type FleetBoardRow = {
  vesselId: string;
  vesselName: string;
  flag: string;
  vesselType: string;
  principalName: string;
  principalCountry: string;
  activeCrew: number;
  mobilizationQueue: number;
  expiringDocuments: number;
  externalIssues: number;
  openNonconformities: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type FleetBoardData = {
  generatedAt: string;
  totals: {
    activeVessels: number;
    activeCrew: number;
    mobilizationQueue: number;
    highRiskVessels: number;
  };
  vessels: FleetBoardRow[];
};

export async function getFleetComplianceBoard(): Promise<FleetBoardData> {
  const now = new Date();
  const warningDate = new Date(now);
  warningDate.setDate(warningDate.getDate() + 30);

  const vessels = await prisma.vessel.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      principal: {
        select: {
          name: true,
          country: true,
        },
      },
      assignments: {
        where: {
          status: { in: ACTIVE_ASSIGNMENT_STATUSES },
        },
        select: {
          crewId: true,
          status: true,
          crew: {
            select: {
              id: true,
              documents: {
                where: {
                  isActive: true,
                  expiryDate: { gte: now, lte: warningDate },
                },
                select: { id: true },
              },
              externalCompliances: {
                where: {
                  status: {
                    in: [ComplianceStatus.PENDING, ComplianceStatus.EXPIRED, ComplianceStatus.REJECTED],
                  },
                },
                select: { id: true },
              },
              nonconformities: {
                where: {
                  status: { not: "CLOSED" },
                },
                select: { id: true },
              },
            },
          },
        },
      },
      prepareJoinings: {
        where: {
          status: { in: ACTIVE_PREPARE_JOINING_STATUSES },
        },
        select: {
          crewId: true,
          status: true,
          crew: {
            select: {
              id: true,
              documents: {
                where: {
                  isActive: true,
                  expiryDate: { gte: now, lte: warningDate },
                },
                select: { id: true },
              },
              externalCompliances: {
                where: {
                  status: {
                    in: [ComplianceStatus.PENDING, ComplianceStatus.EXPIRED, ComplianceStatus.REJECTED],
                  },
                },
                select: { id: true },
              },
              nonconformities: {
                where: {
                  status: { not: "CLOSED" },
                },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  const rows = vessels.map((vessel) => {
    const trackedCrews = new Map<
      string,
      {
        expiringDocuments: number;
        externalIssues: number;
        openNonconformities: number;
      }
    >();

    for (const assignment of vessel.assignments) {
      trackedCrews.set(assignment.crewId, {
        expiringDocuments: assignment.crew.documents.length,
        externalIssues: assignment.crew.externalCompliances.length,
        openNonconformities: assignment.crew.nonconformities.length,
      });
    }

    for (const prepareJoining of vessel.prepareJoinings) {
      const existing = trackedCrews.get(prepareJoining.crewId);
      const snapshot = {
        expiringDocuments: prepareJoining.crew.documents.length,
        externalIssues: prepareJoining.crew.externalCompliances.length,
        openNonconformities: prepareJoining.crew.nonconformities.length,
      };

      if (!existing) {
        trackedCrews.set(prepareJoining.crewId, snapshot);
        continue;
      }

      trackedCrews.set(prepareJoining.crewId, {
        expiringDocuments: Math.max(existing.expiringDocuments, snapshot.expiringDocuments),
        externalIssues: Math.max(existing.externalIssues, snapshot.externalIssues),
        openNonconformities: Math.max(existing.openNonconformities, snapshot.openNonconformities),
      });
    }

    const crewSnapshots = Array.from(trackedCrews.values());
    const expiringDocuments = crewSnapshots.reduce((sum, item) => sum + item.expiringDocuments, 0);
    const externalIssues = crewSnapshots.reduce((sum, item) => sum + item.externalIssues, 0);
    const openNonconformities = crewSnapshots.reduce((sum, item) => sum + item.openNonconformities, 0);

    const mobilizationQueue = vessel.prepareJoinings.length;
    const activeCrew = vessel.assignments.length;
    const riskLevel = getFleetRiskLevel({
      expiringDocuments,
      externalIssues,
      openNonconformities,
      mobilizationQueue,
    });

    return {
      vesselId: vessel.id,
      vesselName: vessel.name,
      flag: vessel.flag,
      vesselType: vessel.type,
      principalName: vessel.principal?.name ?? "Unassigned principal",
      principalCountry: vessel.principal?.country ?? "-",
      activeCrew,
      mobilizationQueue,
      expiringDocuments,
      externalIssues,
      openNonconformities,
      riskLevel,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totals: summarizeFleetRows(rows),
    vessels: rows,
  };
}
