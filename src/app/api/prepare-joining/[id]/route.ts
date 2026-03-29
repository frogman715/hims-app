import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { prepareJoiningUpdateSchema } from "@/lib/prepare-joining-schemas";
import {
  assertPrepareJoiningStatusTransition,
  ensurePrepareJoiningPrincipalForms,
  getPrepareJoiningComplianceSnapshot,
} from "@/lib/prepare-joining-enforcement";

// Use Prisma enum instead of local enum
type PrepareJoiningStatus = "PENDING" | "DOCUMENTS" | "MEDICAL" | "TRAINING" | "TRAVEL" | "READY" | "DISPATCHED" | "CANCELLED";

const PREPARE_JOINING_STATUS_FLOW: PrepareJoiningStatus[] = [
  "PENDING",
  "DOCUMENTS",
  "MEDICAL",
  "TRAINING",
  "TRAVEL",
  "READY",
  "DISPATCHED",
];

function isAllowedPrepareJoiningStatusTransition(
  currentStatus: PrepareJoiningStatus,
  nextStatus: PrepareJoiningStatus
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === "CANCELLED") {
    return currentStatus !== "DISPATCHED";
  }

  if (currentStatus === "CANCELLED" || currentStatus === "DISPATCHED") {
    return false;
  }

  const currentIndex = PREPARE_JOINING_STATUS_FLOW.indexOf(currentStatus);
  const nextIndex = PREPARE_JOINING_STATUS_FLOW.indexOf(nextStatus);

  if (currentIndex === -1 || nextIndex === -1) {
    return false;
  }

  return Math.abs(nextIndex - currentIndex) <= 1;
}

type UpdatePrepareJoiningPayload = {
  status?: string;
  passportValid?: boolean;
  seamanBookValid?: boolean;
  certificatesValid?: boolean;
  medicalValid?: boolean;
  visaValid?: boolean;
  orientationCompleted?: boolean;
  ticketBooked?: boolean;
  hotelBooked?: boolean;
  transportArranged?: boolean;
  medicalCheckDate?: string | null;
  medicalExpiry?: string | null;
  orientationDate?: string | null;
  departureDate?: string | null;
  departurePort?: string | null;
  arrivalPort?: string | null;
  flightNumber?: string | null;
  hotelName?: string | null;
  remarks?: string | null;
  vesselId?: string | null;
  principalId?: string | null;
  
  // MCU
  mcuScheduled?: boolean;
  mcuScheduledDate?: string | null;
  mcuCompleted?: boolean;
  mcuCompletedDate?: string | null;
  mcuDoctorName?: string | null;
  mcuClinicName?: string | null;
  mcuResult?: string | null;
  mcuRestrictions?: string | null;
  mcuRemarks?: string | null;
  vaccineYellowFever?: boolean;
  vaccineHepatitisA?: boolean;
  vaccineHepatitisB?: boolean;
  vaccineTyphoid?: boolean;
  vaccineOther?: string | null;
  vaccineExpiryDate?: string | null;

  // Equipment
  safetyLifeJacket?: boolean;
  safetyHelmet?: boolean;
  safetyShoes?: boolean;
  safetyGloves?: boolean;
  safetyHarnessVest?: boolean;
  workUniform?: boolean;
  workIDCard?: boolean;
  workAccessCard?: boolean;
  workStationery?: boolean;
  workToolsProvided?: boolean;
  personalPassport?: boolean;
  personalVisa?: boolean;
  personalTickets?: boolean;
  personalVaccineCard?: boolean;
  personalMedicalCert?: boolean;
  vesselStatroomAssigned?: boolean;
  vesselStatroomNumber?: string | null;
  vesselContractSigned?: boolean;
  vesselBriefingScheduled?: boolean;
  vesselBriefingDate?: string | null;
  vesselOrientationDone?: boolean;
  vesselEmergencyDrill?: boolean;

  // Pre-Departure
  preDepartureDocCheck?: boolean;
  preDepartureEquipCheck?: boolean;
  preDepartureMedicalOK?: boolean;
  preDepartureEmergency?: boolean;
  preDepartureSalaryOK?: boolean;
  preDeparturePerDiem?: boolean;
  preDepartureFinalCheck?: boolean;
  preDepartureApprovedBy?: string | null;
  preDepartureApprovedAt?: string | null;
  preDepartureChecklistBy?: string | null;
};

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

