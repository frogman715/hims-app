import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CREW_ROLE_SET = new Set(["CREW", "CREW_PORTAL"]);
const OFFICE_ROLE_SET = new Set(["DIRECTOR", "CDMO", "OPERATIONAL", "ACCOUNTING", "HR"]);

const PUBLIC_PREFIXES = ["/auth", "/_next", "/favicon.ico", "/icons", "/manifest.json", "/sw.js"];

const CREW_PREFIXES = ["/m", "/m/crew"];
const OFFICE_PREFIXES = [
  "/dashboard",
  "/crewing",
  "/accounting",
  "/contracts",
  "/documents",
  "/insurance",
  "/agency-fees",
  "/hr",
  "/disciplinary",
  "/quality",
  "/wage-scales",
  "/compliance",
  "/admin",
  "/national-holidays",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isCrewPath(pathname: string): boolean {
  return CREW_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isOfficePath(pathname: string): boolean {
  return OFFICE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function normaliseRoles(raw: unknown): string[] {
  if (!raw) {
    return [];
  }

  const collected: string[] = [];

  if (Array.isArray(raw)) {
    for (const value of raw) {
      if (typeof value === "string" && value.trim().length > 0) {
        collected.push(value.trim().toUpperCase());
      }
    }
    return collected;
  }

  if (typeof raw === "string" && raw.trim().length > 0) {
    return [raw.trim().toUpperCase()];
  }

  return collected;
}

function resolveRoleCategory(roles: string[]): "office" | "crew" | "unknown" {
  const hasOffice = roles.some((role) => OFFICE_ROLE_SET.has(role));
  if (hasOffice) {
    return "office";
  }

  const hasCrew = roles.some((role) => CREW_ROLE_SET.has(role));
  if (hasCrew) {
    return "crew";
  }

  return "unknown";
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    if (pathname !== "/auth/signin") {
      const callbackTarget = `${pathname}${search}`;
      signInUrl.searchParams.set("callbackUrl", callbackTarget);
    }
    return NextResponse.redirect(signInUrl);
  }

  const roleCandidates = normaliseRoles(token.roles);
  if (typeof token.role === "string") {
    const fallbackRole = token.role.trim().toUpperCase();
    if (fallbackRole.length > 0 && !roleCandidates.includes(fallbackRole)) {
      roleCandidates.push(fallbackRole);
    }
  }

  const roleCategory = resolveRoleCategory(roleCandidates);

  if (isCrewPath(pathname)) {
    if (roleCategory === "office") {
      const target = new URL("/dashboard", request.url);
      return NextResponse.redirect(target);
    }
    if (roleCategory === "unknown") {
      const target = new URL("/auth/signin", request.url);
      target.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  if (isOfficePath(pathname) || pathname === "/dashboard") {
    if (roleCategory !== "office") {
      const target = new URL("/m/crew", request.url);
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)"],
};
