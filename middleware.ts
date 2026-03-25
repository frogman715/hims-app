import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";
import { canAccessOfficePath, getPrimaryOfficeRole } from "@/lib/office-access";
import { getAdminMaintenanceScopes } from "@/lib/admin-maintenance-access";
import { getAdminScopeForPath } from "@/lib/admin-access";

const PUBLIC_PREFIXES = ["/auth", "/_next", "/favicon.ico", "/icons", "/manifest.json", "/sw.js"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    isPublicPath(pathname) ||
    PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return NextResponse.next();
  }

  if (!env.hasNextAuthSecret) {
    console.error("[middleware] NEXTAUTH_SECRET missing");
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("error", "AuthenticationUnavailable");
    return NextResponse.redirect(signInUrl);
  }

  const secret = env.NEXTAUTH_SECRET!;
  type TokenResult = Awaited<ReturnType<typeof getToken>>;
  let token: TokenResult = null;
  try {
    token = await getToken({ req: request, secret });
  } catch (error) {
    console.error("[middleware] token-resolve-failed", { error });
  }

  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    const callbackTarget = `${pathname}${search}`;
    signInUrl.searchParams.set("callbackUrl", callbackTarget);
    return NextResponse.redirect(signInUrl);
  }

  const tokenPayload = (token && typeof token === "object" ? token : {}) as Record<string, unknown>;
  const tokenUser = (tokenPayload.user && typeof tokenPayload.user === "object"
    ? tokenPayload.user
    : {}) as Record<string, unknown>;

  const tokenRoles = [
    ...(Array.isArray(tokenUser.roles) ? (tokenUser.roles as string[]) : []),
    ...(Array.isArray(tokenPayload.roles) ? (tokenPayload.roles as string[]) : []),
    typeof tokenUser.role === "string" ? tokenUser.role : undefined,
    typeof tokenPayload.role === "string" ? tokenPayload.role : undefined,
  ].filter((value): value is string => Boolean(value));
  const isSystemAdmin = tokenPayload.isSystemAdmin === true || tokenUser.isSystemAdmin === true;
  const forcePasswordChange =
    tokenPayload.forcePasswordChange === true || tokenUser.forcePasswordChange === true;
  const primaryRole =
    (typeof tokenUser.role === "string" ? tokenUser.role : null) ??
    (typeof tokenPayload.role === "string" ? tokenPayload.role : null);
  const primaryOfficeRoles = getPrimaryOfficeRole(tokenRoles, primaryRole);
  const tokenUserId =
    (typeof tokenUser.id === "string" ? tokenUser.id : null) ??
    (typeof token.sub === "string" ? token.sub : null);
  const tokenEmail =
    (typeof tokenUser.email === "string" ? tokenUser.email : null) ??
    (typeof tokenPayload.email === "string" ? tokenPayload.email : null);
  const adminScope = getAdminScopeForPath(pathname);
  const adminMaintenanceScopes = getAdminMaintenanceScopes({
    userId: tokenUserId,
    email: tokenEmail,
  });

  if (
    forcePasswordChange &&
    pathname !== "/change-password" &&
    !pathname.startsWith("/api/account/change-password")
  ) {
    const changePasswordUrl = new URL("/change-password", request.url);
    return NextResponse.redirect(changePasswordUrl);
  }

  if (!canAccessOfficePath(pathname, primaryOfficeRoles, isSystemAdmin, request.method)) {
    if (adminScope && adminMaintenanceScopes.includes(adminScope)) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Access denied for this role", route: pathname },
        { status: 403 }
      );
    }

    const deniedUrl = new URL("/dashboard", request.url);
    deniedUrl.searchParams.set("accessDenied", "1");
    deniedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)"],
};
