import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/wages",
      "GET",
      "Insufficient permissions to view wage records"
    );
    if (authError) return authError;

    const wages = await prisma.crewSalary.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            vessel: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(wages);
  } catch (error) {
    console.error("Error fetching wage records:", error);
    return NextResponse.json({ error: "Failed to fetch wage records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/wages",
      "POST",
      "Insufficient permissions to create wage records"
    );
    if (authError) return authError;

    const body = (await request.json()) as Record<string, unknown>;
    const crewId = typeof body.crewId === "string" ? body.crewId.trim() : "";
    const contractId =
      typeof body.contractId === "string" && body.contractId.trim().length > 0
        ? body.contractId.trim()
        : null;
    const month = Math.trunc(toNumber(body.month));
    const year = Math.trunc(toNumber(body.year));
    const basicWage = toNumber(body.basicWage);
    const overtime = toNumber(body.overtime);
    const allowances = toNumber(body.allowances);
    const deductions = toNumber(body.deductions);
    const currency =
      typeof body.currency === "string" && body.currency.trim().length > 0
        ? body.currency.trim().toUpperCase()
        : "USD";
    const remarks =
      typeof body.remarks === "string" && body.remarks.trim().length > 0
        ? body.remarks.trim()
        : null;

    if (!crewId) {
      return NextResponse.json({ error: "Crew is required" }, { status: 400 });
    }
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12" }, { status: 400 });
    }
    if (year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Year is invalid" }, { status: 400 });
    }
    if (basicWage <= 0) {
      return NextResponse.json({ error: "Basic wage must be greater than zero" }, { status: 400 });
    }

    const totalAmount = basicWage + overtime + allowances - deductions;

    const wage = await prisma.crewSalary.create({
      data: {
        crewId,
        contractId,
        month,
        year,
        basicWage,
        overtime,
        allowances,
        deductions,
        totalAmount,
        currency,
        remarks,
        status: "PENDING",
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            vessel: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(wage, { status: 201 });
  } catch (error) {
    console.error("Error creating wage record:", error);
    return NextResponse.json({ error: "Failed to create wage record" }, { status: 500 });
  }
}
