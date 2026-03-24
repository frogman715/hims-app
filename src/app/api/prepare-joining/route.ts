import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { prepareJoiningCreateSchema } from "@/lib/prepare-joining-schemas";
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
    const authError = ensureOfficeApiPathAccess(session, "/api/prepare-joining", "GET");
    if (authError) {
      console.error("[prepare-joining GET] Permission denied");
      return authError;
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

    const prepareJoiningsWithCompliance = await Promise.all(
      prepareJoinings.map(async (prepareJoining) => {
        const compliance = await getPrepareJoiningComplianceSnapshot(prepareJoining.id);
        return mapPrepareJoiningWithChecklistSummary(prepareJoining, compliance ?? undefined);
      })
    );

    return NextResponse.json({
      data: prepareJoiningsWithCompliance,
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
    const authError = ensureOfficeApiPathAccess(session, "/api/prepare-joining", "POST");
    if (authError) return authError;

    const parsedBody = prepareJoiningCreateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid prepare joining payload", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
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

    if (status === "READY" || status === "DISPATCHED") {
      return NextResponse.json(
        {
          error:
            "Create prepare joining in a working status first. Assign the principal and complete required principal forms before READY or DISPATCHED.",
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

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "PREPARE_JOINING_CREATED",
        entityType: "PrepareJoining",
        entityId: prepareJoining.id,
        metadataJson: {
          crewId,
          principalId,
          vesselId,
          status: prepareJoining.status,
        },
      },
    });

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