function parseDateOrNull(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function parseStringOrNull(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

function mapComplianceSummary(compliance: Awaited<ReturnType<typeof getPrepareJoiningComplianceSnapshot>>) {
  return {
    requiredTemplateCount: compliance?.requiredTemplateCount ?? 0,
    approvedRequiredCount: compliance?.approvedRequiredCount ?? 0,
    missingRequiredCount:
      (compliance?.missingRequiredForms.length ?? 0) +
      (compliance?.pendingRequiredForms.length ?? 0),
    blockers: compliance?.blockers ?? [],
  };
}

// GET /api/prepare-joining/[id] - Get single prepare joining record
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/prepare-joining", "GET");
    if (authError) return authError;

    const prepareJoining = await prisma.prepareJoining.findUnique({
      where: { id },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            nationality: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            passportNumber: true,
            passportExpiry: true,
            seamanBookNumber: true,
            seamanBookExpiry: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
            type: true,
            imoNumber: true,
            flag: true,
          },
        },
        principal: {
          select: {
            id: true,
            name: true,
            country: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        forms: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            status: true,
            approvedAt: true,
            submittedAt: true,
            template: {
              select: {
                id: true,
                formName: true,
                formCategory: true,
                isRequired: true,
              },
            },
          },
        },
      },
    });

    if (!prepareJoining) {
      return NextResponse.json(
        { error: "Prepare joining not found" },
        { status: 404 }
      );
    }

    const compliance = await getPrepareJoiningComplianceSnapshot(id);

    return NextResponse.json({
      ...prepareJoining,
      principalChecklist: compliance?.checklist ?? [],
      principalChecklistSummary: mapComplianceSummary(compliance),
    });
  } catch (error) {
    console.error("Error fetching prepare joining:", error);
    return NextResponse.json(
      { error: "Failed to fetch prepare joining" },
      { status: 500 }
    );
  }
}

