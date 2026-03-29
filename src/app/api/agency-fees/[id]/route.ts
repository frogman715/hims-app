import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/agency-fees",
      "GET",
      "Insufficient permissions to view agency fees"
    );
    if (authError) {
      return authError;
    }

    const { id } = await params;
    const fee = await prisma.agencyFee.findUnique({
      where: {
        id: id,
      },
      include: {
        principal: {
          select: {
            name: true,
          },
        },
        contract: {
          select: {
            contractNumber: true,
          },
        },
      },
    });

    if (!fee) {
      return NextResponse.json(
        { error: 'Agency fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Error fetching agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency fee' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/agency-fees",
      "PUT",
      "Insufficient permissions to update agency fees"
    );
    if (authError) {
      return authError;
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const status =
      typeof body.status === "string" && body.status.trim().length > 0
        ? body.status.trim().toUpperCase()
        : null;
    const dueDate =
      typeof body.dueDate === "string" || typeof body.dueDate === "number"
        ? new Date(body.dueDate)
        : body.dueDate instanceof Date
          ? body.dueDate
          : null;
    const paidDate =
      body.paidDate === null || body.paidDate === undefined || body.paidDate === ""
        ? null
        : typeof body.paidDate === "string" || typeof body.paidDate === "number"
          ? new Date(body.paidDate)
          : body.paidDate instanceof Date
            ? body.paidDate
            : null;
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.amount === "string"
          ? Number(body.amount)
          : Number.NaN;
    const percentage =
      body.percentage === null || body.percentage === undefined || body.percentage === ""
        ? null
        : typeof body.percentage === "number"
          ? body.percentage
          : typeof body.percentage === "string"
            ? Number(body.percentage)
            : Number.NaN;

    if (typeof body.principalId !== "string" || body.principalId.trim().length === 0) {
      return NextResponse.json({ error: "Principal is required" }, { status: 400 });
    }
    if (typeof body.feeType !== "string" || body.feeType.trim().length === 0) {
      return NextResponse.json({ error: "Fee type is required" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }
    if (percentage !== null && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) {
      return NextResponse.json({ error: "Percentage must be between 0 and 100" }, { status: 400 });
    }
    if (!dueDate || Number.isNaN(dueDate.getTime())) {
      return NextResponse.json({ error: "Valid due date is required" }, { status: 400 });
    }
    if (paidDate && Number.isNaN(paidDate.getTime())) {
      return NextResponse.json({ error: "Paid date is invalid" }, { status: 400 });
    }
    if (status && !["PENDING", "PAID", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid agency fee status" }, { status: 400 });
    }
    if (status === "PAID" && !paidDate) {
      return NextResponse.json({ error: "Paid date is required when status is PAID" }, { status: 400 });
    }

    const fee = await prisma.agencyFee.update({
      where: {
        id: id,
      },
      data: {
        principalId: body.principalId.trim(),
        contractId: typeof body.contractId === "string" && body.contractId.trim().length > 0 ? body.contractId.trim() : null,
        feeType: body.feeType.trim().toUpperCase(),
        amount,
        currency: typeof body.currency === "string" && body.currency.trim().length > 0 ? body.currency.trim().toUpperCase() : "USD",
        percentage,
        description: typeof body.description === "string" && body.description.trim().length > 0 ? body.description.trim() : null,
        dueDate,
        paidDate,
        status: status ?? undefined,
        remarks: typeof body.remarks === "string" && body.remarks.trim().length > 0 ? body.remarks.trim() : null,
      },
      include: {
        principal: {
          select: {
            name: true,
          },
        },
        contract: {
          select: {
            contractNumber: true,
          },
        },
      },
    });

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Error updating agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to update agency fee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/agency-fees",
      "DELETE",
      "Insufficient permissions to delete agency fees"
    );
    if (authError) {
      return authError;
    }

    const { id } = await params;
    await prisma.agencyFee.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Agency fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to delete agency fee' },
      { status: 500 }
    );
  }
}
