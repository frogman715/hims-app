import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError, ApiError, generateRequestId, validateAndSanitize } from "@/lib/error-handler";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { rateLimit } from "@/lib/rate-limit";
import { distributedRateLimit } from "@/lib/rate-limit-redis";
import { env } from "@/lib/env";

/**
 * Request size limit (configurable via environment variable)
 * Default: 10MB
 */
const MAX_REQUEST_SIZE = parseInt(process.env.MAX_REQUEST_SIZE || '10485760'); // 10MB default

/**
 * Check request size to prevent oversized payloads
 */
async function validateRequestSize(req: NextRequest): Promise<void> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    throw new ApiError(
      413,
      `Request payload too large. Maximum size: ${Math.floor(MAX_REQUEST_SIZE / 1024 / 1024)}MB`,
      "PAYLOAD_TOO_LARGE"
    );
  }
}

/**
 * Extract and validate request body with size check
 */
export async function getSafeRequestBody(req: NextRequest): Promise<unknown> {
  await validateRequestSize(req);
  
  try {
    const body = await req.json();
    return body;
  } catch (error) {
    throw new ApiError(400, "Invalid JSON in request body", "INVALID_JSON");
  }
}

/**
 * Higher-order function to wrap API routes with authentication
 * Automatically handles session validation, request tracing, and error handling
 */
export function withAuth<T = unknown>(
  handler: (
    req: NextRequest,
    session: Session,
    context: T
  ) => Promise<NextResponse>
) {
    return async (req: NextRequest, context: T): Promise<NextResponse> => {
      const requestId = generateRequestId();
      const startTime = Date.now();
      
      try {
        if (!env.hasNextAuthSecret) {
          console.error("[api-middleware] NEXTAUTH_SECRET missing");
          return NextResponse.json(
            { 
              error: "Authentication service temporarily unavailable", 
              code: "CONFIG_ERROR",
              requestId 
            },
            { status: 503 }
          );
        }

        const session = await getServerSession({ ...authOptions, secret: env.NEXTAUTH_SECRET ?? undefined });

        if (!session || !session.user) {
          return NextResponse.json(
            { 
              error: "Authentication required", 
              code: "UNAUTHORIZED",
              requestId 
            },
            { status: 401 }
          );
        }

        const response = await handler(req, session, context);
        
        // Add request ID and timing headers
        response.headers.set("X-Request-ID", requestId);
        response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
        
        return response;
      } catch (error) {
        return handleApiError(error, requestId, {
          userId: undefined, // Session may not be available
          path: req.nextUrl.pathname
        });
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
 * Apply rate limiting middleware using distributed Redis-based rate limiting
 * Falls back to in-memory if Redis is unavailable
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

    // Use distributed rate limiting (Redis with in-memory fallback)
    const allowed = await distributedRateLimit(identifier, maxRequests, windowMs);
    
    if (!allowed) {
      throw new ApiError(
        429,
        "Too many requests. Please try again later.",
        "RATE_LIMIT_EXCEEDED",
        {
          maxRequests,
          windowMs,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      );
    }

    return await handler(req, session, context);
  });
}

/**
 * Combine authentication, permission check, and rate limiting
 */
export function withFullProtection<T = unknown>(
  module: string,
  requiredLevel: PermissionLevel,
  maxRequests: number,
  windowMs: number,
  handler: (
    req: NextRequest,
    session: Session,
    context: T
  ) => Promise<NextResponse>
) {
  return withAuth<T>(async (req, session, context) => {
    // Check rate limit
    const identifier = session.user.id;
    const allowed = await distributedRateLimit(identifier, maxRequests, windowMs);
    
    if (!allowed) {
      throw new ApiError(
        429,
        "Too many requests. Please try again later.",
        "RATE_LIMIT_EXCEEDED",
        {
          maxRequests,
          windowMs,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      );
    }
    
    // Check permissions
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