// PUT /api/prepare-joining/[id] - Update prepare joining record
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/prepare-joining", "PUT");
    if (authError) return authError;

    const parsedBody = prepareJoiningUpdateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid prepare joining payload", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data as UpdatePrepareJoiningPayload;
    const existingPrepareJoining = await prisma.prepareJoining.findUnique({
      where: { id },
      select: {
        id: true,
        principalId: true,
        status: true,
        passportValid: true,
        seamanBookValid: true,
        certificatesValid: true,
        medicalValid: true,
        visaValid: true,
        orientationCompleted: true,
        mcuCompleted: true,
        vesselContractSigned: true,
        ticketBooked: true,
        transportArranged: true,
        departureDate: true,
        departurePort: true,
        arrivalPort: true,
        preDepartureFinalCheck: true,
        remarks: true,
      },
    });

    if (!existingPrepareJoining) {
      return NextResponse.json(
        { error: "Prepare joining not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    let nextStatus = existingPrepareJoining.status;

    if (body.status !== undefined) {
      const normalizedStatus = body.status?.trim();
      if (
        !normalizedStatus ||
        !prepareJoiningStatuses.has(normalizedStatus as PrepareJoiningStatus)
      ) {
        return NextResponse.json(
          { error: "Invalid prepare joining status" },
          { status: 400 }
        );
      }
      updateData.status = normalizedStatus as PrepareJoiningStatus;
      nextStatus = normalizedStatus as PrepareJoiningStatus;

      if (
        !isAllowedPrepareJoiningStatusTransition(
          existingPrepareJoining.status as PrepareJoiningStatus,
          nextStatus
        )
      ) {
        return NextResponse.json(
          {
            error: `Prepare joining can only move step-by-step. Transition from ${existingPrepareJoining.status} to ${nextStatus} is blocked.`,
          },
          { status: 400 }
        );
      }
    }

    const passportValid = parseOptionalBoolean(body.passportValid);
    if (passportValid !== undefined) {
      updateData.passportValid = passportValid;
    }

    const seamanBookValid = parseOptionalBoolean(body.seamanBookValid);
    if (seamanBookValid !== undefined) {
      updateData.seamanBookValid = seamanBookValid;
    }

    const certificatesValid = parseOptionalBoolean(body.certificatesValid);
    if (certificatesValid !== undefined) {
      updateData.certificatesValid = certificatesValid;
    }

    const medicalValid = parseOptionalBoolean(body.medicalValid);
    if (medicalValid !== undefined) {
      updateData.medicalValid = medicalValid;
    }

    const visaValid = parseOptionalBoolean(body.visaValid);
    if (visaValid !== undefined) {
      updateData.visaValid = visaValid;
    }

    const orientationCompleted = parseOptionalBoolean(
      body.orientationCompleted
    );
    if (orientationCompleted !== undefined) {
      updateData.orientationCompleted = orientationCompleted;
    }

    const ticketBooked = parseOptionalBoolean(body.ticketBooked);
    if (ticketBooked !== undefined) {
      updateData.ticketBooked = ticketBooked;
    }

    const hotelBooked = parseOptionalBoolean(body.hotelBooked);
    if (hotelBooked !== undefined) {
      updateData.hotelBooked = hotelBooked;
    }

    const transportArranged = parseOptionalBoolean(body.transportArranged);
    if (transportArranged !== undefined) {
      updateData.transportArranged = transportArranged;
    }

    // MCU fields
    const mcuScheduled = parseOptionalBoolean(body.mcuScheduled);
    if (mcuScheduled !== undefined) {
      updateData.mcuScheduled = mcuScheduled;
    }

    const mcuCompleted = parseOptionalBoolean(body.mcuCompleted);
    if (mcuCompleted !== undefined) {
      updateData.mcuCompleted = mcuCompleted;
    }

    if (body.mcuScheduledDate !== undefined) {
      updateData.mcuScheduledDate = parseDateOrNull(body.mcuScheduledDate);
    }

    if (body.mcuCompletedDate !== undefined) {
      updateData.mcuCompletedDate = parseDateOrNull(body.mcuCompletedDate);
    }

    const mcuDoctorName = parseStringOrNull(body.mcuDoctorName);
    if (mcuDoctorName !== undefined) {
      updateData.mcuDoctorName = mcuDoctorName;
    }

    const mcuClinicName = parseStringOrNull(body.mcuClinicName);
    if (mcuClinicName !== undefined) {
      updateData.mcuClinicName = mcuClinicName;
    }

    const mcuResult = parseStringOrNull(body.mcuResult);
    if (mcuResult !== undefined) {
      updateData.mcuResult = mcuResult;
    }

    const mcuRestrictions = parseStringOrNull(body.mcuRestrictions);
    if (mcuRestrictions !== undefined) {
      updateData.mcuRestrictions = mcuRestrictions;
    }

    const mcuRemarks = parseStringOrNull(body.mcuRemarks);
    if (mcuRemarks !== undefined) {
      updateData.mcuRemarks = mcuRemarks;
    }

    // Vaccination fields
    const vaccineYellowFever = parseOptionalBoolean(body.vaccineYellowFever);
    if (vaccineYellowFever !== undefined) {
      updateData.vaccineYellowFever = vaccineYellowFever;
    }

    const vaccineHepatitisA = parseOptionalBoolean(body.vaccineHepatitisA);
    if (vaccineHepatitisA !== undefined) {
      updateData.vaccineHepatitisA = vaccineHepatitisA;
    }

    const vaccineHepatitisB = parseOptionalBoolean(body.vaccineHepatitisB);
    if (vaccineHepatitisB !== undefined) {
      updateData.vaccineHepatitisB = vaccineHepatitisB;
    }

    const vaccineTyphoid = parseOptionalBoolean(body.vaccineTyphoid);
    if (vaccineTyphoid !== undefined) {
      updateData.vaccineTyphoid = vaccineTyphoid;
    }

    const vaccineOther = parseStringOrNull(body.vaccineOther);
    if (vaccineOther !== undefined) {
      updateData.vaccineOther = vaccineOther;
    }

    if (body.vaccineExpiryDate !== undefined) {
      updateData.vaccineExpiryDate = parseDateOrNull(body.vaccineExpiryDate);
    }

    // Safety Equipment
    const safetyLifeJacket = parseOptionalBoolean(body.safetyLifeJacket);
    if (safetyLifeJacket !== undefined) {
      updateData.safetyLifeJacket = safetyLifeJacket;
    }

    const safetyHelmet = parseOptionalBoolean(body.safetyHelmet);
    if (safetyHelmet !== undefined) {
      updateData.safetyHelmet = safetyHelmet;
    }

    const safetyShoes = parseOptionalBoolean(body.safetyShoes);
    if (safetyShoes !== undefined) {
      updateData.safetyShoes = safetyShoes;
    }

    const safetyGloves = parseOptionalBoolean(body.safetyGloves);
    if (safetyGloves !== undefined) {
      updateData.safetyGloves = safetyGloves;
    }

    const safetyHarnessVest = parseOptionalBoolean(body.safetyHarnessVest);
    if (safetyHarnessVest !== undefined) {
      updateData.safetyHarnessVest = safetyHarnessVest;
    }

    // Work Equipment
    const workUniform = parseOptionalBoolean(body.workUniform);
    if (workUniform !== undefined) {
      updateData.workUniform = workUniform;
    }

    const workIDCard = parseOptionalBoolean(body.workIDCard);
    if (workIDCard !== undefined) {
      updateData.workIDCard = workIDCard;
    }

    const workAccessCard = parseOptionalBoolean(body.workAccessCard);
    if (workAccessCard !== undefined) {
      updateData.workAccessCard = workAccessCard;
    }

    const workStationery = parseOptionalBoolean(body.workStationery);
    if (workStationery !== undefined) {
      updateData.workStationery = workStationery;
    }

    const workToolsProvided = parseOptionalBoolean(body.workToolsProvided);
    if (workToolsProvided !== undefined) {
      updateData.workToolsProvided = workToolsProvided;
    }

    // Personal Items
    const personalPassport = parseOptionalBoolean(body.personalPassport);
    if (personalPassport !== undefined) {
      updateData.personalPassport = personalPassport;
    }

    const personalVisa = parseOptionalBoolean(body.personalVisa);
    if (personalVisa !== undefined) {
      updateData.personalVisa = personalVisa;
    }

    const personalTickets = parseOptionalBoolean(body.personalTickets);
    if (personalTickets !== undefined) {
      updateData.personalTickets = personalTickets;
    }

    const personalVaccineCard = parseOptionalBoolean(body.personalVaccineCard);
    if (personalVaccineCard !== undefined) {
      updateData.personalVaccineCard = personalVaccineCard;
    }

    const personalMedicalCert = parseOptionalBoolean(body.personalMedicalCert);
    if (personalMedicalCert !== undefined) {
      updateData.personalMedicalCert = personalMedicalCert;
    }

    // Vessel Pre-requisites
    const vesselStatroomAssigned = parseOptionalBoolean(body.vesselStatroomAssigned);
    if (vesselStatroomAssigned !== undefined) {
      updateData.vesselStatroomAssigned = vesselStatroomAssigned;
    }

    const vesselStatroomNumber = parseStringOrNull(body.vesselStatroomNumber);
    if (vesselStatroomNumber !== undefined) {
      updateData.vesselStatroomNumber = vesselStatroomNumber;
    }

    const vesselContractSigned = parseOptionalBoolean(body.vesselContractSigned);
    if (vesselContractSigned !== undefined) {
      updateData.vesselContractSigned = vesselContractSigned;
    }

    const vesselBriefingScheduled = parseOptionalBoolean(body.vesselBriefingScheduled);
    if (vesselBriefingScheduled !== undefined) {
      updateData.vesselBriefingScheduled = vesselBriefingScheduled;
    }

    if (body.vesselBriefingDate !== undefined) {
      updateData.vesselBriefingDate = parseDateOrNull(body.vesselBriefingDate);
    }

    const vesselOrientationDone = parseOptionalBoolean(body.vesselOrientationDone);
    if (vesselOrientationDone !== undefined) {
      updateData.vesselOrientationDone = vesselOrientationDone;
    }

    const vesselEmergencyDrill = parseOptionalBoolean(body.vesselEmergencyDrill);
    if (vesselEmergencyDrill !== undefined) {
      updateData.vesselEmergencyDrill = vesselEmergencyDrill;
    }

    // Pre-Departure Final Check
    const preDepartureDocCheck = parseOptionalBoolean(body.preDepartureDocCheck);
    if (preDepartureDocCheck !== undefined) {
      updateData.preDepartureDocCheck = preDepartureDocCheck;
    }

    const preDepartureEquipCheck = parseOptionalBoolean(body.preDepartureEquipCheck);
    if (preDepartureEquipCheck !== undefined) {
      updateData.preDepartureEquipCheck = preDepartureEquipCheck;
    }

    const preDepartureMedicalOK = parseOptionalBoolean(body.preDepartureMedicalOK);
    if (preDepartureMedicalOK !== undefined) {
      updateData.preDepartureMedicalOK = preDepartureMedicalOK;
    }

    const preDepartureEmergency = parseOptionalBoolean(body.preDepartureEmergency);
    if (preDepartureEmergency !== undefined) {
      updateData.preDepartureEmergency = preDepartureEmergency;
    }

    const preDepartureSalaryOK = parseOptionalBoolean(body.preDepartureSalaryOK);
    if (preDepartureSalaryOK !== undefined) {
      updateData.preDepartureSalaryOK = preDepartureSalaryOK;
    }

    const preDeparturePerDiem = parseOptionalBoolean(body.preDeparturePerDiem);
    if (preDeparturePerDiem !== undefined) {
      updateData.preDeparturePerDiem = preDeparturePerDiem;
    }

    const preDepartureFinalCheck = parseOptionalBoolean(body.preDepartureFinalCheck);
    if (preDepartureFinalCheck !== undefined) {
      updateData.preDepartureFinalCheck = preDepartureFinalCheck;
    }

    const preDepartureApprovedBy = parseStringOrNull(body.preDepartureApprovedBy);
    if (preDepartureApprovedBy !== undefined) {
      updateData.preDepartureApprovedBy = preDepartureApprovedBy;
    }

    if (body.preDepartureApprovedAt !== undefined) {
      updateData.preDepartureApprovedAt = parseDateOrNull(body.preDepartureApprovedAt);
    }

    const preDepartureChecklistBy = parseStringOrNull(body.preDepartureChecklistBy);
    if (preDepartureChecklistBy !== undefined) {
      updateData.preDepartureChecklistBy = preDepartureChecklistBy;
    }

    if (body.medicalCheckDate !== undefined) {
      updateData.medicalCheckDate = parseDateOrNull(body.medicalCheckDate);
    }

    if (body.medicalExpiry !== undefined) {
      updateData.medicalExpiry = parseDateOrNull(body.medicalExpiry);
    }

    if (body.orientationDate !== undefined) {
      updateData.orientationDate = parseDateOrNull(body.orientationDate);
    }

    if (body.departureDate !== undefined) {
      updateData.departureDate = parseDateOrNull(body.departureDate);
    }

    const departurePort = parseStringOrNull(body.departurePort);
    if (departurePort !== undefined) {
      updateData.departurePort = departurePort;
    }

    const arrivalPort = parseStringOrNull(body.arrivalPort);
    if (arrivalPort !== undefined) {
      updateData.arrivalPort = arrivalPort;
    }

    const flightNumber = parseStringOrNull(body.flightNumber);
    if (flightNumber !== undefined) {
      updateData.flightNumber = flightNumber;
    }

    const hotelName = parseStringOrNull(body.hotelName);
    if (hotelName !== undefined) {
      updateData.hotelName = hotelName;
    }

    const remarks = parseStringOrNull(body.remarks);
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const vesselId = parseStringOrNull(body.vesselId);
    if (vesselId !== undefined) {
      updateData.vessel = vesselId ? { connect: { id: vesselId } } : { disconnect: true };
    }

    const principalId = parseStringOrNull(body.principalId);
    if (principalId !== undefined) {
      updateData.principal = principalId ? { connect: { id: principalId } } : { disconnect: true };
    }

    const nextPrincipalId =
      principalId !== undefined ? principalId : existingPrepareJoining.principalId;
    const nextDepartureDate =
      body.departureDate !== undefined
        ? parseDateOrNull(body.departureDate)
        : existingPrepareJoining.departureDate;
    const nextDeparturePort =
      departurePort !== undefined ? departurePort : existingPrepareJoining.departurePort;
    const nextArrivalPort =
      arrivalPort !== undefined ? arrivalPort : existingPrepareJoining.arrivalPort;
    const nextFinalCheck =
      preDepartureFinalCheck !== undefined
        ? preDepartureFinalCheck
        : existingPrepareJoining.preDepartureFinalCheck;
    const nextRemarks = remarks !== undefined ? remarks : existingPrepareJoining.remarks;

    if (
      (nextStatus === "READY" || nextStatus === "DISPATCHED") &&
      principalId !== undefined &&
      principalId !== existingPrepareJoining.principalId
    ) {
      return NextResponse.json(
        {
          error:
            "Save principal changes first, then complete the principal checklist review before moving to READY or DISPATCHED.",
        },
        { status: 400 }
      );
    }

    if (nextPrincipalId) {
      await ensurePrepareJoiningPrincipalForms(id, nextPrincipalId);
    }

    if (nextStatus === "READY" || nextStatus === "DISPATCHED") {
      await assertPrepareJoiningStatusTransition(id, nextStatus as PrepareJoiningStatus);
    }

    if (nextStatus === "READY") {
      const readyBlockers = [
        nextPrincipalId ? null : "principal assignment",
        existingPrepareJoining.passportValid || updateData.passportValid === true ? null : "passport validation",
        existingPrepareJoining.seamanBookValid || updateData.seamanBookValid === true ? null : "seaman book validation",
        existingPrepareJoining.certificatesValid || updateData.certificatesValid === true ? null : "certificate validation",
        existingPrepareJoining.medicalValid || updateData.medicalValid === true ? null : "medical validation",
        existingPrepareJoining.visaValid || updateData.visaValid === true ? null : "visa validation",
        existingPrepareJoining.mcuCompleted || updateData.mcuCompleted === true ? null : "MCU completion",
        existingPrepareJoining.orientationCompleted || updateData.orientationCompleted === true ? null : "briefing/orientation completion",
        existingPrepareJoining.vesselContractSigned || updateData.vesselContractSigned === true ? null : "PKL / contract signing",
        existingPrepareJoining.ticketBooked || updateData.ticketBooked === true ? null : "ticket booking",
        existingPrepareJoining.transportArranged || updateData.transportArranged === true ? null : "transport arrangement",
        nextDepartureDate ? null : "departure date",
        nextDeparturePort ? null : "departure port",
        nextArrivalPort ? null : "arrival port",
      ].filter(Boolean) as string[];

      if (readyBlockers.length > 0) {
        return NextResponse.json(
          {
            error: `Prepare joining is not ready yet. Complete: ${readyBlockers.join(", ")}.`,
          },
          { status: 400 }
        );
      }
    }

    if (nextStatus === "DISPATCHED") {
      if (!nextFinalCheck) {
        return NextResponse.json(
          { error: "Final pre-departure check must be completed before DISPATCHED." },
          { status: 400 }
        );
      }

      if (!nextDepartureDate || !nextDeparturePort || !nextArrivalPort) {
        return NextResponse.json(
          {
            error:
              "Departure date, departure port, and arrival port are required before DISPATCHED.",
          },
          { status: 400 }
        );
      }
    }

    if (nextStatus === "CANCELLED" && !nextRemarks?.trim()) {
      return NextResponse.json(
        { error: "Remarks are required when cancelling a prepare joining record." },
        { status: 400 }
      );
    }

    const prepareJoining = await prisma.prepareJoining.update({
      where: { id },
      data: updateData,
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
          },
        },
        forms: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            status: true,
            approvedAt: true,
            submittedAt: true,
            template: {
              select: {
                id: true,
                formName: true,
                formCategory: true,
                isRequired: true,
              },
            },
          },
        },
      },
    });

    // Auto-create missing tasks if status changed to READY or DISPATCHED
    if (updateData.status && ['READY', 'DISPATCHED'].includes(updateData.status as string)) {
      try {
        const taskTemplates = [
          {
            taskType: 'MCU',
            title: `MCU - ${prepareJoining.crew.fullName}`,
            description: 'Schedule and complete Medical Check-Up (MCU) examination'
          },
          {
            taskType: 'TRAINING',
            title: `Training - ${prepareJoining.crew.fullName}`,
            description: 'Arrange training and orientation sessions'
          },
          {
            taskType: 'VISA',
            title: `Visa - ${prepareJoining.crew.fullName}`,
            description: 'Process visa application and documentation'
          },
          {
            taskType: 'CONTRACT',
            title: `Contract - ${prepareJoining.crew.fullName}`,
            description: 'Prepare and obtain signed employment contract'
          },
          {
            taskType: 'BRIEFING',
            title: `Briefing - ${prepareJoining.crew.fullName}`,
            description: 'Schedule vessel briefing and orientation'
          }
        ];

        // Create tasks for each template
        interface TaskTemplate {
          taskType: string;
          title: string;
          description: string;
        }
        const existingTaskTypes = new Set(
          (
            await prisma.crewTask.findMany({
              where: { prepareJoiningId: id },
              select: { taskType: true },
            })
          ).map((task) => String(task.taskType))
        );

        await Promise.all(
          taskTemplates
            .filter((template) => !existingTaskTypes.has(template.taskType))
            .map((template: TaskTemplate) =>
              prisma.crewTask.create({
              data: {
                crewId: prepareJoining.crew.id,
                prepareJoiningId: id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                taskType: template.taskType as any,
                title: template.title,
                description: template.description,
                status: 'TODO',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
              }
            })
          )
        );
      } catch (taskError) {
        console.error('Error creating auto tasks:', taskError);
        // Don't fail the entire update if task creation fails
      }
    }

    const compliance = await getPrepareJoiningComplianceSnapshot(id);

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "PREPARE_JOINING_UPDATED",
        entityType: "PrepareJoining",
        entityId: id,
        metadataJson: {
          status: prepareJoining.status,
          principalId: prepareJoining.principal?.id ?? null,
          vesselId: prepareJoining.vessel?.id ?? null,
        },
      },
    });

    return NextResponse.json({
      ...prepareJoining,
      principalChecklist: compliance?.checklist ?? [],
      principalChecklistSummary: mapComplianceSummary(compliance),
    });
  } catch (error) {
    console.error("Error updating prepare joining:", error);
    if (
      error instanceof Error &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
    ) {
      return NextResponse.json(
        {
          error: error.message,
          compliance: "snapshot" in error ? error.snapshot : undefined,
        },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to update prepare joining" },
      { status: 500 }
    );
  }
}

// DELETE /api/prepare-joining/[id] - Delete prepare joining record
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/prepare-joining",
      "DELETE",
      "Insufficient permissions to delete prepare joining records"
    );
    if (authError) return authError;

    await prisma.prepareJoining.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "PREPARE_JOINING_DELETED",
        entityType: "PrepareJoining",
        entityId: id,
      },
    });

    return NextResponse.json({ message: "Prepare joining deleted" });
  } catch (error) {
    console.error("Error deleting prepare joining:", error);
    return NextResponse.json(
      { error: "Failed to delete prepare joining" },
      { status: 500 }
    );
  }
}
