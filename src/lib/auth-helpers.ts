import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export interface HanmarineUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isSystemAdmin?: boolean;
}

export interface HanmarineSession {
  user: HanmarineUser;
  expires: string;
}

export async function requireRole(
  req: NextRequest,
  allowedRoles: Role[]
): Promise<void> {
  const session = await getServerSession(authOptions) as HanmarineSession | null;

  if (!session?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Support both single role and array of roles
  const userRoles: string[] = session.user.roles || [];
  // System admin override (isSystemAdmin)
  const isSystemAdmin = session.user.isSystemAdmin === true;

  if (isSystemAdmin) return;

  // If user has at least one allowed role
  if (!userRoles.some((role: string) => allowedRoles.includes(role as Role))) {
    throw new Response("Forbidden", { status: 403 });
  }
}

export async function getCurrentUser(): Promise<HanmarineUser | null> {
  const session = await getServerSession(authOptions) as HanmarineSession | null;
  return session?.user || null;
}

export async function getCurrentUserRole(): Promise<string | null> {
  const session = await getServerSession(authOptions) as HanmarineSession | null;
  return session?.user?.roles?.[0] || null;
}