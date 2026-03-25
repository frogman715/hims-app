import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import type { RolePermissionOverride } from "@/lib/permissions";
import { env } from "@/lib/env";
import { getSupplementalRoles } from "@/lib/supplemental-roles";
import {
  getAdminMaintenanceScopes,
  type AdminMaintenanceScope,
} from "@/lib/admin-maintenance-access";

enum Role {
  DIRECTOR = "DIRECTOR",
  CDMO = "CDMO",
  OPERATIONAL = "OPERATIONAL",
  GA_DRIVER = "GA_DRIVER",
  ACCOUNTING = "ACCOUNTING",
  HR = "HR",
  CREW_PORTAL = "CREW_PORTAL",
  QMR = "QMR",
  HR_ADMIN = "HR_ADMIN",
  SECTION_HEAD = "SECTION_HEAD",
  STAFF = "STAFF",
}

declare module "next-auth" {
  interface User {
    role: string;
    roles: string[];
    permissionOverrides?: RolePermissionOverride[];
    isSystemAdmin?: boolean;
    forcePasswordChange?: boolean;
    adminMaintenanceScopes?: AdminMaintenanceScope[];
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
      forcePasswordChange?: boolean;
      adminMaintenanceScopes?: AdminMaintenanceScope[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    roles: string[];
    permissionOverrides?: RolePermissionOverride[];
    isSystemAdmin?: boolean;
    forcePasswordChange?: boolean;
    adminMaintenanceScopes?: AdminMaintenanceScope[];
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      roles: string[];
      permissionOverrides?: RolePermissionOverride[];
      isSystemAdmin?: boolean;
      forcePasswordChange?: boolean;
      adminMaintenanceScopes?: AdminMaintenanceScope[];
    };
  }
}

const shouldLogAuth = process.env.NODE_ENV === "development";

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
    // Check for Prisma initialization errors by error name and message
    if (error && typeof error === "object" && "name" in error && error.name === "PrismaClientInitializationError") {
      console.error("[auth] prisma-initialization-failed", {
        context,
        message: error.message,
      });
      throw new Error("Authentication storage unavailable");
    }
    throw error;
  }
}

