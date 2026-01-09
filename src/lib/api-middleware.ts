import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

/**
 * Higher-order function to wrap API routes with authentication
 * Automatically handles session validation and error handling
 */
export function withAuth<T = unknown>(
  handler: (
    req: NextRequest,
    session: Session,
    context: T
  ) => Promise<NextResponse>
) {
    return async (req: NextRequest, context: T): Promise<NextResponse> => {
      try {
        if (!env.hasNextAuthSecret) {
          console.error("[api-middleware] NEXTAUTH_SECRET missing");
          return NextResponse.json(
            { error: "Authentication service temporarily unavailable", code: "CONFIG_ERROR" },
            { status: 503 }
          );
        }

        const session = await getServerSession({ ...authOptions, secret: env.NEXTAUTH_SECRET ?? undefined });

        if (!session || !session.user) {
          return NextResponse.json(
            { error: "Authentication required", code: "UNAUTHORIZED" },
            { status: 401 }
          );
        }

        return await handler(req, session, context);
      } catch (error) {
        return handleApiError(error);
      }
    };
}

/**
 * Higher-order function to wrap API routes with authentication AND permission check
 */
export function withPermission<T = unknown>(
  module: string,
  requiredLevel: PermissionLevel,
  handler: (
    req: NextRequest,
    session: Session,
    context: T
  ) => Promise<NextResponse>
) {
  return withAuth<T>(async (req, session, context) => {
    if (!checkPermission(session, module, requiredLevel)) {
      throw new ApiError(
        403,
        "Insufficient permissions for this operation",
        "FORBIDDEN"
      );
    }

    return await handler(req, session, context);
  });
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis-based solution
 */
/**
 * Apply rate limiting middleware
 */
export function withRateLimit<T = unknown>(
  maxRequests: number,
  windowMs: number,
  handler: (
    req: NextRequest,
    session: Session,
    context: T
  ) => Promise<NextResponse>
) {
  return withAuth<T>(async (req, session, context) => {
    const identifier = session.user.id;

    if (!rateLimit(identifier, maxRequests, windowMs)) {
      throw new ApiError(
        429,
        "Too many requests. Please try again later.",
        "RATE_LIMIT_EXCEEDED"
      );
    }

    return await handler(req, session, context);
  });
}
