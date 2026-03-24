import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { canAccessOfficePath } from "@/lib/office-access";

export function hasOfficeApiPathAccess(
  session: Session | null,
  pathname: string,
  method = "GET"
): boolean {
  if (!session?.user) {
    return false;
  }

  const roles = [...(session.user.roles ?? []), session.user.role ?? ""].filter(Boolean);
  return canAccessOfficePath(
    pathname,
    roles,
    session.user.isSystemAdmin === true,
    method
  );
}

export function ensureOfficeApiPathAccess(
  session: Session | null,
  pathname: string,
  method = "GET",
  message = "Insufficient permissions"
) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasOfficeApiPathAccess(session, pathname, method)) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return null;
}

