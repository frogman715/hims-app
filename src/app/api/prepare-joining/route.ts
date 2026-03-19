import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import {
  ensurePrepareJoiningPrincipalForms,
  getPrepareJoiningComplianceSnapshot,
} from "@/lib/prepare-joining-enforcement";

// Use Prisma enum instead of local enum
type PrepareJoiningStatus = "PENDING" | "DOCUMENTS" | "MEDICAL" | "TRAINING" | "TRAVEL" | "READY" | "DISPATCHED" | "CANCELLED";

const prepareJoiningStatuses = new Set<PrepareJoiningStatus>([
  "PENDING",
  "DOCUMENTS",
  "MEDICAL",
  "TRAINING",
  "TRAVEL",
  "READY",
  "DISPATCHED",
  "CANCELLED",
]);

function mapPrepareJoiningWithChecklistSummary<
  T extends {
    id: string;
    forms?: Array<{ templateId: string; status: string }>;
    principal?: {
      formTemplates?: Array<{ id: string; isRequired: boolean }>;
    } | null;
  },
>(prepareJoining: T, compliance?: { blockers: string[]; approvedRequiredCount: number; requiredTemplateCount: number }) {
  const requiredTemplateIds = new Set(
    (prepareJoining.principal?.formTemplates ?? [])
      .filter((template) => template.isRequired)
      .map((template) => template.id)
  );

  const forms = prepareJoining.forms ?? [];
  const approvedRequiredCount = forms.filter(
    (form) => requiredTemplateIds.has(form.templateId) && form.status === "APPROVED"
  ).length;
  const requiredTemplateCount = requiredTemplateIds.size;

  return {
    ...prepareJoining,
    principalChecklistSummary: {
      requiredTemplateCount: compliance?.requiredTemplateCount ?? requiredTemplateCount,
      approvedRequiredCount: compliance?.approvedRequiredCount ?? approvedRequiredCount,
      missingRequiredCount: Math.max(
        (compliance?.requiredTemplateCount ?? requiredTemplateCount) -
          (compliance?.approvedRequiredCount ?? approvedRequiredCount),
        0
      ),
      blockers: compliance?.blockers ?? [],
    },
  };
}

// GET /api/prepare-joining - List all prepare joining records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("[prepare-joining GET] No session found");
      return NextResponse.json(
        { error: "Unauthorized - no session" },
        { status: 401 }
      );
    }

    if (!checkPermission(session, "crewing", PermissionLevel.VIEW_ACCESS)) {
      console.error("[prepare-joining GET] Permission denied for user:", session.user?.email);
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const crewId = searchParams.get("crewId");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      const normalizedStatus = status.trim();
      if (
        !normalizedStatus ||
        !prepareJoiningStatuses.has(normalizedStatus as PrepareJoiningStatus)
      ) {
        return NextResponse.json(
          { error: "Invalid status filter" },
          { status: 400 }
        );
      }

      where.status = normalizedStatus as PrepareJoiningStatus;
    }
    if (crewId) {
      where.crewId = crewId;
    }

    const prepareJoinings = await prisma.prepareJoining.findMany({
      where,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            nationality: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        principal: {
          select: {
            id: true,
            name: true,
            formTemplates: {
              where: { isRequired: true },
              select: { id: true, isRequired: true },
            },
          },
        },
        forms: {
          select: {
            templateId: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`[prepare-joining GET] Retrieved ${prepareJoinings.length} records`);

    return NextResponse.json({
      data: prepareJoinings.map((prepareJoining) => mapPrepareJoiningWithChecklistSummary(prepareJoining)),
      total: prepareJoinings.length,
    });
  } catch (error) {
    console.error("[prepare-joining API] Error fetching prepare joinings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[prepare-joining API] Full error:", JSON.stringify(error));
    return NextResponse.json(
      { error: `Failed to fetch prepare joinings: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST /api/prepare-joining - Create new prepare joining record
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crewing", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      crewId,
      vesselId,
      principalId,
      status = "PENDING",
      passportValid = false,
      seamanBookValid = false,
      certificatesValid = false,
      medicalValid = false,
      visaValid = false,
      orientationCompleted = false,
      ticketBooked = false,
      hotelBooked = false,
      transportArranged = false,
      medicalCheckDate,
      medicalExpiry,
      orientationDate,
      departureDate,
      departurePort,
      arrivalPort,
      flightNumber,
      hotelName,
      remarks,
    } = body;

    if (!crewId) {
      return NextResponse.json(
        { error: "Crew ID is required" },
        { status: 400 }
      );
    }

    // Check if crew exists
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
    });

    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    if (
      (status === "READY" || status === "DISPATCHED") &&
      principalId
    ) {
      return NextResponse.json(
        {
          error:
            "Create prepare joining in a working status first. Required principal forms must be generated and approved before READY or DISPATCHED.",
        },
        { status: 400 }
      );
    }

    // Create prepare joining record
    const prepareJoining = await prisma.prepareJoining.create({
      data: {
        crewId,
        vesselId,
        principalId,
        status,
        passportValid,
        seamanBookValid,
        certificatesValid,
        medicalValid,
        visaValid,
        orientationCompleted,
        ticketBooked,
        hotelBooked,
        transportArranged,
        medicalCheckDate: medicalCheckDate ? new Date(medicalCheckDate) : null,
        medicalExpiry: medicalExpiry ? new Date(medicalExpiry) : null,
        orientationDate: orientationDate ? new Date(orientationDate) : null,
        departureDate: departureDate ? new Date(departureDate) : null,
        departurePort,
        arrivalPort,
        flightNumber,
        hotelName,
        remarks,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            nationality: true,
            phone: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        principal: {
          select: {
            id: true,
            name: true,
            formTemplates: {
              where: { isRequired: true },
              select: { id: true, isRequired: true },
            },
          },
        },
        forms: {
          select: {
            templateId: true,
            status: true,
          },
        },
      },
    });

    if (principalId) {
      await ensurePrepareJoiningPrincipalForms(prepareJoining.id, principalId);
    }

    const compliance = await getPrepareJoiningComplianceSnapshot(prepareJoining.id);

    return NextResponse.json(
      mapPrepareJoiningWithChecklistSummary(prepareJoining, compliance ?? undefined),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating prepare joining:", error);
    return NextResponse.json(
      { error: "Failed to create prepare joining" },
      { status: 500 }
    );
  }
}
