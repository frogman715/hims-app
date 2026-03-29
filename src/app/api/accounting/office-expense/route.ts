import { NextRequest, NextResponse } from "next/server";
import { ExpenseType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

function parseOfficeExpensePayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return { error: "Invalid office expense payload" };
  }

  const body = payload as Record<string, unknown>;
  const type =
    typeof body.type === "string" && body.type.trim().length > 0
      ? body.type.trim().toUpperCase()
      : null;
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;
  const currency =
    typeof body.currency === "string" && body.currency.trim().length > 0
      ? body.currency.trim().toUpperCase()
      : "IDR";
  const amount =
    typeof body.amount === "number"
      ? body.amount
      : typeof body.amount === "string"
        ? Number(body.amount)
        : Number.NaN;
  const expenseDate =
    typeof body.date === "string" || typeof body.date === "number"
      ? new Date(body.date)
      : body.date instanceof Date
        ? body.date
        : new Date();
  const receiptUrl =
    typeof body.receiptUrl === "string" && body.receiptUrl.trim().length > 0
      ? body.receiptUrl.trim()
      : null;

  if (!type) {
    return { error: "Expense type is required" };
  }
  if (!Object.values(ExpenseType).includes(type as ExpenseType)) {
    return { error: "Invalid expense type" };
  }
  if (!description) {
    return { error: "Description is required" };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than zero" };
  }
  if (Number.isNaN(expenseDate.getTime())) {
    return { error: "Expense date is invalid" };
  }

  return {
    data: {
      expenseType: type as ExpenseType,
      description,
      amount,
      currency,
      expenseDate,
      receiptUrl,
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/office-expense",
      "GET",
      "Insufficient permissions to view office expenses"
    );
    if (authError) {
      return authError;
    }

    const expenses = await prisma.officeExpense.findMany({
      orderBy: { expenseDate: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching office expenses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/office-expense",
      "POST",
      "Insufficient permissions to create office expenses"
    );
    if (authError) {
      return authError;
    }

    const parsedPayload = parseOfficeExpensePayload(await req.json());
    if ("error" in parsedPayload) {
      return NextResponse.json({ error: parsedPayload.error }, { status: 400 });
    }
    const userId = session.user.id; // Get from session

    const expense = await prisma.officeExpense.create({
      data: {
        ...parsedPayload.data,
        user: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating office expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
