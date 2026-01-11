import { NextResponse } from "next/server";

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Detect if an error is related to authentication/session
 */
function isAuthenticationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as Record<string, unknown>;
  const message = String(err.message || "").toLowerCase();

  return (
    message.includes("authentication") ||
    message.includes("session") ||
    message.includes("unauthorized") ||
    message.includes("nextauth") ||
    message.includes("signin") ||
    message.includes("token") ||
    (err.name === "PrismaClientInitializationError" && message.includes("authentication"))
  );
}

/**
 * Centralized error handler for API routes
 * Provides consistent error responses and logging
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for monitoring (in production, send to logging service)
  console.error("[API Error]", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    isAuthError: isAuthenticationError(error),
  });

  // Handle authentication errors
  if (isAuthenticationError(error)) {
    return NextResponse.json(
      {
        error: "Authentication required. Please sign in again.",
        code: "AUTHENTICATION_ERROR",
      },
      { status: 401 }
    );
  }

  // Handle custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors by checking error properties
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    
    // PrismaClientKnownRequestError has a 'code' property
    if (typeof err.code === "string" && err.code.startsWith("P")) {
      const code = err.code;
      switch (code) {
        case "P2002":
          return NextResponse.json(
            { error: "A record with this value already exists", code: "DUPLICATE_ENTRY" },
            { status: 409 }
          );
        case "P2025":
          return NextResponse.json(
            { error: "Record not found", code: "NOT_FOUND" },
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Related record not found", code: "FOREIGN_KEY_VIOLATION" },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: "Database operation failed", code: "DATABASE_ERROR" },
            { status: 500 }
          );
      }
    }
    
    // Check for validation errors by error name
    if (err.name === "PrismaClientValidationError") {
      return NextResponse.json(
        { error: "Invalid data provided", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Check for database connection errors
    if (
      err.name === "PrismaClientInitializationError" ||
      err.name === "PrismaClientRustPanicError"
    ) {
      return NextResponse.json(
        {
          error: "Database service temporarily unavailable",
          code: "DATABASE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal errors in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred";

    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    { error: "An unexpected error occurred", code: "UNKNOWN_ERROR" },
    { status: 500 }
  );
}

/**
 * Validation helper to throw ApiError for invalid inputs
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): asserts value is NonNullable<typeof value> {
  if (value === null || value === undefined || value === "") {
    throw new ApiError(400, `${fieldName} is required`, "REQUIRED_FIELD_MISSING");
  }
}

/**
 * Validation helper for pagination parameters
 */
export function validatePagination(limit?: string, offset?: string) {
  const parsedLimit = parseInt(limit || "50");
  const parsedOffset = parseInt(offset || "0");

  if (isNaN(parsedLimit) || parsedLimit < 1) {
    throw new ApiError(400, "Invalid limit parameter", "INVALID_PAGINATION");
  }
  if (isNaN(parsedOffset) || parsedOffset < 0) {
    throw new ApiError(400, "Invalid offset parameter", "INVALID_PAGINATION");
  }

  // Enforce maximum limit to prevent abuse
  const safeLimit = Math.min(parsedLimit, 100);

  return { limit: safeLimit, offset: parsedOffset };
}

/**
 * Helper to handle session errors gracefully in API routes
 */
export function handleSessionError(context: string): NextResponse {
  console.error("[API Error] Session error", {
    context,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: "Your session has expired. Please sign in again.",
      code: "SESSION_EXPIRED",
    },
    { status: 401 }
  );
}
