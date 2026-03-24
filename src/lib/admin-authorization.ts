import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { hasExplicitRoleAccess } from "@/lib/authorization";
import { ADMIN_ALLOWED_ROLES } from "@/lib/admin-access";

export function canAccessAdminArea(session: Session | null): boolean {
  if (!session?.user) {
    return false;
  }

  return hasExplicitRoleAccess(
    {
      roles: session.user.roles,
      role: session.user.role,
      isSystemAdmin: session.user.isSystemAdmin === true,
    },
    ADMIN_ALLOWED_ROLES
  );
}

export function ensureAdminApiAccess(session: Session | null) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessAdminArea(session)) {
    return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
  }

  return null;
}

