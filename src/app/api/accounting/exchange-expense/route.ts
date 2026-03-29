import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/exchange-expense",
      "GET",
      "Insufficient permissions to view exchange expenses"
    );
    if (authError) return authError;

    const expenses = await prisma.exchangeExpense.findMany({
      orderBy: { expenseDate: "desc" },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
      },
    });

    return NextResponse.json({ data: expenses });
  } catch (error) {
    console.error("Error fetching exchange expenses:", error);
    return NextResponse.json({ error: "Failed to fetch exchange expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/exchange-expense",
      "POST",
      "Insufficient permissions to create exchange expenses"
    );
    if (authError) return authError;

    const body = (await request.json()) as Record<string, unknown>;
    const crewId = typeof body.crewId === "string" ? body.crewId.trim() : "";
    const amount =
      typeof body.amount === "number" ? body.amount : typeof body.amount === "string" ? Number(body.amount) : Number.NaN;
    const exchangeRate =
      typeof body.exchangeRate === "number"
        ? body.exchangeRate
        : typeof body.exchangeRate === "string"
          ? Number(body.exchangeRate)
          : Number.NaN;
    const currency =
      typeof body.currency === "string" && body.currency.trim().length > 0
        ? body.currency.trim().toUpperCase()
        : "USD";
    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : "";
    const expenseDate = new Date(String(body.expenseDate ?? ""));

    if (!crewId) {
      return NextResponse.json({ error: "Crew is required" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return NextResponse.json({ error: "Exchange rate must be greater than zero" }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (Number.isNaN(expenseDate.getTime())) {
      return NextResponse.json({ error: "Expense date is invalid" }, { status: 400 });
    }

    const expense = await prisma.exchangeExpense.create({
      data: {
        crewId,
        amount,
        currency,
        exchangeRate,
        idrAmount: amount * exchangeRate,
        expenseDate,
        description,
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
      },
    });

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating exchange expense:", error);
    return NextResponse.json({ error: "Failed to create exchange expense" }, { status: 500 });
  }
}
