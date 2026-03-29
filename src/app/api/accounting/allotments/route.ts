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
      "/api/accounting/allotments",
      "GET",
      "Insufficient permissions to view allotments"
    );
    if (authError) return authError;

    const contracts = await prisma.employmentContract.findMany({
      where: {
        contractKind: "SEA",
        homeAllotment: {
          not: null,
        },
      },
      orderBy: { createdAt: "desc" },
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

    const allotments = contracts.map((contract) => ({
      id: contract.id,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      amount: contract.homeAllotment ?? 0,
      currency: contract.currency,
      seafarer: {
        id: contract.crew.id,
        name: contract.crew.fullName,
        rank: contract.crew.rank,
      },
    }));

    return NextResponse.json(allotments);
  } catch (error) {
    console.error("Error fetching allotments:", error);
    return NextResponse.json({ error: "Failed to fetch allotments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/accounting/allotments",
      "POST",
      "Insufficient permissions to create allotments"
    );
    if (authError) return authError;

    const body = (await request.json()) as Record<string, unknown>;
    const crewId = typeof body.crewId === "string" ? body.crewId.trim() : "";
    const amount =
      typeof body.amount === "number" ? body.amount : typeof body.amount === "string" ? Number(body.amount) : Number.NaN;
    const contractId =
      typeof body.contractId === "string" && body.contractId.trim().length > 0
        ? body.contractId.trim()
        : null;

    if (!crewId) {
      return NextResponse.json({ error: "Crew is required" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const targetContract =
      contractId
        ? await prisma.employmentContract.findFirst({
            where: { id: contractId, crewId, contractKind: "SEA" },
          })
        : await prisma.employmentContract.findFirst({
            where: { crewId, contractKind: "SEA" },
            orderBy: { createdAt: "desc" },
          });

    if (!targetContract) {
      return NextResponse.json(
        { error: "No sea contract found for the selected crew" },
        { status: 404 }
      );
    }

    const updatedContract = await prisma.employmentContract.update({
      where: { id: targetContract.id },
      data: {
        homeAllotment: amount,
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

    return NextResponse.json(
      {
        id: updatedContract.id,
        contractId: updatedContract.id,
        contractNumber: updatedContract.contractNumber,
        amount: updatedContract.homeAllotment ?? 0,
        currency: updatedContract.currency,
        seafarer: {
          id: updatedContract.crew.id,
          name: updatedContract.crew.fullName,
          rank: updatedContract.crew.rank,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating allotment:", error);
    return NextResponse.json({ error: "Failed to create allotment" }, { status: 500 });
  }
}
