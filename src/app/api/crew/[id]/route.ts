import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessRedData, encrypt, decrypt } from "@/lib/crypto";
import { maskPassport } from "@/lib/masking";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

enum CrewStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  RETIRED = "RETIRED",
  DECEASED = "DECEASED",
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withPermission<RouteContext>(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async (_req: NextRequest, session, { params }) => {
  try {
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
);

export const PATCH = withPermission<RouteContext>(
  "crew",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest, session, { params }) => {
    try {
      const { id } = await params;
      const data = await req.json();

      const updateData: Record<string, unknown> = {};

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
        if (
          typeof data.status === "string" &&
          Object.values(CrewStatus).includes(data.status as CrewStatus)
        ) {
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
);

export const DELETE = withPermission<RouteContext>(
  "crew",
  PermissionLevel.FULL_ACCESS,
  async (_req: NextRequest, _session, { params }) => {
    try {
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
);