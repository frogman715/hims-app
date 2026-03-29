import { NextRequest, NextResponse } from "next/server";
import { LeaveType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

function daysBetween(startDate: Date, endDate: Date) {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/leave-pay",
      "GET",
      "Insufficient permissions to view leave pay records"
    );
    if (authError) return authError;

    const leavePays = await prisma.leavePay.findMany({
      orderBy: { createdAt: "desc" },
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
          },
        },
      },
    });

    return NextResponse.json({ data: leavePays });
  } catch (error) {
    console.error("Error fetching leave pay records:", error);
    return NextResponse.json({ error: "Failed to fetch leave pay records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/leave-pay",
      "POST",
      "Insufficient permissions to create leave pay records"
    );
    if (authError) return authError;

    const body = (await request.json()) as Record<string, unknown>;
    const crewId = typeof body.crewId === "string" ? body.crewId.trim() : "";
    const contractId =
      typeof body.contractId === "string" && body.contractId.trim().length > 0
        ? body.contractId.trim()
        : null;
    const amount =
      typeof body.amount === "number" ? body.amount : typeof body.amount === "string" ? Number(body.amount) : Number.NaN;
    const currency =
      typeof body.currency === "string" && body.currency.trim().length > 0
        ? body.currency.trim().toUpperCase()
        : "USD";
    const leaveType =
      typeof body.leaveType === "string" && body.leaveType.trim().length > 0
        ? body.leaveType.trim().toUpperCase()
        : "ANNUAL";
    const startDate = new Date(String(body.startDate ?? ""));
    const endDate = new Date(String(body.endDate ?? ""));
    const remarks =
      typeof body.remarks === "string" && body.remarks.trim().length > 0
        ? body.remarks.trim()
        : null;

    if (!crewId) {
      return NextResponse.json({ error: "Crew is required" }, { status: 400 });
    }
    if (!Object.values(LeaveType).includes(leaveType as LeaveType)) {
      return NextResponse.json({ error: "Leave type is invalid" }, { status: 400 });
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const leavePay = await prisma.leavePay.create({
      data: {
        crewId,
        contractId,
        leaveType,
        startDate,
        endDate,
        days: daysBetween(startDate, endDate),
        amount,
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
          },
        },
      },
    });

    return NextResponse.json({ data: leavePay }, { status: 201 });
  } catch (error) {
    console.error("Error creating leave pay record:", error);
    return NextResponse.json({ error: "Failed to create leave pay record" }, { status: 500 });
  }
}
