import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/permissions";
import { normalizeRoleTokens } from "@/lib/role-normalization";
import {
  parseApplicationFlowState,
  stringifyApplicationFlowState,
} from "@/lib/application-flow-state";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = normalizeRoleTokens(session.user.roles);
  if (!roles.includes(UserRole.CDMO)) {
    return NextResponse.json({ error: "Only Document role can mark CV readiness." }, { status: 403 });
  }

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      attachments: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "REVIEWING") {
    return NextResponse.json(
      { error: "CV readiness can only be marked during the document check stage." },
      { status: 400 }
    );
  }

  const flow = parseApplicationFlowState(application.attachments);
  if (flow.cvReadyAt) {
    return NextResponse.json({ error: "CV is already marked ready for this application." }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextAttachments = stringifyApplicationFlowState(application.attachments, {
      hgiStage: "CV_READY",
      cvReadyAt: new Date().toISOString(),
      cvReadyBy: session.user.id,
    });

    const updatedApplication = await tx.application.update({
      where: { id: application.id },
      data: {
        attachments: nextAttachments,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            nationality: true,
            phone: true,
            email: true,
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

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "APPLICATION_CV_READY",
        entityType: "Application",
        entityId: application.id,
        metadataJson: {
          previousStage: flow.hgiStage ?? "DOCUMENT_CHECK",
          nextStage: "CV_READY",
        },
      },
    });

    return updatedApplication;
  });

  const nextFlow = parseApplicationFlowState(updated.attachments);

  return NextResponse.json({
    ...updated,
    hgiStage: nextFlow.hgiStage ?? "CV_READY",
    cvReadyAt: nextFlow.cvReadyAt,
    cvReadyBy: nextFlow.cvReadyBy,
    hasPrepareJoining: updated.crew.prepareJoinings.length > 0,
  });
}
