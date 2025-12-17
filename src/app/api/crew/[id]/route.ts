import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessRedData, encrypt, decrypt } from "@/lib/crypto";
import { maskPassport } from "@/lib/masking";
import { Prisma, CrewStatus } from "@prisma/client";

interface Params {
  id: string;
}

interface Params {
  id: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const crew = await prisma.crew.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            docType: true,
            docNumber: true,
            issueDate: true,
            expiryDate: true,
            remarks: true,
            fileUrl: true
          }
        },
        documentReceivings: true,
        medicalChecks: true,
        visaApplications: true,
        contracts: {
          where: { contractKind: "SEA" },
          orderBy: { createdAt: "desc" },
          take: 1
        },
        dispatches: true,
        salaries: true,
        leavePays: true,
        exchangeExpenses: true
      }
    });

    if (!crew) {
      return NextResponse.json(
        { error: "Crew not found" },
        { status: 404 }
      );
    }

    // Handle passport number based on RED access
    const userRoles = session.user.roles || [];
    const hasRedAccess = canAccessRedData(userRoles, 'identity');

    const processedCrew = { ...crew };

    if (crew.passportNumber) {
      if (hasRedAccess) {
        try {
          // Decrypt for users with RED access
          processedCrew.passportNumber = decrypt(crew.passportNumber);
        } catch {
          // If decryption fails, show masked version
          processedCrew.passportNumber = maskPassport(crew.passportNumber);
        }
      } else {
        // Mask for users without RED access
        processedCrew.passportNumber = maskPassport(crew.passportNumber);
      }
    }

    return NextResponse.json(processedCrew);
  } catch (error) {
    console.error("Error fetching crew:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const updateData: Prisma.CrewUpdateInput = {};

    if (typeof data.fullName === "string" && data.fullName.trim()) {
      updateData.fullName = data.fullName.trim();
    }

    if (typeof data.rank === "string" && data.rank.trim()) {
      updateData.rank = data.rank.trim();
    }

    if (typeof data.phone === "string") {
      updateData.phone = data.phone.trim();
    }

    if (typeof data.email === "string") {
      updateData.email = data.email.trim();
    }

    if (data.status !== undefined) {
      if (typeof data.status === "string" && Object.values(CrewStatus).includes(data.status as CrewStatus)) {
        updateData.status = data.status as CrewStatus;
      }
    }

    if (data.passportNumber !== undefined) {
      updateData.passportNumber = data.passportNumber
        ? encrypt(String(data.passportNumber))
        : null;
    }

    const crew = await prisma.crew.update({
      where: { id },
      data: updateData
    });

    // Return the crew with decrypted passport for the response
    const userRoles = session.user.roles || [];
    const hasRedAccess = canAccessRedData(userRoles, 'identity');

    const responseCrew = { ...crew };
    if (crew.passportNumber && hasRedAccess) {
      try {
        responseCrew.passportNumber = decrypt(crew.passportNumber);
      } catch {
        responseCrew.passportNumber = maskPassport(crew.passportNumber);
      }
    } else if (crew.passportNumber) {
      responseCrew.passportNumber = maskPassport(crew.passportNumber);
    }

    return NextResponse.json(responseCrew);
  } catch (error) {
    console.error("Error updating crew:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    await requireRole(req, ["DIRECTOR", "CDMO"]);

    const { id } = await params;

    await prisma.crew.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Crew deleted successfully" });
  } catch (error) {
    console.error("Error deleting crew:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}