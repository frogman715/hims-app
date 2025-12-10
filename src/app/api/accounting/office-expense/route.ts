import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, accountingGuard, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check accounting permission
    if (!accountingGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check accounting permission for editing
    if (!checkPermission(session, 'accounting', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create office expenses" }, { status: 403 });
    }

    const data = await req.json();
    const userId = session.user.id; // Get from session

    const expense = await prisma.officeExpense.create({
      data: {
        expenseType: data.type,
        description: data.description,
        amount: data.amount,
        currency: data.currency || "IDR",
        expenseDate: data.date ? new Date(data.date) : new Date(),
        receiptUrl: data.receiptUrl,
        userId: userId
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