export const ADMIN_MAINTENANCE_SCOPES = {
  USER_MANAGEMENT: "USER_MANAGEMENT",
  SYSTEM_HEALTH: "SYSTEM_HEALTH",
  AUDIT_LOGS: "AUDIT_LOGS",
} as const;

export type AdminMaintenanceScope =
  (typeof ADMIN_MAINTENANCE_SCOPES)[keyof typeof ADMIN_MAINTENANCE_SCOPES];

type AdminMaintenanceAccessMap = Record<string, AdminMaintenanceScope[]>;

function parseScope(value: unknown): AdminMaintenanceScope | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return Object.values(ADMIN_MAINTENANCE_SCOPES).includes(normalized as AdminMaintenanceScope)
    ? (normalized as AdminMaintenanceScope)
    : null;
}

function normalizeScopeList(value: unknown): AdminMaintenanceScope[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const scopes = value
    .map((item) => parseScope(item))
    .filter((item): item is AdminMaintenanceScope => item !== null);

  return Array.from(new Set(scopes));
}

function parseAdminMaintenanceAccessMap(rawValue: string | undefined): AdminMaintenanceAccessMap {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    return Object.entries(parsed).reduce<AdminMaintenanceAccessMap>((acc, [key, value]) => {
      const normalizedKey = key.trim().toLowerCase();
      if (!normalizedKey) {
        return acc;
      }

      const scopes = normalizeScopeList(value);
      if (scopes.length > 0) {
        acc[normalizedKey] = scopes;
      }

      return acc;
    }, {});
  } catch (error) {
    console.error("[admin-maintenance-access] failed to parse HIMS_ADMIN_MAINTENANCE_ACCESS_MAP", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

const adminMaintenanceAccessMap = parseAdminMaintenanceAccessMap(
  process.env.HIMS_ADMIN_MAINTENANCE_ACCESS_MAP
);

export function getAdminMaintenanceScopes(params: {
  userId?: string | null;
  email?: string | null;
}): AdminMaintenanceScope[] {
  const keys = [params.userId, params.email]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());

  const scopes = keys.flatMap((key) => adminMaintenanceAccessMap[key] ?? []);
  return Array.from(new Set(scopes));
}
