import type { AppRole } from "@/lib/roles";
import type { AdminMaintenanceScope } from "@/lib/admin-maintenance-access";
import { ADMIN_MAINTENANCE_SCOPES } from "@/lib/admin-maintenance-access";
import { hasExplicitRoleAccess } from "@/lib/authorization";

export const ADMIN_ALLOWED_ROLES: AppRole[] = [
  "DIRECTOR",
  "HR_ADMIN",
];

export { ADMIN_MAINTENANCE_SCOPES };
export type { AdminMaintenanceScope };

type AdminAccessSubject = {
  roles?: string[] | null;
  role?: string | null;
  isSystemAdmin?: boolean;
  adminMaintenanceScopes?: AdminMaintenanceScope[] | null;
};

function normalizeScopes(scopes?: AdminMaintenanceScope[] | null): AdminMaintenanceScope[] {
  if (!Array.isArray(scopes)) {
    return [];
  }

  return Array.from(
    new Set(
      scopes.filter((scope): scope is AdminMaintenanceScope =>
        Object.values(ADMIN_MAINTENANCE_SCOPES).includes(scope)
      )
    )
  );
}

export function hasAdminMaintenanceScope(
  subject: AdminAccessSubject,
  scope: AdminMaintenanceScope
): boolean {
  if (hasExplicitRoleAccess(subject, ADMIN_ALLOWED_ROLES)) {
    return true;
  }

  return normalizeScopes(subject.adminMaintenanceScopes).includes(scope);
}

export function canAccessAnyAdminArea(subject: AdminAccessSubject): boolean {
  if (hasExplicitRoleAccess(subject, ADMIN_ALLOWED_ROLES)) {
    return true;
  }

  return normalizeScopes(subject.adminMaintenanceScopes).length > 0;
}

export function getAdminScopeForPath(pathname: string): AdminMaintenanceScope | null {
  if (/^\/admin\/users(?:\/|$)/.test(pathname) || /^\/api\/admin\/users(?:\/|$)/.test(pathname)) {
    return ADMIN_MAINTENANCE_SCOPES.USER_MANAGEMENT;
  }

  if (/^\/admin\/system-health(?:\/|$)/.test(pathname)) {
    return ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH;
  }

  if (/^\/admin\/audit-logs(?:\/|$)/.test(pathname) || /^\/api\/admin\/audit-logs(?:\/|$)/.test(pathname)) {
    return ADMIN_MAINTENANCE_SCOPES.AUDIT_LOGS;
  }

  return null;
}
