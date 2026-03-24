import {
  hasPermission,
  PermissionLevel,
  type RolePermissionOverride,
  UserRole,
} from "@/lib/permissions";

type AuthorizationSubject = {
  roles?: string[] | null;
  role?: string | null;
  isSystemAdmin?: boolean;
  permissionOverrides?: RolePermissionOverride[] | null;
};

function normalizeRole(value: string | null | undefined): UserRole | null {
  if (!value) {
    return null;
  }

  const upper = value.toUpperCase();
  return Object.values(UserRole).includes(upper as UserRole) ? (upper as UserRole) : null;
}

export function resolveAuthorizationRoles(
  roles?: string[] | null,
  role?: string | null
): UserRole[] {
  const resolved = [
    ...(Array.isArray(roles) ? roles : []),
    typeof role === "string" ? role : undefined,
  ]
    .map((value) => normalizeRole(value))
    .filter((value): value is UserRole => value !== null);

  return Array.from(new Set(resolved));
}

export function hasExplicitRoleAccess(
  subject: AuthorizationSubject,
  allowedRoles?: readonly string[]
): boolean {
  if (subject.isSystemAdmin === true) {
    return true;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const resolvedRoles = resolveAuthorizationRoles(subject.roles, subject.role);
  const normalizedAllowed = allowedRoles
    .map((value) => normalizeRole(value))
    .filter((value): value is UserRole => value !== null);

  if (resolvedRoles.length === 0 || normalizedAllowed.length === 0) {
    return false;
  }

  return resolvedRoles.some((value) => normalizedAllowed.includes(value));
}

export function hasModuleAccess(
  subject: AuthorizationSubject,
  module: string,
  requiredLevel: PermissionLevel
): boolean {
  if (subject.isSystemAdmin === true) {
    return true;
  }

  const resolvedRoles = resolveAuthorizationRoles(subject.roles, subject.role);
  if (resolvedRoles.length === 0) {
    return false;
  }

  return hasPermission(
    resolvedRoles,
    module,
    requiredLevel,
    subject.permissionOverrides
  );
}

