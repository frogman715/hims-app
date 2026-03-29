export const ACTIVE_APPLICATION_STATUSES = [
  "RECEIVED",
  "REVIEWING",
  "INTERVIEW",
  "PASSED",
  "OFFERED",
  "ACCEPTED",
] as const;

export const ACTIVE_PREPARE_JOINING_STATUSES = [
  "PENDING",
  "DOCUMENTS",
  "MEDICAL",
  "TRAINING",
  "TRAVEL",
  "READY",
  "DISPATCHED",
] as const;

export type ActiveApplicationStatus = (typeof ACTIVE_APPLICATION_STATUSES)[number];

type DuplicateApplicationCandidate = {
  id: string;
  crewId: string;
  principalId?: string | null;
  position: string;
  status: string;
  createdAt: Date;
  crew?: {
    fullName?: string | null;
  } | null;
  principal?: {
    name?: string | null;
  } | null;
};

export type DuplicateApplicationGroup = {
  key: string;
  crewId: string;
  crewName: string;
  principalId: string | null;
  principalName: string;
  position: string;
  count: number;
  applicationIds: string[];
  statuses: string[];
  oldestCreatedAt: Date;
  newestCreatedAt: Date;
};

function normalizePosition(position: string) {
  return position.trim().toUpperCase();
}

function buildDuplicateKey(crewId: string, position: string, principalId?: string | null) {
  return [crewId, normalizePosition(position), principalId ?? "NO_PRINCIPAL"].join("::");
}

export function detectDuplicateApplicationGroups(
  applications: DuplicateApplicationCandidate[]
): DuplicateApplicationGroup[] {
  const grouped = new Map<string, DuplicateApplicationCandidate[]>();

  for (const application of applications) {
    const key = buildDuplicateKey(application.crewId, application.position, application.principalId);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(application);
    } else {
      grouped.set(key, [application]);
    }
  }

  return Array.from(grouped.entries())
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => {
      const sorted = [...items].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
      const [first] = sorted;
      const last = sorted[sorted.length - 1];

      return {
        key,
        crewId: first.crewId,
        crewName: first.crew?.fullName?.trim() || "Unknown Crew",
        principalId: first.principalId ?? null,
        principalName: first.principal?.name?.trim() || "No Principal Assigned",
        position: first.position,
        count: sorted.length,
        applicationIds: sorted.map((item) => item.id),
        statuses: sorted.map((item) => item.status),
        oldestCreatedAt: first.createdAt,
        newestCreatedAt: last.createdAt,
      };
    })
    .sort((left, right) => left.oldestCreatedAt.getTime() - right.oldestCreatedAt.getTime());
}
