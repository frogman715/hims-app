import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applicationsGuard, checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError } from "@/lib/error-handler";
import {
  parseApplicationFlowState,
  resolveHgiApplicationStage,
} from "@/lib/application-flow-state";

// Define ApplicationStatus enum locally since it's not in Prisma schema
enum ApplicationStatus {
  RECEIVED = "RECEIVED",
  REVIEWING = "REVIEWING",
  INTERVIEW = "INTERVIEW",
  PASSED = "PASSED",
  FAILED = "FAILED",
  OFFERED = "OFFERED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

interface UpdateApplicationPayload {
  position?: string;
  status?: ApplicationStatus;
  vesselType?: string | null;
  principalId?: string | null;
  remarks?: string | null;
}

const APPLICATION_STATUS_VALUES = new Set<ApplicationStatus>([
  ApplicationStatus.RECEIVED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.PASSED,
  ApplicationStatus.FAILED,
  ApplicationStatus.OFFERED,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.CANCELLED,
]);

function normalizeOptionalString(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isUpdateApplicationPayload(value: unknown): value is UpdateApplicationPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<UpdateApplicationPayload>;

  if (
    payload.status !== undefined &&
    !APPLICATION_STATUS_VALUES.has(payload.status as ApplicationStatus)
  ) {
    return false;
  }

  if (
    payload.position !== undefined &&
    typeof payload.position !== "string"
  ) {
    return false;
  }

  if (
    payload.vesselType !== undefined &&
    payload.vesselType !== null &&
    typeof payload.vesselType !== "string"
  ) {
    return false;
  }

  if (
    payload.principalId !== undefined &&
    payload.principalId !== null &&
    typeof payload.principalId !== "string"
  ) {
    return false;
  }

  if (
    payload.remarks !== undefined &&
    payload.remarks !== null &&
    typeof payload.remarks !== "string"
  ) {
    return false;
  }

  return true;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !applicationsGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;
    const applicationId = id; // Keep as string since id is cuid

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            placeOfBirth: true,
            nationality: true,
            rank: true,
            phone: true,
            email: true,
            address: true,
            passportNumber: true,
            passportExpiry: true,
            seamanBookNumber: true,
            seamanBookExpiry: true,
            status: true,
            crewStatus: true,
            documents: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                docType: true,
                docNumber: true,
                issueDate: true,
                expiryDate: true,
                remarks: true,
              },
              orderBy: [
                { expiryDate: "asc" },
                { updatedAt: "desc" },
              ],
              take: 12,
            },
            medicalChecks: {
              select: {
                id: true,
                checkDate: true,
                expiryDate: true,
                clinicName: true,
                doctorName: true,
                result: true,
                remarks: true,
              },
              orderBy: {
                checkDate: "desc",
              },
              take: 3,
            },
            seaServiceHistories: {
              select: {
                id: true,
                vesselName: true,
                companyName: true,
                vesselType: true,
                flag: true,
                grt: true,
                engineOutput: true,
                rank: true,
                signOnDate: true,
                signOffDate: true,
                status: true,
                verificationStatus: true,
                remarks: true,
              },
              orderBy: {
                signOnDate: "desc",
              },
              take: 6,
            },
            prepareJoinings: {
              where: {
                status: {
                  in: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY", "DISPATCHED"],
                },
              },
              select: { id: true },
              take: 1,
            },
          }
        },
        principal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Transform response to match frontend expectations
    const flow = parseApplicationFlowState(application.attachments);
    return NextResponse.json({
      ...application,
      hgiStage: resolveHgiApplicationStage({
        status: application.status,
        attachments: application.attachments,
        hasPrepareJoining: application.crew.prepareJoinings.length > 0,
      }),
      cvReadyAt: flow.cvReadyAt,
      cvReadyBy: flow.cvReadyBy,
      hasPrepareJoining: application.crew.prepareJoinings.length > 0,
      seafarerId: application.crewId,
      appliedRank: application.position,
      seafarer: {
        id: application.crew.id,
        fullName: application.crew.fullName,
        dateOfBirth: application.crew.dateOfBirth,
        placeOfBirth: application.crew.placeOfBirth,
        nationality: application.crew.nationality,
        rank: application.crew.rank,
        phone: application.crew.phone,
        email: application.crew.email,
        address: application.crew.address,
        passportNumber: application.crew.passportNumber,
        passportExpiry: application.crew.passportExpiry,
        seamanBookNumber: application.crew.seamanBookNumber,
        seamanBookExpiry: application.crew.seamanBookExpiry,
        status: application.crew.status,
        crewStatus: application.crew.crewStatus,
        documents: application.crew.documents,
        medicalChecks: application.crew.medicalChecks,
        seaServiceHistories: application.crew.seaServiceHistories,
      },
      crew: {
        id: application.crew.id,
        fullName: application.crew.fullName,
        dateOfBirth: application.crew.dateOfBirth,
        placeOfBirth: application.crew.placeOfBirth,
        nationality: application.crew.nationality,
        rank: application.crew.rank,
        phone: application.crew.phone,
        email: application.crew.email,
        address: application.crew.address,
        passportNumber: application.crew.passportNumber,
        passportExpiry: application.crew.passportExpiry,
        seamanBookNumber: application.crew.seamanBookNumber,
        seamanBookExpiry: application.crew.seamanBookExpiry,
        status: application.crew.status,
        crewStatus: application.crew.crewStatus,
        documents: application.crew.documents,
        medicalChecks: application.crew.medicalChecks,
        seaServiceHistories: application.crew.seaServiceHistories,
      },
      principal: application.principal,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !checkPermission(session, "applications", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;
    const applicationId = id;

    const body = (await request.json()) as unknown;
    if (!isUpdateApplicationPayload(body)) {
      return NextResponse.json({ error: "Invalid application update payload" }, { status: 400 });
    }

    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (["ACCEPTED", "REJECTED", "CANCELLED"].includes(existingApplication.status)) {
      return NextResponse.json(
        { error: "Closed applications are locked. Continue the workflow in deployment tracking or keep the record for history." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    
    if (body.status !== undefined && body.status !== existingApplication.status) {
      return NextResponse.json(
        {
          error:
            "Application status must be changed through the controlled workflow transition endpoints. Direct status updates are blocked.",
        },
        { status: 400 }
      );
    }
    if (body.position !== undefined) {
      updateData.position = body.position.trim();
    }
    if (body.vesselType !== undefined) {
      updateData.vesselType = normalizeOptionalString(body.vesselType);
    }
    if (body.principalId !== undefined) {
      const normalizedPrincipalId = normalizeOptionalString(body.principalId);
      updateData.principal = normalizedPrincipalId
        ? { connect: { id: normalizedPrincipalId } }
        : { disconnect: true };
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            rank: true,
            phone: true,
            email: true,
          }
        },
        principal: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    return handleApiError(error);
  }
}
