import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface User {
    role: string;
    roles: string[];
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      roles: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    roles: string[];
  }
}

export const authOptions: NextAuthOptions = {
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

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
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role,
          roles: normalizedRoles,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      let resolvedRoles = uniqueRolesFrom(token.roles, token.role);
      let primaryRole = resolvedRoles[0];

      if (user) {
        const userId = typeof user.id === "string" ? user.id : user.id?.toString();
        let dbRole: string | undefined;
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          dbRole = dbUser?.role ?? undefined;
        }

        resolvedRoles = uniqueRolesFrom(user.roles, user.role, dbRole);
        if (resolvedRoles.length === 0) {
          resolvedRoles = ["CREW_PORTAL"];
        }
        primaryRole = resolvedRoles[0];
      }

      if ((!primaryRole || resolvedRoles.length === 0) && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        const dbRoles = uniqueRolesFrom(dbUser?.role);
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

      token.role = primaryRole;
      token.roles = resolvedRoles;

      console.info("[auth] jwt-callback", {
        trigger: trigger ?? null,
        tokenSub: token.sub ?? null,
        hasUser: Boolean(user),
        role: token.role,
        roles: token.roles,
      });

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const fallbackId = session.user.id ?? "";
        session.user.id = token.sub ?? fallbackId;

        const normalizedRoles = uniqueRolesFrom(token.roles, token.role, session.user.role);
        const primaryRole = normalizedRoles[0] ?? "CREW_PORTAL";

        session.user.role = primaryRole;
        session.user.roles = normalizedRoles.length > 0 ? normalizedRoles : [primaryRole];

        console.info("[auth] session-callback", {
          userId: session.user.id,
          role: session.user.role,
          roles: session.user.roles,
          tokenRole: token.role ?? null,
          tokenRoles: token.roles ?? null,
        });
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