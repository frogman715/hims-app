import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessRedData, encrypt, decrypt } from "@/lib/crypto";
import { maskPassport } from "@/lib/masking";

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

    // Prepare update data
    const updateData: {
      fullName?: string;
      rank?: string;
      phone?: string;
      email?: string;
      status?: string;
      passportNumber?: string;
    } = {
      fullName: data.fullName,
      rank: data.rank,
      phone: data.phone,
      email: data.email,
      status: data.status
    };

    // Encrypt passport number if provided
    if (data.passportNumber !== undefined) {
      if (data.passportNumber) {
        updateData.passportNumber = encrypt(data.passportNumber);
      } else {
        updateData.passportNumber = null;
      }
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