/**
 * HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS) v2
 * TYPE GUARDS AND TYPE UTILITIES
 * 
 * Provides type safety utilities for runtime type checking and validation
 * across the application, ensuring consistent type handling for roles,
 * sessions, and user data.
 */

import { UserRole } from './permissions';
import type { Session } from 'next-auth';

/**
 * Extended session type with HIMS-specific user fields
 */
export interface HIMSSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    roles: string[];
    isSystemAdmin?: boolean;
  };
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Type guard to check if roles array contains only valid UserRoles
 */
export function areValidUserRoles(roles: string[]): roles is UserRole[] {
  return roles.every(role => isValidUserRole(role));
}

/**
 * Normalizes a role string to a valid UserRole or returns default
 */
export function normalizeToUserRole(role: string | null | undefined, defaultRole: UserRole = UserRole.CREW_PORTAL): UserRole {
  if (!role) return defaultRole;
  const upperRole = role.toUpperCase();
  return isValidUserRole(upperRole) ? upperRole : defaultRole;
}

/**
 * Normalizes an array of role strings to valid UserRoles
 */
export function normalizeToUserRoles(roles: string | string[] | null | undefined): UserRole[] {
  if (!roles) return [UserRole.CREW_PORTAL];
  
  const roleArray = Array.isArray(roles) ? roles : [roles];
  const normalized = roleArray
    .map(r => r.toUpperCase())
    .filter(isValidUserRole);
  
  return normalized.length > 0 ? normalized : [UserRole.CREW_PORTAL];
}

/**
 * Type guard to check if session has valid user data
 */
export function hasValidSession(session: Session | null): session is HIMSSession {
  return !!(
    session?.user &&
    'id' in session.user &&
    'email' in session.user &&
    'roles' in session.user &&
    Array.isArray((session.user as HIMSSession['user']).roles) &&
    (session.user as HIMSSession['user']).roles.length > 0
  );
}

/**
 * Safely extracts roles from session with fallback
 */
export function getSessionRoles(session: Session | null): UserRole[] {
  if (!hasValidSession(session)) {
    return [UserRole.CREW_PORTAL];
  }
  
  return normalizeToUserRoles(session.user.roles);
}

/**
 * Safely extracts primary role from session
 */
export function getSessionPrimaryRole(session: Session | null): UserRole {
  const roles = getSessionRoles(session);
  return roles[0] || UserRole.CREW_PORTAL;
}

/**
 * Type guard for system admin check
 */
export function isSystemAdmin(session: { user?: { isSystemAdmin?: boolean } } | null): boolean {
  return !!(session?.user && 'isSystemAdmin' in session.user && session.user.isSystemAdmin === true);
}

/**
 * Type-safe permission check wrapper
 */
export interface PermissionCheckContext {
  session: Session | null;
  requiredModule: string;
  requiredLevel: string;
}

/**
 * Validates that a permission check context has required fields
 */
export function isValidPermissionContext(ctx: unknown): ctx is PermissionCheckContext {
  return !!(
    ctx &&
    typeof ctx === 'object' &&
    'session' in ctx &&
    'requiredModule' in ctx &&
    'requiredLevel' in ctx &&
    typeof (ctx as PermissionCheckContext).requiredModule === 'string' &&
    typeof (ctx as PermissionCheckContext).requiredLevel === 'string'
  );
}
