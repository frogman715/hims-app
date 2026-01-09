import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

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
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Structured error logging interface
 */
interface ErrorLog {
  requestId?: string;
  timestamp: string;
  error: string;
  statusCode?: number;
  code?: string;
  stack?: string;
  details?: unknown;
  userId?: string;
  path?: string;
}

/**
 * Log error with structured format for monitoring
 */
function logError(logEntry: ErrorLog): void {
  const logLevel = (logEntry.statusCode || 500) >= 500 ? "ERROR" : "WARN";
  
  // In production, send to external logging service (e.g., Datadog, Sentry)
  if (process.env.NODE_ENV === "production") {
    console.error(JSON.stringify({
      level: logLevel,
      ...logEntry
    }));
    
    // TODO: Integrate with external monitoring service
    // Example: Sentry.captureException(error, { extra: logEntry });
  } else {
    // Development: Pretty print for readability
    console.error(`[${logLevel}] ${logEntry.timestamp}`);
    console.error(`Request ID: ${logEntry.requestId || 'N/A'}`);
    console.error(`Error: ${logEntry.error}`);
    if (logEntry.stack) {
      console.error(`Stack: ${logEntry.stack}`);
    }
    if (logEntry.details) {
      console.error(`Details:`, logEntry.details);
    }
  }
}

/**
 * Centralized error handler for API routes
 * Provides consistent error responses and logging
 */
export function handleApiError(
  error: unknown,
  requestId?: string,
  context?: { userId?: string; path?: string }
): NextResponse {
  const errorLog: ErrorLog = {
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId: context?.userId,
    path: context?.path,
  };

  // Handle custom ApiError
  if (error instanceof ApiError) {
    errorLog.statusCode = error.statusCode;
    errorLog.code = error.code;
    errorLog.details = error.details;
    
    logError(errorLog);
    
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: errorLog.requestId,
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
      errorLog.code = code;
      
      let statusCode = 500;
      let message = "Database operation failed";
      let errorCode = "DATABASE_ERROR";
      
      switch (code) {
        case "P2002":
          statusCode = 409;
          message = "A record with this value already exists";
          errorCode = "DUPLICATE_ENTRY";
          break;
        case "P2025":
          statusCode = 404;
          message = "Record not found";
          errorCode = "NOT_FOUND";
          break;
        case "P2003":
          statusCode = 400;
          message = "Related record not found";
          errorCode = "FOREIGN_KEY_VIOLATION";
          break;
        case "P2001":
          statusCode = 404;
          message = "Record not found for the given condition";
          errorCode = "NOT_FOUND";
          break;
        case "P2014":
          statusCode = 400;
          message = "Invalid relationship constraint";
          errorCode = "RELATION_VIOLATION";
          break;
      }
      
      errorLog.statusCode = statusCode;
      errorLog.code = errorCode;
      logError(errorLog);
      
      return NextResponse.json(
        { 
          error: message, 
          code: errorCode,
          requestId: errorLog.requestId,
          ...(process.env.NODE_ENV === "development" && { prismaCode: code })
        },
        { status: statusCode }
      );
    }
    
    // Check for validation errors by error name
    if (err.name === "PrismaClientValidationError") {
      errorLog.statusCode = 400;
      errorLog.code = "VALIDATION_ERROR";
      logError(errorLog);
      
      return NextResponse.json(
        { 
          error: "Invalid data provided", 
          code: "VALIDATION_ERROR",
          requestId: errorLog.requestId 
        },
        { status: 400 }
      );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    errorLog.statusCode = 500;
    errorLog.code = "INTERNAL_ERROR";
    logError(errorLog);
    
    // Don't expose internal errors in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred";

    return NextResponse.json(
      { 
        error: message, 
        code: "INTERNAL_ERROR",
        requestId: errorLog.requestId 
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  errorLog.statusCode = 500;
  errorLog.code = "UNKNOWN_ERROR";
  logError(errorLog);
  
  return NextResponse.json(
    { 
      error: "An unexpected error occurred", 
      code: "UNKNOWN_ERROR",
      requestId: errorLog.requestId 
    },
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
 * Validation helper for email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
    .trim();
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize(
  input: unknown,
  fieldName: string,
  maxLength = 1000
): string {
  validateRequired(input, fieldName);
  
  if (typeof input !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`, "INVALID_TYPE");
  }
  
  if (input.length > maxLength) {
    throw new ApiError(
      400,
      `${fieldName} exceeds maximum length of ${maxLength}`,
      "INPUT_TOO_LONG"
    );
  }
  
  return sanitizeString(input);
}
