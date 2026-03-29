import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export function hasPrincipalSessionScope(session: Session | null): session is Session & {
  user: Session["user"] & { principalId: string; principalName?: string | null };
} {
  return !!(
    session?.user &&
    Array.isArray(session.user.roles) &&
    session.user.roles.includes("PRINCIPAL") &&
    typeof session.user.principalId === "string" &&
    session.user.principalId.length > 0
  );
}

export function ensurePrincipalSession(
  session: Session | null,
  message = "Principal access is not available for this account"
) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPrincipalSessionScope(session)) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return null;
}
