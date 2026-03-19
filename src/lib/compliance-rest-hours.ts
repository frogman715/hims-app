import { PrepareJoiningStatus } from "@prisma/client";
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

export type RestHourFormOption = {
  crewId: string;
  crewName: string;
  rank: string;
  vesselId: string;
  vesselName: string;
};

export type RestHourEntry = {
  id: string;
  crewId: string;
  crewName: string;
  rank: string;
  vesselId: string;
  vesselName: string;
  logDate: string;
  workHours: number;
  restHours: number;
  minimumRestHours: number;
  isCompliant: boolean;
  remarks: string | null;
  recordedByName: string | null;
};

export type RestHourRegisterData = {
  generatedAt: string;
  summary: {
    entriesLast7Days: number;
    nonCompliantEntries: number;
    activeVesselsTracked: number;
    coverageGapCrews: number;
  };
  options: RestHourFormOption[];
  recentEntries: RestHourEntry[];
  coverageGaps: Array<{
    vesselId: string;
    vesselName: string;
    crewId: string;
    crewName: string;
    rank: string;
    reason: string;
  }>;
};

type VesselRoster = {
  id: string;
  name: string;
  assignments: Array<{
    crew: {
      id: string;
      fullName: string;
      rank: string;
    };
  }>;
  prepareJoinings: Array<{
    crew: {
      id: string;
      fullName: string;
      rank: string;
    };
  }>;
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function getRestHourRegisterData(filters?: {
  vesselId?: string | null;
  crewId?: string | null;
}) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const where = {
    ...(filters?.vesselId ? { vesselId: filters.vesselId } : {}),
    ...(filters?.crewId ? { crewId: filters.crewId } : {}),
  };

  const [entries, vessels] = await Promise.all([
    prisma.restHourRegister.findMany({
      where,
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
      take: 40,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.vessel.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        assignments: {
          where: { status: { in: ACTIVE_ASSIGNMENT_STATUSES } },
          select: {
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
              },
            },
          },
        },
        prepareJoinings: {
          where: { status: { in: ACTIVE_PREPARE_JOINING_STATUSES } },
          select: {
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
              },
            },
          },
        },
      },
    }) as Promise<VesselRoster[]>,
  ]);

  const optionsMap = new Map<string, RestHourFormOption>();
  for (const vessel of vessels) {
    for (const assignment of vessel.assignments) {
      optionsMap.set(`${vessel.id}:${assignment.crew.id}`, {
        crewId: assignment.crew.id,
        crewName: assignment.crew.fullName,
        rank: assignment.crew.rank,
        vesselId: vessel.id,
        vesselName: vessel.name,
      });
    }

    for (const prepareJoining of vessel.prepareJoinings) {
      optionsMap.set(`${vessel.id}:${prepareJoining.crew.id}`, {
        crewId: prepareJoining.crew.id,
        crewName: prepareJoining.crew.fullName,
        rank: prepareJoining.crew.rank,
        vesselId: vessel.id,
        vesselName: vessel.name,
      });
    }
  }

  const recentCoverageMap = new Set(
    entries
      .filter((entry) => entry.logDate >= sevenDaysAgo)
      .map((entry) => `${entry.vesselId}:${entry.crewId}:${toIsoDate(entry.logDate)}`)
  );

  const coverageGaps = Array.from(optionsMap.values()).filter((option) => {
    for (let offset = 0; offset < 7; offset += 1) {
      const logDate = new Date(now);
      logDate.setDate(logDate.getDate() - offset);
      if (recentCoverageMap.has(`${option.vesselId}:${option.crewId}:${toIsoDate(logDate)}`)) {
        return false;
      }
    }
    return true;
  }).map((option) => ({
    vesselId: option.vesselId,
    vesselName: option.vesselName,
    crewId: option.crewId,
    crewName: option.crewName,
    rank: option.rank,
    reason: "No digital rest-hour entry recorded in the last 7 days.",
  }));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      entriesLast7Days: entries.filter((entry) => entry.logDate >= sevenDaysAgo).length,
      nonCompliantEntries: entries.filter((entry) => !entry.isCompliant).length,
      activeVesselsTracked: vessels.length,
      coverageGapCrews: coverageGaps.length,
    },
    options: Array.from(optionsMap.values()).sort((left, right) =>
      `${left.vesselName}${left.crewName}`.localeCompare(`${right.vesselName}${right.crewName}`)
    ),
    recentEntries: entries.map((entry) => ({
      id: entry.id,
      crewId: entry.crewId,
      crewName: entry.crew.fullName,
      rank: entry.crew.rank,
      vesselId: entry.vesselId,
      vesselName: entry.vessel.name,
      logDate: entry.logDate.toISOString(),
      workHours: entry.workHours,
      restHours: entry.restHours,
      minimumRestHours: entry.minimumRestHours,
      isCompliant: entry.isCompliant,
      remarks: entry.remarks,
      recordedByName: entry.recordedByName,
    })),
    coverageGaps,
  } satisfies RestHourRegisterData;
}
