import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import {
  canAccessAnyAdminArea,
  hasAdminMaintenanceScope,
  type AdminMaintenanceScope,
} from "@/lib/admin-access";

export function canAccessAdminArea(session: Session | null): boolean {
  if (!session?.user) {
    return false;
  }

  return canAccessAnyAdminArea({
    roles: session.user.roles,
    role: session.user.role,
    isSystemAdmin: session.user.isSystemAdmin === true,
    adminMaintenanceScopes: session.user.adminMaintenanceScopes,
  });
}

export function ensureAdminApiAccess(session: Session | null, scope?: AdminMaintenanceScope) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = scope
    ? hasAdminMaintenanceScope(
        {
          roles: session.user.roles,
          role: session.user.role,
          isSystemAdmin: session.user.isSystemAdmin === true,
          adminMaintenanceScopes: session.user.adminMaintenanceScopes,
        },
        scope
      )
    : canAccessAdminArea(session);

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
  }

  return null;
}