async function fetchUserAccessProfile(
  userId: string,
  context: string
): Promise<{ role?: string; email?: string | null } | null> {
  assertDatabaseConfigured(context);
  const result = await safePrismaCall(context, () =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    })
  ) as { role: string; email: string | null } | null;
  return result ? { role: result.role, email: result.email } : null;
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

        const email = credentials.email.trim().toLowerCase();
        const identifier = `login:${email}`;
        if (!rateLimit(identifier, 5, 60_000)) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        assertDatabaseConfigured("authorize:user");
        const user = await safePrismaCall("authorize:user.findUnique", () =>
          prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isSystemAdmin: true,
              isActive: true,
              forcePasswordChange: true,
              password: true,
            },
          })
        ) as {
          password: string;
          id: string;
          name: string;
          email: string;
          role: string;
          isSystemAdmin: boolean;
          isActive: boolean;
          forcePasswordChange: boolean;
        } | null;

        if (!user || !user.password) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        const normalizedRoles = uniqueRolesFrom(
          user.role,
          getSupplementalRoles({ userId: user.id, email: user.email })
        );
        if (normalizedRoles.length === 0) {
          console.warn("[auth] user-role-missing", {
            userId: user.id,
            email: user.email,
          });
          normalizedRoles.push("CREW_PORTAL");
        }

        const role = normalizedRoles[0];
        const adminMaintenanceScopes = getAdminMaintenanceScopes({ userId: user.id, email: user.email });

        return {
          id: typeof user.id === "string" ? user.id : String(user.id),
          email: user.email,
          name: user.name,
          role,
          roles: normalizedRoles,
          isSystemAdmin: user.isSystemAdmin ?? false,
          forcePasswordChange: user.forcePasswordChange ?? false,
          adminMaintenanceScopes,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        const previousRoles = Array.isArray(token.roles) ? [...token.roles] : [];
        let resolvedRoles = uniqueRolesFrom(token.roles, token.role);
        let primaryRole = resolvedRoles[0];
        let userIdFromSource: string | undefined;

        if (user) {
          const rawId = (user as { id?: unknown }).id;
          const userId = typeof rawId === "string" ? rawId : typeof rawId === "number" ? rawId.toString() : undefined;
          userIdFromSource = userId ?? undefined;
          let dbProfile: { role?: string; email?: string | null } | null = null;
          if (userId) {
            try {
              dbProfile = await fetchUserAccessProfile(userId, "jwt:user-role");
            } catch (error) {
              console.error("[auth] jwt: failed to fetch user role", {
                userId,
                error: error instanceof Error ? error.message : String(error),
              });
              // Continue with roles from user object if DB fetch fails
            }
          }

          resolvedRoles = uniqueRolesFrom(
            user.roles,
            user.role,
            dbProfile?.role,
            getSupplementalRoles({ userId, email: user.email ?? dbProfile?.email ?? null })
          );
          if (resolvedRoles.length === 0) {
            resolvedRoles = ["CREW_PORTAL"];
          }
          primaryRole = resolvedRoles[0];
        }

        const tokenSubject = token.sub ?? userIdFromSource;

        if ((!primaryRole || resolvedRoles.length === 0) && tokenSubject) {
          try {
            const dbProfile = await fetchUserAccessProfile(tokenSubject, "jwt:token-subject");
            const dbRoles = uniqueRolesFrom(
              dbProfile?.role,
              getSupplementalRoles({ userId: tokenSubject, email: dbProfile?.email ?? null })
            );
            if (dbRoles.length > 0) {
              resolvedRoles = dbRoles;
              primaryRole = dbRoles[0];
            }
          } catch (error) {
            console.error("[auth] jwt: failed to fetch role for token subject", {
              tokenSubject,
              error: error instanceof Error ? error.message : String(error),
            });
            // Continue with default roles if DB fetch fails
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
          try {
            permissionOverrides = await loadPermissionOverrides(resolvedRoles);
          } catch (error) {
            console.error("[auth] jwt: failed to load permission overrides", {
              roles: resolvedRoles,
              error: error instanceof Error ? error.message : String(error),
            });
            // Continue with empty overrides if load fails
            permissionOverrides = [];
          }
        }

        token.role = primaryRole;
        token.roles = resolvedRoles;
        token.permissionOverrides = permissionOverrides;

        let isSystemAdmin = false;
        let forcePasswordChange = false;
        let adminMaintenanceScopes: AdminMaintenanceScope[] = Array.isArray(token.adminMaintenanceScopes)
          ? token.adminMaintenanceScopes
          : [];
        const userWithSystemAdmin = user as unknown as Record<string, unknown>;
        if (user && typeof userWithSystemAdmin["isSystemAdmin"] === "boolean") {
          isSystemAdmin = userWithSystemAdmin["isSystemAdmin"] as boolean;
          forcePasswordChange =
            typeof userWithSystemAdmin["forcePasswordChange"] === "boolean"
              ? (userWithSystemAdmin["forcePasswordChange"] as boolean)
              : false;
          adminMaintenanceScopes = Array.isArray(userWithSystemAdmin["adminMaintenanceScopes"])
            ? (userWithSystemAdmin["adminMaintenanceScopes"] as AdminMaintenanceScope[])
            : [];
        } else if (tokenSubject) {
          try {
            const dbUser = await safePrismaCall("jwt:isSystemAdmin", () =>
              prisma.user.findUnique({
                where: { id: tokenSubject },
                select: { isSystemAdmin: true, forcePasswordChange: true, isActive: true },
              })
            ) as { isSystemAdmin: boolean; forcePasswordChange: boolean; isActive: boolean } | null;
            if (dbUser?.isActive === false) {
              throw new Error("Inactive user");
            }
            isSystemAdmin = dbUser?.isSystemAdmin ?? false;
            forcePasswordChange = dbUser?.forcePasswordChange ?? false;
          } catch (error) {
            console.error("[auth] jwt: failed to fetch isSystemAdmin", {
              tokenSubject,
              error: error instanceof Error ? error.message : String(error),
            });
            // Continue with false if DB fetch fails
          }

          try {
            const dbProfile = await fetchUserAccessProfile(tokenSubject, "jwt:admin-maintenance-scopes");
            adminMaintenanceScopes = getAdminMaintenanceScopes({
              userId: tokenSubject,
              email: dbProfile?.email ?? null,
            });
          } catch (error) {
            console.error("[auth] jwt: failed to resolve admin maintenance scopes", {
              tokenSubject,
              error: error instanceof Error ? error.message : String(error),
            });
            adminMaintenanceScopes = [];
          }
        }
        token.isSystemAdmin = isSystemAdmin;
        token.forcePasswordChange = forcePasswordChange;
        token.adminMaintenanceScopes = adminMaintenanceScopes;

        const tokenUser = {
          id: tokenSubject ?? "",
          email: user?.email ?? token.email ?? null,
          name: user?.name ?? token.name ?? null,
          role: primaryRole,
          roles: resolvedRoles,
          permissionOverrides,
          isSystemAdmin,
          forcePasswordChange,
          adminMaintenanceScopes,
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
      } catch (error) {
        // Log critical JWT callback errors
        console.error("[auth] jwt callback failed", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        });
        
        // Return token with minimal safe defaults to prevent complete auth failure
        return {
          ...token,
          role: token.role ?? "CREW_PORTAL",
          roles: Array.isArray(token.roles) && token.roles.length > 0 ? token.roles : ["CREW_PORTAL"],
          permissionOverrides: [],
          isSystemAdmin: false,
        };
      }
    },
    async session({ session, token }) {
      try {
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
            try {
              const dbProfile = await fetchUserAccessProfile(session.user.id, "session:user-role");
              normalizedRoles = uniqueRolesFrom(
                dbProfile?.role,
                getSupplementalRoles({ userId: session.user.id, email: dbProfile?.email ?? session.user.email ?? null })
              );
            } catch (error) {
              console.error("[auth] session: failed to fetch user role", {
                userId: session.user.id,
                error: error instanceof Error ? error.message : String(error),
              });
              // Continue with default role if DB fetch fails
            }
          }

          if (normalizedRoles.length === 0) {
            normalizedRoles = ["CREW_PORTAL"];
          }

          const primaryRole = tokenUser?.role ?? normalizedRoles[0];

          session.user.role = primaryRole;
          session.user.roles = normalizedRoles;
          session.user.permissionOverrides = token.permissionOverrides ?? [];
          session.user.isSystemAdmin = token.isSystemAdmin ?? false;
          session.user.forcePasswordChange = token.forcePasswordChange ?? false;
          session.user.adminMaintenanceScopes = token.adminMaintenanceScopes ?? [];

          if (shouldLogAuth) {
            console.info("[auth] session-callback", {
              userId: session.user.id,
              role: session.user.role,
              roles: session.user.roles,
              isSystemAdmin: session.user.isSystemAdmin,
              adminMaintenanceScopes: session.user.adminMaintenanceScopes,
              tokenRole: token.role ?? null,
              tokenRoles: token.roles ?? null,
              tokenIsSystemAdmin: token.isSystemAdmin ?? null,
            });
          }
        }
        return session;
      } catch (error) {
        // Log critical session callback errors
        console.error("[auth] session callback failed", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        });
        
        // Return session with minimal safe values to prevent complete auth failure
        if (session.user && token) {
          session.user.role = token.role ?? session.user.role ?? "CREW_PORTAL";
          session.user.roles = Array.isArray(token.roles) && token.roles.length > 0 
            ? token.roles 
            : (session.user.role ? [session.user.role] : ["CREW_PORTAL"]);
          session.user.permissionOverrides = [];
          session.user.isSystemAdmin = false;
          session.user.forcePasswordChange = false;
          session.user.adminMaintenanceScopes = [];
        }
        return session;
      }
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
        .filter((role): role is string => (Object.values(Role) as string[]).includes(role))
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          in: normalizedRoles as any,
        },
      },
      select: {
        role: true,
        moduleKey: true,
        level: true,
      },
    })
  ) as Array<{ role: string; moduleKey: string; level: string }> | null;

  return (overrides || []).map((entry) => ({
    role: entry.role,
    moduleKey: entry.moduleKey,
    level: entry.level as RolePermissionOverride['level'],
  }));
}
