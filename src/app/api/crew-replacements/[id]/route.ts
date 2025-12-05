import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, approvedBy, notes } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updateData: any = {
      status,
      notes,
      updatedAt: new Date()
    };

    if (status === 'APPROVED' && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
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
    if (status === 'APPROVED') {
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