import { ComplianceStatus, PrepareJoiningStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getPrepareJoiningComplianceSnapshot,
  type PrepareJoiningComplianceSnapshot,
} from "@/lib/prepare-joining-enforcement";

const ACTIVE_ASSIGNMENT_STATUSES = ["PLANNED", "ASSIGNED", "ACTIVE", "ONBOARD"];
const ACTIVE_PREPARE_JOINING_STATUSES: PrepareJoiningStatus[] = [
  PrepareJoiningStatus.PENDING,
  PrepareJoiningStatus.DOCUMENTS,
  PrepareJoiningStatus.MEDICAL,
  PrepareJoiningStatus.TRAINING,
  PrepareJoiningStatus.TRAVEL,
  PrepareJoiningStatus.READY,
];

type VesselComplianceRecord = {
  id: string;
  name: string;
  imoNumber: string | null;
  flag: string;
  type: string;
  principal: {
    id: string;
    name: string;
    country: string;
    email: string | null;
  } | null;
  assignments: Array<{
    id: string;
    status: string;
    rank: string;
    crew: {
      id: string;
      fullName: string;
      rank: string;
      crewCode: string | null;
      documents: Array<{
        id: string;
        docType: string;
        expiryDate: Date | null;
      }>;
      externalCompliances: Array<{
        id: string;
        systemType: string;
        status: ComplianceStatus;
      }>;
      nonconformities: Array<{
        id: string;
        description: string;
        status: string;
      }>;
    };
  }>;
  prepareJoinings: Array<{
    id: string;
    status: PrepareJoiningStatus;
    crewId: string;
    remarks: string | null;
    crew: {
      id: string;
      fullName: string;
      rank: string;
      crewCode: string | null;
      documents: Array<{
        id: string;
        docType: string;
        expiryDate: Date | null;
      }>;
      externalCompliances: Array<{
        id: string;
        systemType: string;
        status: ComplianceStatus;
      }>;
      nonconformities: Array<{
        id: string;
        description: string;
        status: string;
      }>;
    };
  }>;
  restHourRegisters: Array<{
    crewId: string;
    logDate: Date;
    isCompliant: boolean;
    restHours: number;
    minimumRestHours: number;
  }>;
};

