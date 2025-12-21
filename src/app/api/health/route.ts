import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Health Check Endpoint
 *
 * Production-grade health check for monitoring and load balancer verification.
 * - No authentication required (load balancers need public access)
 * - Exposes minimal safe data only (no secrets, no sensitive configs)
 * - Tests database connectivity to verify system health
 * - Used by Docker health checks, Kubernetes probes, monitoring services
 *
 * Response Codes:
 * - 200: System fully operational
 * - 503: Database unavailable (degraded state, still alive)
 * - 500: Unexpected error
 */
export async function GET() {
  const start = Date.now();

  try {
    // Database connectivity check
    // Uses a simple query that requires database access but minimal computation
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    // Success response - system is healthy
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        latencyMs: latency,
        // Production hint: This is production, not dev environment
        environment: process.env.NODE_ENV || "production",
      },
      {
        status: 200,
        // Cache health check for 10 seconds (prevents hammering on every check)
        headers: {
          "Cache-Control": "public, max-age=10, must-revalidate",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      }
    );
  } catch (error) {
    // Log the error internally (never expose error details to client)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[health] database-check-failed", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Service unavailable - database is down
    // Return 503 (Service Unavailable) to signal infrastructure to take corrective action
    return NextResponse.json(
      {
        status: "error",
        error: "SERVICE_UNAVAILABLE", // Generic error, never expose DB details
        timestamp: new Date().toISOString(),
        // Note: latencyMs intentionally omitted for failed checks
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      }
    );
  }
}
