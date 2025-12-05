import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
 * Centralized error handler for API routes
 * Provides consistent error responses and logging
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for monitoring (in production, send to logging service)
  console.error("[API Error]", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

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

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
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

  // Handle validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: "Invalid data provided", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
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
