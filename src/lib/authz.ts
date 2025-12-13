import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { AppRole } from "@/lib/roles";
import { ALL_APP_ROLES, APP_ROLES, CREW_ROLE_SET } from "@/lib/roles";

export { APP_ROLES, OFFICE_ROLES, CREW_ROLES } from "@/lib/roles";
export type { AppRole } from "@/lib/roles";

export type AppUser = {
  id: string;
  role: AppRole;
  roles: AppRole[];
};

export type RequireUserOptions = {
  redirectIfCrew?: string;
  redirectIfOffice?: string;
  allowedRoles?: AppRole[];
  redirectOnDisallowed?: string;
};

const ALL_VALID_ROLES: readonly AppRole[] = ALL_APP_ROLES;

const ROLE_HOME_MAP: Record<AppRole, string> = {
  [APP_ROLES.CREW]: "/m/crew",
  [APP_ROLES.CREW_PORTAL]: "/m/crew",
  [APP_ROLES.DIRECTOR]: "/dashboard",
  [APP_ROLES.CDMO]: "/dashboard",
  [APP_ROLES.OPERATIONAL]: "/dashboard",
  [APP_ROLES.ACCOUNTING]: "/dashboard",
  [APP_ROLES.HR]: "/dashboard",
};

function logAuthEvent(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  try {
    const pathname = typeof details.pathname === "string" ? details.pathname : "unknown";
    console.info(`[authz] ${event}`, { pathname, ...details });
  } catch {
    console.info(`[authz] ${event}`);
  }
}

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function coerceRole(value?: string | null): AppRole | null {
  if (!value) {
    return null;
  }
  const upper = value.toUpperCase() as AppRole;
  if ((ALL_VALID_ROLES as readonly AppRole[]).includes(upper)) {
    return upper;
  }
  return null;
}

export function normalizeUser(rawUser: Partial<AppUser> & { id?: string; role?: string; roles?: string[] }): AppUser {
  const id = rawUser.id ?? "";
  const initialRoles: AppRole[] = [];

  const primaryFromRole = coerceRole(rawUser.role);
  if (primaryFromRole) {
    initialRoles.push(primaryFromRole);
  }

  if (Array.isArray(rawUser.roles)) {
    for (const value of rawUser.roles) {
      const coerced = coerceRole(value);
      if (coerced) {
        initialRoles.push(coerced);
      }
    }
  }

  const deduped = dedupe(initialRoles);
  const primary = deduped.find((role) => !CREW_ROLE_SET.has(role)) ?? deduped[0] ?? APP_ROLES.CREW_PORTAL;
  const orderedRoles = primary
    ? [primary, ...deduped.filter((role) => role !== primary)]
    : deduped;
  const roles = (orderedRoles.length > 0 ? orderedRoles : [APP_ROLES.CREW_PORTAL]) as AppRole[];

  return {
    id,
    role: primary,
    roles,
  };
}

export function isCrewRole(role: AppRole, roles: AppRole[] = []): boolean {
  const combined = dedupe([role, ...roles]);
  const hasOfficeRole = combined.some((value) => !CREW_ROLE_SET.has(value));
  if (hasOfficeRole) {
    return false;
  }
  return combined.some((value) => CREW_ROLE_SET.has(value));
}

export function resolveDefaultRoute(role: AppRole): string {
  return ROLE_HOME_MAP[role] ?? "/dashboard";
}

export async function requireUser(options: RequireUserOptions = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const normalized = normalizeUser(session.user as Partial<AppUser>);
  const isCrew = isCrewRole(normalized.role, normalized.roles);

  session.user.role = normalized.role;
  session.user.roles = normalized.roles;

  logAuthEvent("require-user", {
    userId: normalized.id,
    role: normalized.role,
    roles: normalized.roles,
    isCrew,
    redirectIfCrew: options.redirectIfCrew ?? null,
    redirectIfOffice: options.redirectIfOffice ?? null,
    allowedRoles: options.allowedRoles ?? null,
  });

  if (isCrew && options.redirectIfCrew) {
    logAuthEvent("redirect-crew", {
      userId: normalized.id,
      role: normalized.role,
      roles: normalized.roles,
      target: options.redirectIfCrew,
    });
    redirect(options.redirectIfCrew);
  }

  if (!isCrew && options.redirectIfOffice) {
    logAuthEvent("redirect-office", {
      userId: normalized.id,
      role: normalized.role,
      roles: normalized.roles,
      target: options.redirectIfOffice,
    });
    redirect(options.redirectIfOffice);
  }

  if (
    options.allowedRoles &&
    options.allowedRoles.length > 0 &&
    !options.allowedRoles.some((role) => normalized.roles.includes(role))
  ) {
    logAuthEvent("redirect-disallowed", {
      userId: normalized.id,
      role: normalized.role,
      roles: normalized.roles,
      target: options.redirectOnDisallowed ?? "/dashboard",
      allowedRoles: options.allowedRoles,
    });
    redirect(options.redirectOnDisallowed ?? "/dashboard");
  }

  return {
    session: session as Session,
    user: normalized,
    isCrew,
  };
}

export async function requireCrew() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const normalized = normalizeUser(session.user as Partial<AppUser>);
  const isCrew = isCrewRole(normalized.role, normalized.roles);

  session.user.role = normalized.role;
  session.user.roles = normalized.roles;

  logAuthEvent("require-crew", {
    userId: normalized.id,
    role: normalized.role,
    roles: normalized.roles,
    isCrew,
  });

  if (!isCrew) {
    logAuthEvent("redirect-non-crew", {
      userId: normalized.id,
      role: normalized.role,
      roles: normalized.roles,
      target: "/dashboard",
    });
    redirect("/dashboard");
  }

  return {
    session: session as Session,
    user: normalized,
  };
}

export type RequireUserApiResult =
  | { ok: true; session: Session; user: AppUser; isCrew: boolean }
  | { ok: false; status: number; message: string };

export async function requireUserApi(allowedRoles?: AppRole[]): Promise<RequireUserApiResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "UNAUTHORIZED" };
  }

  const normalized = normalizeUser(session.user as Partial<AppUser>);
  const isCrew = isCrewRole(normalized.role, normalized.roles);

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.some((role) => normalized.roles.includes(role))
  ) {
    return { ok: false, status: 403, message: "FORBIDDEN" };
  }

  session.user.role = normalized.role;
  session.user.roles = normalized.roles;

  return {
    ok: true,
    session: session as Session,
    user: normalized,
    isCrew,
  };
}
