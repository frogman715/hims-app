import { ComplianceStatus, PrepareJoiningStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

function getRiskLevel(input: {
  expiringDocuments: number;
  externalIssues: number;
  openNonconformities: number;
  mobilizationQueue: number;
}) {
  const score =
    input.expiringDocuments * 2 +
    input.externalIssues * 2 +
    input.openNonconformities * 3 +
    (input.mobilizationQueue > 3 ? 1 : 0);

  if (score >= 8) return "CRITICAL" as const;
  if (score >= 5) return "HIGH" as const;
  if (score >= 2) return "MEDIUM" as const;
  return "LOW" as const;
}

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
    const riskLevel = getRiskLevel({
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
    totals: {
      activeVessels: rows.length,
      activeCrew: rows.reduce((sum, row) => sum + row.activeCrew, 0),
      mobilizationQueue: rows.reduce((sum, row) => sum + row.mobilizationQueue, 0),
      highRiskVessels: rows.filter((row) => row.riskLevel === "HIGH" || row.riskLevel === "CRITICAL").length,
    },
    vessels: rows,
  };
}
