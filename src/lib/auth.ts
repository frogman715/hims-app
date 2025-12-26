import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { Prisma, Role as PrismaRole } from "@prisma/client";
import type { RolePermissionOverride } from "@/lib/permissions";
import { env } from "@/lib/env";

declare module "next-auth" {
  interface User {
    role: string;
    roles: string[];
    permissionOverrides?: RolePermissionOverride[];
    isSystemAdmin?: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      roles: string[];
      permissionOverrides?: RolePermissionOverride[];
      isSystemAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    roles: string[];
    permissionOverrides?: RolePermissionOverride[];
    isSystemAdmin?: boolean;
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      roles: string[];
      permissionOverrides?: RolePermissionOverride[];
      isSystemAdmin?: boolean;
    };
  }
}

const shouldLogAuth = process.env.NODE_ENV !== "production";

function assertDatabaseConfigured(context: string): void {
  if (!env.hasDatabaseUrl) {
    console.error("[auth] DATABASE_URL missing", { context });
    throw new Error("Authentication storage misconfigured");
  }
}

async function safePrismaCall<T>(context: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error("[auth] prisma-initialization-failed", {
        context,
        message: error.message,
      });
      throw new Error("Authentication storage unavailable");
    }
    throw error;
  }
}

async function fetchUserRole(userId: string, context: string): Promise<string | undefined> {
  assertDatabaseConfigured(context);
  const result = await safePrismaCall(context, () =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
  );
  return result?.role ?? undefined;
}

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET ?? undefined,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const identifier = `login:${credentials.email.toLowerCase()}`;
        if (!rateLimit(identifier, 5, 60_000)) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        assertDatabaseConfigured("authorize:user");
        const user = await safePrismaCall("authorize:user.findUnique", () =>
          prisma.user.findUnique({
            where: { email: credentials.email },
          })
        );

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        const normalizedRoles = uniqueRolesFrom(user.role);
        if (normalizedRoles.length === 0) {
          console.warn("[auth] user-role-missing", {
            userId: user.id,
            email: user.email,
          });
          normalizedRoles.push("CREW_PORTAL");
        }

        const role = normalizedRoles[0];

        return {
          id: typeof user.id === "string" ? user.id : String(user.id),
          email: user.email,
          name: user.name,
          role,
          roles: normalizedRoles,
          isSystemAdmin: user.isSystemAdmin ?? false,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      const previousRoles = Array.isArray(token.roles) ? [...token.roles] : [];
      let resolvedRoles = uniqueRolesFrom(token.roles, token.role);
      let primaryRole = resolvedRoles[0];
      let userIdFromSource: string | undefined;

      if (user) {
        const rawId = (user as { id?: unknown }).id;
        const userId = typeof rawId === "string" ? rawId : typeof rawId === "number" ? rawId.toString() : undefined;
        userIdFromSource = userId ?? undefined;
        let dbRole: string | undefined;
        if (userId) {
          dbRole = await fetchUserRole(userId, "jwt:user-role");
        }

        resolvedRoles = uniqueRolesFrom(user.roles, user.role, dbRole);
        if (resolvedRoles.length === 0) {
          resolvedRoles = ["CREW_PORTAL"];
        }
        primaryRole = resolvedRoles[0];
      }

      const tokenSubject = token.sub ?? userIdFromSource;

      if ((!primaryRole || resolvedRoles.length === 0) && tokenSubject) {
        const dbRole = await fetchUserRole(tokenSubject, "jwt:token-subject");
        const dbRoles = uniqueRolesFrom(dbRole);
        if (dbRoles.length > 0) {
          resolvedRoles = dbRoles;
          primaryRole = dbRoles[0];
        }
      }

      if (!primaryRole) {
        primaryRole = resolvedRoles[0];
      }

      if (!primaryRole) {
        primaryRole = "CREW_PORTAL";
      }

      if (resolvedRoles.length === 0) {
        resolvedRoles = [primaryRole];
      }

      const rolesChanged =
        resolvedRoles.length !== previousRoles.length ||
        resolvedRoles.some((role, index) => role !== previousRoles[index]);

      let permissionOverrides = Array.isArray(token.permissionOverrides)
        ? token.permissionOverrides
        : [];

      if (user || rolesChanged || permissionOverrides.length === 0) {
        permissionOverrides = await loadPermissionOverrides(resolvedRoles);
      }

      token.role = primaryRole;
      token.roles = resolvedRoles;
      token.permissionOverrides = permissionOverrides;

      let isSystemAdmin = false;
      const userWithSystemAdmin = user as unknown as Record<string, unknown>;
      if (user && typeof userWithSystemAdmin['isSystemAdmin'] === "boolean") {
        isSystemAdmin = userWithSystemAdmin['isSystemAdmin'] as boolean;
      } else if (tokenSubject) {
        const dbUser = await safePrismaCall("jwt:isSystemAdmin", () =>
          prisma.user.findUnique({
            where: { id: tokenSubject },
            select: { isSystemAdmin: true },
          })
        );
        isSystemAdmin = dbUser?.isSystemAdmin ?? false;
      }
      token.isSystemAdmin = isSystemAdmin;

      const tokenUser = {
        id: tokenSubject ?? "",
        email: user?.email ?? token.email ?? null,
        name: user?.name ?? token.name ?? null,
        role: primaryRole,
        roles: resolvedRoles,
        permissionOverrides,
        isSystemAdmin,
      };

      token.user = tokenUser;

      if (shouldLogAuth) {
        console.info("[auth] jwt-callback", {
          trigger: trigger ?? null,
          tokenSub: tokenSubject ?? null,
          hasUser: Boolean(user),
          hasTokenUser: Boolean(token.user),
          role: token.role,
          roles: token.roles,
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const fallbackId = session.user.id ?? "";
        const tokenUser = token.user;
        session.user.id = tokenUser?.id ?? token.sub ?? fallbackId;

        if (tokenUser?.email && !session.user.email) {
          session.user.email = tokenUser.email;
        }
        if (tokenUser?.name && !session.user.name) {
          session.user.name = tokenUser.name;
        }

        let normalizedRoles = uniqueRolesFrom(
          tokenUser?.roles,
          token.roles,
          token.role,
          session.user.role
        );

        if (normalizedRoles.length === 0 && session.user.id) {
          const dbRole = await fetchUserRole(session.user.id, "session:user-role");
          normalizedRoles = uniqueRolesFrom(dbRole);
        }

        if (normalizedRoles.length === 0) {
          normalizedRoles = ["CREW_PORTAL"];
        }

        const primaryRole = tokenUser?.role ?? normalizedRoles[0];

        session.user.role = primaryRole;
        session.user.roles = normalizedRoles;
        session.user.permissionOverrides = token.permissionOverrides ?? [];
        session.user.isSystemAdmin = token.isSystemAdmin ?? false;

        if (shouldLogAuth) {
          console.info("[auth] session-callback", {
            userId: session.user.id,
            role: session.user.role,
            roles: session.user.roles,
            isSystemAdmin: session.user.isSystemAdmin,
            tokenRole: token.role ?? null,
            tokenRoles: token.roles ?? null,
            tokenIsSystemAdmin: token.isSystemAdmin ?? null,
          });
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

function uniqueRolesFrom(...sources: (string | string[] | null | undefined)[]): string[] {
  const collected: string[] = [];

  for (const source of sources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const value of source) {
        if (typeof value === "string" && value.trim().length > 0) {
          collected.push(value.trim().toUpperCase());
        }
      }
      continue;
    }

    if (typeof source === "string" && source.trim().length > 0) {
      collected.push(source.trim().toUpperCase());
    }
  }

  const deduped = Array.from(new Set(collected));
  return deduped;
}

async function loadPermissionOverrides(roles: string[]): Promise<RolePermissionOverride[]> {
  if (roles.length === 0) {
    return [];
  }

  const normalizedRoles = Array.from(
    new Set(
      roles
        .map((role) => role.toUpperCase())
        .filter((role): role is PrismaRole => (Object.values(PrismaRole) as string[]).includes(role))
    )
  );

  if (normalizedRoles.length === 0) {
    return [];
  }

  if (!env.hasDatabaseUrl) {
    console.error("[auth] DATABASE_URL missing", { context: "loadPermissionOverrides" });
    return [];
  }

  const overrides = await safePrismaCall("loadPermissionOverrides:findMany", () =>
    prisma.roleModulePermission.findMany({
      where: {
        role: {
          in: normalizedRoles,
        },
      },
      select: {
        role: true,
        moduleKey: true,
        level: true,
      },
    })
  );

  return overrides.map((entry) => ({
    role: entry.role,
    moduleKey: entry.moduleKey,
    level: entry.level as RolePermissionOverride['level'],
  }));
}