export async function getVesselComplianceDetail(vesselId: string) {
  const now = new Date();
  const warningDate = new Date(now);
  warningDate.setDate(warningDate.getDate() + 30);

  const vessel = await prisma.vessel.findUnique({
    where: { id: vesselId },
    include: {
      principal: {
        select: {
          id: true,
          name: true,
          country: true,
          email: true,
        },
      },
      assignments: {
        where: { status: { in: ACTIVE_ASSIGNMENT_STATUSES } },
        orderBy: [{ startDate: "desc" }],
        select: {
          id: true,
          status: true,
          rank: true,
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
              crewCode: true,
              documents: {
                where: {
                  isActive: true,
                  expiryDate: { lte: warningDate },
                },
                orderBy: { expiryDate: "asc" },
                select: {
                  id: true,
                  docType: true,
                  expiryDate: true,
                },
              },
              externalCompliances: {
                where: {
                  status: {
                    in: [ComplianceStatus.PENDING, ComplianceStatus.EXPIRED, ComplianceStatus.REJECTED],
                  },
                },
                orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
                select: {
                  id: true,
                  systemType: true,
                  status: true,
                },
              },
              nonconformities: {
                where: { status: { not: "CLOSED" } },
                select: {
                  id: true,
                  description: true,
                  status: true,
                },
              },
            },
          },
        },
      },
      prepareJoinings: {
        where: { status: { in: ACTIVE_PREPARE_JOINING_STATUSES } },
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          status: true,
          crewId: true,
          remarks: true,
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
              crewCode: true,
              documents: {
                where: {
                  isActive: true,
                  expiryDate: { lte: warningDate },
                },
                orderBy: { expiryDate: "asc" },
                select: {
                  id: true,
                  docType: true,
                  expiryDate: true,
                },
              },
              externalCompliances: {
                where: {
                  status: {
                    in: [ComplianceStatus.PENDING, ComplianceStatus.EXPIRED, ComplianceStatus.REJECTED],
                  },
                },
                orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
                select: {
                  id: true,
                  systemType: true,
                  status: true,
                },
              },
              nonconformities: {
                where: { status: { not: "CLOSED" } },
                select: {
                  id: true,
                  description: true,
                  status: true,
                },
              },
            },
          },
        },
      },
      restHourRegisters: {
        where: { logDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: [{ logDate: "desc" }],
        select: {
          crewId: true,
          logDate: true,
          isCompliant: true,
          restHours: true,
          minimumRestHours: true,
        },
      },
    },
  }) as VesselComplianceRecord | null;

  if (!vessel) {
    return null;
  }

  const prepareJoiningCompliance = await Promise.all(
    vessel.prepareJoinings.map(async (prepareJoining) => ({
      prepareJoiningId: prepareJoining.id,
      crewId: prepareJoining.crewId,
      snapshot: await getPrepareJoiningComplianceSnapshot(prepareJoining.id),
    }))
  );

  const complianceByCrewId = new Map<string, PrepareJoiningComplianceSnapshot | null>(
    prepareJoiningCompliance.map((item) => [item.crewId, item.snapshot])
  );
  const restHoursByCrewId = new Map<string, typeof vessel.restHourRegisters>();
  for (const register of vessel.restHourRegisters) {
    const existing = restHoursByCrewId.get(register.crewId) ?? [];
    existing.push(register);
    restHoursByCrewId.set(register.crewId, existing);
  }

  const onboardCrew = vessel.assignments.map((assignment) => {
    const recentRestHours = restHoursByCrewId.get(assignment.crew.id) ?? [];
    const blockers = [
      ...assignment.crew.documents.map((document) => {
        const expiry = document.expiryDate ? document.expiryDate.toISOString().slice(0, 10) : "unknown";
        return `${document.docType} expiring ${expiry}`;
      }),
      ...assignment.crew.externalCompliances.map((item) => `${item.systemType} ${item.status.toLowerCase()}`),
      ...assignment.crew.nonconformities.map((item) => `NC ${item.status.toLowerCase()}: ${item.description}`),
      ...(recentRestHours.some((entry) => !entry.isCompliant)
        ? ["Recent rest-hour entry below minimum MLC threshold"]
        : recentRestHours.length === 0
          ? ["No rest-hour register in the last 7 days"]
          : []),
    ];

    return {
      crewId: assignment.crew.id,
      crewCode: assignment.crew.crewCode,
      fullName: assignment.crew.fullName,
      rank: assignment.crew.rank,
      assignmentStatus: assignment.status,
      blockers,
      restHourStatus:
        recentRestHours.length === 0
          ? "NO_RECORD"
          : recentRestHours.some((entry) => !entry.isCompliant)
            ? "NON_COMPLIANT"
            : "COMPLIANT",
    };
  });

  const mobilizationCrew = vessel.prepareJoinings.map((prepareJoining) => {
    const compliance = complianceByCrewId.get(prepareJoining.crewId);
    const blockers = [
      ...prepareJoining.crew.documents.map((document) => {
        const expiry = document.expiryDate ? document.expiryDate.toISOString().slice(0, 10) : "unknown";
        return `${document.docType} expiring ${expiry}`;
      }),
      ...prepareJoining.crew.externalCompliances.map((item) => `${item.systemType} ${item.status.toLowerCase()}`),
      ...prepareJoining.crew.nonconformities.map((item) => `NC ${item.status.toLowerCase()}: ${item.description}`),
      ...(compliance?.blockers ?? []),
    ];

    return {
      prepareJoiningId: prepareJoining.id,
      crewId: prepareJoining.crew.id,
      crewCode: prepareJoining.crew.crewCode,
      fullName: prepareJoining.crew.fullName,
      rank: prepareJoining.crew.rank,
      status: prepareJoining.status,
      blockers,
      approvedRequiredForms: compliance?.approvedRequiredCount ?? 0,
      requiredForms: compliance?.requiredTemplateCount ?? 0,
    };
  });

  return {
    vessel: {
      id: vessel.id,
      name: vessel.name,
      imoNumber: vessel.imoNumber,
      flag: vessel.flag,
      type: vessel.type,
      principalName: vessel.principal?.name ?? "Unassigned principal",
      principalCountry: vessel.principal?.country ?? "-",
      principalEmail: vessel.principal?.email ?? null,
    },
    summary: {
      onboardCrew: onboardCrew.length,
      mobilizationCrew: mobilizationCrew.length,
      crewWithBlockers:
        onboardCrew.filter((member) => member.blockers.length > 0).length +
        mobilizationCrew.filter((member) => member.blockers.length > 0).length,
      missingRestHourRegisters: onboardCrew.filter((member) => member.restHourStatus === "NO_RECORD").length,
    },
    onboardCrew,
    mobilizationCrew,
  };
}
