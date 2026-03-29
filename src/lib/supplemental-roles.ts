import { UserRole } from "@/lib/permissions";

type SupplementalRoleMap = Record<string, UserRole[]>;

function parseRole(value: unknown): UserRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return Object.values(UserRole).includes(normalized as UserRole)
    ? (normalized as UserRole)
    : null;
}

function normalizeRoleList(value: unknown): UserRole[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const roles = value
    .map((item) => parseRole(item))
    .filter((item): item is UserRole => item !== null);

  return Array.from(new Set(roles));
}

function parseSupplementalRoleMap(rawValue: string | undefined): SupplementalRoleMap {
  if (!rawValue) {
    return {};
  }

  try {
    const parseJsonObject = (input: string): Record<string, unknown> => {
      const parsedValue = JSON.parse(input) as unknown;
      if (typeof parsedValue === "string") {
        return JSON.parse(parsedValue) as Record<string, unknown>;
      }
      return parsedValue as Record<string, unknown>;
    };

    let parsed: Record<string, unknown>;
    try {
      parsed = parseJsonObject(rawValue);
    } catch {
      parsed = parseJsonObject(rawValue.replace(/\\"/g, '"'));
    }

    return Object.entries(parsed).reduce<SupplementalRoleMap>((acc, [key, value]) => {
      const normalizedKey = key.trim().toLowerCase();
      if (!normalizedKey) {
        return acc;
      }

      const roles = normalizeRoleList(value);
      if (roles.length > 0) {
        acc[normalizedKey] = roles;
      }

      return acc;
    }, {});
  } catch (error) {
    console.error("[supplemental-roles] failed to parse HIMS_SUPPLEMENTAL_ROLE_MAP", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

const supplementalRoleMap = parseSupplementalRoleMap(process.env.HIMS_SUPPLEMENTAL_ROLE_MAP);

export function getSupplementalRoles(params: {
  userId?: string | null;
  email?: string | null;
}): UserRole[] {
  const keys = [params.userId, params.email]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());

  const roles = keys.flatMap((key) => supplementalRoleMap[key] ?? []);
  return Array.from(new Set(roles));
}
