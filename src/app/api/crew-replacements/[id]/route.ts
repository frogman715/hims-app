import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


type CrewReplacementStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface UpdateCrewReplacementPayload {
  status: CrewReplacementStatus;
  approvedBy?: string | null;
  notes?: string | null;
}

function isValidStatus(value: string): value is CrewReplacementStatus {
  return ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(value);
}

function normalizeOptionalString(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isUpdateCrewReplacementPayload(value: unknown): value is UpdateCrewReplacementPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<UpdateCrewReplacementPayload>;
  if (typeof payload.status !== "string" || !isValidStatus(payload.status)) {
    return false;
  }

  if (
    payload.approvedBy !== undefined &&
    payload.approvedBy !== null &&
    typeof payload.approvedBy !== "string"
  ) {
    return false;
  }

  if (
    payload.notes !== undefined &&
    payload.notes !== null &&
    typeof payload.notes !== "string"
  ) {
    return false;
  }

  return true;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const parsedBody = (await request.json()) as unknown;

    if (!isUpdateCrewReplacementPayload(parsedBody)) {
      return NextResponse.json({ error: "Invalid crew replacement payload" }, { status: 400 });
    }

    const status = parsedBody.status;
    const approvedBy = normalizeOptionalString(parsedBody.approvedBy ?? null);
    const notes = normalizeOptionalString(parsedBody.notes ?? null);

    const updateData: Record<string, unknown> = {
      status,
      remarks: notes,
      updatedAt: new Date(),
    };

    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
      updateData.approver = approvedBy
        ? { connect: { id: approvedBy } }
        : { disconnect: true };
    } else {
      updateData.approvedAt = null;
      updateData.approver = { disconnect: true };
    }

    const replacement = await prisma.crewReplacement.update({
      where: { id },
      data: updateData,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true
          }
        },
        replacementCrew: {
          select: {
            id: true,
            fullName: true,
            nationality: true
          }
        }
      },
    });

    // If approved, create prepare joining checklist
    if (status === "APPROVED") {
      // Note: PrepareJoining creation logic needs to be implemented
      // For now, just update the replacement status
    }

    return NextResponse.json(replacement);
  } catch (error) {
    console.error("Error updating crew replacement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}