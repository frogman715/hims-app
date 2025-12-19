import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";

const PUBLIC_PREFIXES = ["/auth", "/_next", "/favicon.ico", "/icons", "/manifest.json", "/sw.js"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api") || isPublicPath(pathname)) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)"],
};
