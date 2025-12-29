import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// This endpoint seeds test users - only accessible with correct secret key
export async function POST(request: Request) {
  try {
    // Security: Only allow in development or with proper secret key
    const isProduction = process.env.NODE_ENV === "production";
    const authHeader = request.headers.get("authorization");
    const secretKey = process.env.SEED_SECRET_KEY;
    
    if (isProduction && !secretKey) {
      return NextResponse.json(
        { error: "Seed endpoint not available in production without SEED_SECRET_KEY" },
        { status: 403 }
      );
    }
    
    if (isProduction && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: "Unauthorized - invalid or missing authorization header" },
        { status: 401 }
      );
    }

    const users = [
      {
        name: "Rinaldy (Director)",
        email: "rinaldy@hanmarine.co",
        password: "director2025",
        role: "DIRECTOR" as const,
        isSystemAdmin: true,
      },
      {
        name: "Arief",
        email: "arief@hanmarine.co",
        password: "admin2025",
        role: "DIRECTOR" as const,
        isSystemAdmin: false,
      },
      {
        name: "Dino (Accounting)",
        email: "dino@hanmarine.co",
        password: "accounting2025",
        role: "ACCOUNTING" as const,
        isSystemAdmin: false,
      },
      {
        name: "CDMO",
        email: "cdmo@hanmarine.co",
        password: "cdmo123",
        role: "CDMO" as const,
        isSystemAdmin: false,
      },
      {
        name: "Operational Manager",
        email: "operational@hanmarine.co",
        password: "operational123",
        role: "OPERATIONAL" as const,
        isSystemAdmin: false,
      },
      {
        name: "HR Officer",
        email: "hr@hanmarine.co",
        password: "hr123",
        role: "HR" as const,
        isSystemAdmin: false,
      },
      {
        name: "Crew Portal",
        email: "crew@hanmarine.co",
        password: "crew2025",
        role: "CREW_PORTAL" as const,
        isSystemAdmin: false,
      },
    ];

    const results = [];

    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);

      const result = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          role: u.role,
          isSystemAdmin: u.isSystemAdmin,
          isActive: true,
          password: hashed,
        },
        create: {
          name: u.name,
          email: u.email,
          role: u.role,
          isSystemAdmin: u.isSystemAdmin,
          isActive: true,
          password: hashed,
        },
      });

      results.push({
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role,
        created: result.id,
      });
    }

    return NextResponse.json(
      {
        message: "Users seeded successfully",
        users: results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        error: "Failed to seed users",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
