import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// Use Prisma enum instead of local enum
type PrepareJoiningStatus = "PENDING" | "DOCUMENTS" | "MEDICAL" | "TRAINING" | "TRAVEL" | "READY" | "DISPATCHED" | "CANCELLED";

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

// GET /api/prepare-joining/[id] - Get single prepare joining record
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

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
      },
    });

    if (!prepareJoining) {
      return NextResponse.json(
        { error: "Prepare joining not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(prepareJoining);
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
    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as UpdatePrepareJoiningPayload;

    const updateData: Record<string, unknown> = {};

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
      },
    });

    // Auto-create tasks if status changed to READY or DISPATCHED
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
        await Promise.all(
          taskTemplates.map((template: TaskTemplate) =>
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

    return NextResponse.json(prepareJoining);
  } catch (error) {
    console.error("Error updating prepare joining:", error);
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
    if (!checkPermission(session, "crew", PermissionLevel.FULL_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.prepareJoining.delete({
      where: { id },
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