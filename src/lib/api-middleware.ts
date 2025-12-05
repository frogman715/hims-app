import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

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
      const session = await getServerSession(authOptions);

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
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

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
