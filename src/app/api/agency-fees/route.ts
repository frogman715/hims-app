import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

const ALLOWED_FEE_STATUSES = new Set(["PENDING", "PAID", "CANCELLED"]);

function parseAgencyFeePayload(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid agency fee payload" };
  }

  const payload = body as Record<string, unknown>;
  const principalId =
    typeof payload.principalId === "string" && payload.principalId.trim().length > 0
      ? payload.principalId.trim()
      : null;
  const contractId =
    typeof payload.contractId === "string" && payload.contractId.trim().length > 0
      ? payload.contractId.trim()
      : null;
  const feeType =
    typeof payload.feeType === "string" && payload.feeType.trim().length > 0
      ? payload.feeType.trim().toUpperCase()
      : null;
  const currency =
    typeof payload.currency === "string" && payload.currency.trim().length > 0
      ? payload.currency.trim().toUpperCase()
      : "USD";
  const description =
    typeof payload.description === "string" && payload.description.trim().length > 0
      ? payload.description.trim()
      : null;
  const remarks =
    typeof payload.remarks === "string" && payload.remarks.trim().length > 0
      ? payload.remarks.trim()
      : null;
  const status =
    typeof payload.status === "string" && payload.status.trim().length > 0
      ? payload.status.trim().toUpperCase()
      : "PENDING";
  const amount =
    typeof payload.amount === "number"
      ? payload.amount
      : typeof payload.amount === "string"
        ? Number(payload.amount)
        : Number.NaN;
  const percentage =
    payload.percentage === null || payload.percentage === undefined || payload.percentage === ""
      ? null
      : typeof payload.percentage === "number"
        ? payload.percentage
        : typeof payload.percentage === "string"
          ? Number(payload.percentage)
          : Number.NaN;
  const dueDateValue =
    payload.dueDate instanceof Date
      ? payload.dueDate
      : typeof payload.dueDate === "string" || typeof payload.dueDate === "number"
        ? new Date(payload.dueDate)
        : null;
  const paidDateValue =
    payload.paidDate === null || payload.paidDate === undefined || payload.paidDate === ""
      ? null
      : payload.paidDate instanceof Date
        ? payload.paidDate
        : typeof payload.paidDate === "string" || typeof payload.paidDate === "number"
          ? new Date(payload.paidDate)
          : null;

  if (!principalId) {
    return { error: "Principal is required" };
  }
  if (!feeType) {
    return { error: "Fee type is required" };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than zero" };
  }
  if (percentage !== null && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) {
    return { error: "Percentage must be between 0 and 100" };
  }
  if (!dueDateValue || Number.isNaN(dueDateValue.getTime())) {
    return { error: "Valid due date is required" };
  }
  if (paidDateValue && Number.isNaN(paidDateValue.getTime())) {
    return { error: "Paid date is invalid" };
  }
  if (!ALLOWED_FEE_STATUSES.has(status)) {
    return { error: "Invalid agency fee status" };
  }
  if (status === "PAID" && !paidDateValue) {
    return { error: "Paid date is required when status is PAID" };
  }
  if (paidDateValue && paidDateValue < dueDateValue && status === "PENDING") {
    return { error: "Pending fees cannot have a paid date" };
  }

  return {
    data: {
      principalId,
      contractId,
      feeType,
      amount,
      currency,
      percentage,
      description,
      dueDate: dueDateValue,
      paidDate: paidDateValue,
      status,
      remarks,
    },
  };
}

export async function GET() {
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

    const fees = await prisma.agencyFee.findMany({
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
      orderBy: {
        dueDate: 'desc',
      },
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Error fetching agency fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency fees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/agency-fees",
      "POST",
      "Insufficient permissions to create agency fees"
    );
    if (authError) {
      return authError;
    }
    const parsedPayload = parseAgencyFeePayload(await request.json());
    if ("error" in parsedPayload) {
      return NextResponse.json({ error: parsedPayload.error }, { status: 400 });
    }

    const fee = await prisma.agencyFee.create({
      data: parsedPayload.data,
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

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error('Error creating agency fee:', error);
    return NextResponse.json(
      { error: 'Failed to create agency fee' },
      { status: 500 }
    );
  }
}
