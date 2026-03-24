import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { SignOffStatus } from "@prisma/client";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { z } from "zod";

const signOffCreateSchema = z.object({
  crewId: z.string().min(1, "Crew ID is required"),
  assignmentId: z.string().min(1, "Assignment ID is required"),
  signOffDate: z.string().datetime({ offset: true }).or(z.string().date()),
  arrivalDate: z.string().datetime({ offset: true }).or(z.string().date()).nullable().optional(),
  passportReceived: z.boolean().optional().default(false),
  seamanBookReceived: z.boolean().optional().default(false),
}).strict();

const signOffStatuses = new Set<SignOffStatus>(Object.values(SignOffStatus));

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/crewing/sign-off", "GET");
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      if (!signOffStatuses.has(status as SignOffStatus)) {
        return NextResponse.json({ error: "Invalid sign-off status filter" }, { status: 400 });
      }
      where.status = status;
    }

    const signOffs = await prisma.crewSignOff.findMany({
      where,
      include: {
        crew: {
          select: {
            fullName: true,
            rank: true,
            phone: true
          }
        },
        assignment: {
          select: {
            vessel: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { signOffDate: "desc" }
    });

    return NextResponse.json({ signOffs, total: signOffs.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/crewing/sign-off", "POST");
    if (authError) return authError;
    if (!session.user?.id) {
      throw new ApiError(401, "Unauthorized", "AUTHENTICATION_ERROR");
    }

    const parsedBody = signOffCreateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid sign-off payload", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    const {
      crewId,
      assignmentId,
      signOffDate,
      arrivalDate,
      passportReceived = false,
      seamanBookReceived = false
    } = body;

    const signOffDateValue = new Date(signOffDate);
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        crewId: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!assignment) {
      throw new ApiError(404, "Assignment not found", "NOT_FOUND");
    }

    if (assignment.crewId !== crewId) {
      throw new ApiError(400, "Assignment does not belong to the selected crew", "VALIDATION_ERROR");
    }

    if (signOffDateValue < assignment.startDate) {
      throw new ApiError(400, "Sign-off date cannot be before assignment start date", "VALIDATION_ERROR");
    }

    if (["COMPLETED", "CANCELLED"].includes(assignment.status.toUpperCase())) {
      throw new ApiError(400, "Assignment is already closed for sign-off processing", "ASSIGNMENT_CLOSED");
    }

    const existingSignOff = await prisma.crewSignOff.findFirst({
      where: { assignmentId },
      select: { id: true, status: true },
    });

    if (existingSignOff) {
      throw new ApiError(
        409,
        `A sign-off record already exists for this assignment (${existingSignOff.status}).`,
        "DUPLICATE_SIGN_OFF"
      );
    }

    const signOff = await prisma.$transaction(async (tx) => {
      const createdSignOff = await tx.crewSignOff.create({
        data: {
          crewId,
          assignmentId,
          signOffDate: signOffDateValue,
          arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
          passportReceived,
          seamanBookReceived,
          status: "PENDING"
        }
      });

      await tx.crew.update({
        where: { id: crewId },
        data: { status: "OFF_SIGNED" }
      });

      await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          status: "COMPLETED",
          endDate: assignment.endDate ?? signOffDateValue,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "CREW_SIGN_OFF_CREATED",
          entityType: "CrewSignOff",
          entityId: createdSignOff.id,
          metadataJson: {
            crewId,
            assignmentId,
            previousAssignmentStatus: assignment.status,
            nextAssignmentStatus: "COMPLETED",
            status: createdSignOff.status,
          },
        },
      });

      return createdSignOff;
    });

    return NextResponse.json(signOff, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
