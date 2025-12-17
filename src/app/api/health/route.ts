import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return NextResponse.json({
      status: "ok",
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] database-check-failed", error);
    return NextResponse.json(
      {
        status: "error",
        error: "DATABASE_UNREACHABLE",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
