import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePrincipalSession } from "@/lib/principal-session";
import { z } from "zod";
import {
  parseApplicationFlowState,
  resolveHgiApplicationStage,
  stringifyApplicationFlowState,
} from "@/lib/application-flow-state";

const ACTIVE_PREPARE_JOINING_STATUSES = [
  "PENDING",
  "DOCUMENTS",
  "MEDICAL",
  "TRAINING",
  "TRAVEL",
  "READY",
] as const;

const principalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().min(3),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const principalError = ensurePrincipalSession(session);
  if (principalError) {
    return principalError;
  }

  const { id } = await context.params;
  const parsed = principalDecisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Decision note is required", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { decision, note } = parsed.data;
  const application = await prisma.application.findFirst({
    where: {
      id,
      principalId: session.user.principalId,
    },
    select: {
      id: true,
      crewId: true,
      principalId: true,
      status: true,
      remarks: true,
      attachments: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "OFFERED") {
    return NextResponse.json(
      { error: "Only submissions waiting for owner review can be decided here." },
      { status: 400 }
    );
  }

  const nextStatus = decision === "APPROVE" ? "ACCEPTED" : "REJECTED";
  const ownerNote = `[OWNER:${session.user.principalName ?? session.user.principalId}] ${note}`;

  const updatedApplication = await prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: application.id },
      data: {
        status: nextStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        attachments: stringifyApplicationFlowState(application.attachments, {
          hgiStage: decision === "APPROVE" ? "PRE_JOINING" : "OWNER_REJECTED",
        }),
        remarks: application.remarks
          ? `${application.remarks}\n${ownerNote}`
          : ownerNote,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            prepareJoinings: {
              where: {
                status: {
                  in: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY", "DISPATCHED"],
                },
              },
              select: { id: true },
              take: 1,
            },
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

    if (nextStatus === "ACCEPTED") {
      await tx.crew.update({
        where: { id: application.crewId },
        data: { status: "STANDBY" },
      });

      const existingPrepareJoining = await tx.prepareJoining.findFirst({
        where: {
          crewId: application.crewId,
          status: {
            in: [...ACTIVE_PREPARE_JOINING_STATUSES],
          },
        },
        select: { id: true },
      });

      if (!existingPrepareJoining) {
        await tx.prepareJoining.create({
          data: {
            crewId: application.crewId,
            principalId: application.principalId,
            status: "PENDING",
            passportValid: false,
            seamanBookValid: false,
            certificatesValid: false,
            medicalValid: false,
            visaValid: false,
            orientationCompleted: false,
            ticketBooked: false,
            hotelBooked: false,
            transportArranged: false,
            remarks: `Auto-created from owner-approved application ${application.id}`,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: decision === "APPROVE" ? "OWNER_APPROVED_APPLICATION" : "OWNER_REJECTED_APPLICATION",
        entityType: "Application",
        entityId: application.id,
        metadataJson: {
          principalId: session.user.principalId,
          principalName: session.user.principalName ?? null,
          note,
          previousStatus: application.status,
          nextStatus,
        },
      },
    });

    return updated;
  });

  return NextResponse.json({
    data: {
      ...updatedApplication,
      hgiStage: resolveHgiApplicationStage({
        status: updatedApplication.status,
        attachments: updatedApplication.attachments,
        hasPrepareJoining: updatedApplication.crew.prepareJoinings.length > 0,
      }),
      cvReadyAt: parseApplicationFlowState(updatedApplication.attachments).cvReadyAt,
      cvReadyBy: parseApplicationFlowState(updatedApplication.attachments).cvReadyBy,
      hasPrepareJoining: updatedApplication.crew.prepareJoinings.length > 0,
    },
    message: decision === "APPROVE" ? "Submission approved" : "Submission rejected",
  });
}
