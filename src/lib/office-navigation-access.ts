import type { AdminMaintenanceScope } from "@/lib/admin-maintenance-access";
import { getAdminScopeForPath, hasAdminMaintenanceScope } from "@/lib/admin-access";
import { hasExplicitRoleAccess, hasModuleAccess } from "@/lib/authorization";
import { canAccessOfficePath } from "@/lib/office-access";
import type { OfficeNavigationItem } from "@/lib/office-navigation";
import type { RolePermissionOverride } from "@/lib/permissions";

type OfficeNavigationSubject = {
  roles?: string[] | null;
  role?: string | null;
  isSystemAdmin?: boolean;
  permissionOverrides?: RolePermissionOverride[] | null;
  adminMaintenanceScopes?: AdminMaintenanceScope[] | null;
};

export function canAccessOfficeNavigationItem(
  item: OfficeNavigationItem,
  subject: OfficeNavigationSubject
): boolean {
  const adminScope = getAdminScopeForPath(item.href);
  if (adminScope) {
    return hasAdminMaintenanceScope(subject, adminScope);
  }

  if (!hasModuleAccess(subject, item.module, item.requiredLevel)) {
    return false;
  }

  if (!hasExplicitRoleAccess(subject, item.allowedRoles)) {
    return false;
  }

  const roles = [
    ...(Array.isArray(subject.roles) ? subject.roles : []),
    typeof subject.role === "string" ? subject.role : undefined,
  ].filter((value): value is string => Boolean(value));

  return canAccessOfficePath(
    item.href.split("?")[0] || item.href,
    roles,
    subject.isSystemAdmin === true
  );
}
