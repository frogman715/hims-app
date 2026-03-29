import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { isValidStateTransition } from "@/types/crewing";
import { normalizeRoleTokens } from "@/lib/role-normalization";
import { UserRole } from "@/lib/permissions";
import {
  parseApplicationFlowState,
  resolveHgiApplicationStage,
  stringifyApplicationFlowState,
} from "@/lib/application-flow-state";
import { z } from "zod";

const applicationTransitionSchema = z.object({
  newStatus: z.enum(["REVIEWING", "INTERVIEW", "PASSED", "OFFERED", "ACCEPTED", "REJECTED", "CANCELLED"]),
  remarks: z.string().trim().optional().nullable(),
}).strict();

function canDocumentOwnTransition(currentStatus: string, nextStatus: string) {
  return (
    (currentStatus === "RECEIVED" && nextStatus === "REVIEWING") ||
    (currentStatus === "REVIEWING" && nextStatus === "INTERVIEW") ||
    (["RECEIVED", "REVIEWING"].includes(currentStatus) && nextStatus === "CANCELLED")
  );
}

function canDirectorOwnTransition(currentStatus: string, nextStatus: string) {
  return (
    (currentStatus === "INTERVIEW" && ["PASSED", "CANCELLED"].includes(nextStatus)) ||
    (currentStatus === "PASSED" && ["OFFERED", "CANCELLED"].includes(nextStatus))
  );
}

/**
 * POST /api/crewing/applications/[id]/transition
 * Transition application status with state machine validation
 */
export const POST = withPermission(
  "applications",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest, session, context: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context.params;
      const { id } = params;
      const parsedBody = applicationTransitionSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        throw new ApiError(400, "Invalid transition payload", "VALIDATION_ERROR", parsedBody.error.flatten());
      }

      const { newStatus, remarks } = parsedBody.data;
      const userRoles = normalizeRoleTokens(session.user.roles);
      const isDirector = userRoles.includes(UserRole.DIRECTOR);
      const isDocument = userRoles.includes(UserRole.CDMO);

      // Get current application
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          crew: true,
        },
      });

      if (!application) {
        throw new ApiError(404, "Application not found", "NOT_FOUND");
      }

      const flow = parseApplicationFlowState(application.attachments);

      if (["ACCEPTED", "REJECTED", "CANCELLED"].includes(application.status)) {
        throw new ApiError(
          400,
          "This application is already closed and locked. Continue the workflow in deployment handling or keep the record for history.",
          "APPLICATION_LOCKED"
        );
      }

      if ((newStatus === "REJECTED" || newStatus === "CANCELLED") && !remarks?.trim()) {
        throw new ApiError(
          400,
          `Remarks are required when moving an application to ${newStatus}`,
          "VALIDATION_ERROR"
        );
      }

      // Validate state transition
      if (!isValidStateTransition(application.status, newStatus)) {
        throw new ApiError(
          400,
          `Invalid state transition from ${application.status} to ${newStatus}`,
          "INVALID_TRANSITION"
        );
      }

      if (newStatus === "REJECTED") {
        throw new ApiError(
          400,
          "Owner rejection is recorded only in the principal portal. Use Cancelled for internal closure.",
          "OWNER_PORTAL_REQUIRED"
        );
      }

      if (["ACCEPTED", "REJECTED"].includes(newStatus) && application.status === "OFFERED") {
        throw new ApiError(
          400,
          "Principal decisions must be recorded in the principal portal. Office users cannot close owner review here.",
          "OWNER_PORTAL_REQUIRED"
        );
      }

      const allowedForRole =
        (isDocument && canDocumentOwnTransition(application.status, newStatus)) ||
        (isDirector && canDirectorOwnTransition(application.status, newStatus));

      if (!allowedForRole) {
        throw new ApiError(
          403,
          "This action is not allowed for the current role in the HGI review flow.",
          "ROLE_TRANSITION_FORBIDDEN"
        );
      }

      if (application.status === "REVIEWING" && newStatus === "INTERVIEW" && !flow.cvReadyAt) {
        throw new ApiError(
          400,
          "Mark the application CV as ready before submitting the candidate to director review.",
          "CV_READY_REQUIRED"
        );
      }

      if (application.status === "PASSED" && newStatus === "OFFERED" && !application.principalId) {
        throw new ApiError(
          400,
          "Assign a principal before sending the candidate to owner review.",
          "PRINCIPAL_REQUIRED"
        );
      }

      // Perform transition with side effects
      const updated = await prisma.$transaction(async (tx) => {
        let nextFlowStage = flow.hgiStage;
        if (application.status === "RECEIVED" && newStatus === "REVIEWING") {
          nextFlowStage = "DOCUMENT_CHECK";
        }
        if (application.status === "REVIEWING" && newStatus === "INTERVIEW") {
          nextFlowStage = "SUBMITTED_TO_DIRECTOR";
        }
        if (application.status === "INTERVIEW" && newStatus === "PASSED") {
          nextFlowStage = "DIRECTOR_APPROVED";
        }
        if (application.status === "PASSED" && newStatus === "OFFERED") {
          nextFlowStage = "SENT_TO_OWNER";
        }
        if (newStatus === "CANCELLED") {
          nextFlowStage = "CLOSED";
        }

        // Update application
        const updatedApp = await tx.application.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            attachments: stringifyApplicationFlowState(application.attachments, {
              hgiStage: nextFlowStage,
            }),
            remarks: remarks || application.remarks,
          },
          include: {
            crew: {
              include: {
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
            principal: true,
          },
        });

        // Side effects based on new status
        switch (newStatus) {
          case "CANCELLED":
            // No crew status change needed
            break;
        }

        // Create audit trail
        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            action: "APPLICATION_TRANSITION",
            entityType: "Application",
            entityId: application.id,
            metadataJson: {
              previousStatus: application.status,
              nextStatus: newStatus,
              owner: isDirector ? "DIRECTOR" : "DOCUMENT",
              remarks: remarks ?? null,
            },
          },
        });

        return updatedApp;
      });

      const updatedFlow = parseApplicationFlowState(updated.attachments);

      return NextResponse.json({
        data: {
          ...updated,
          hgiStage: resolveHgiApplicationStage({
            status: updated.status,
            attachments: updated.attachments,
            hasPrepareJoining: updated.crew.prepareJoinings.length > 0,
          }),
          cvReadyAt: updatedFlow.cvReadyAt,
          cvReadyBy: updatedFlow.cvReadyBy,
          hasPrepareJoining: updated.crew.prepareJoinings.length > 0,
        },
        message: `Application transitioned to ${newStatus}`,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
