import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { isValidStateTransition } from "@/types/crewing";
import { z } from "zod";

const applicationTransitionSchema = z.object({
  newStatus: z.enum(["REVIEWING", "INTERVIEW", "PASSED", "OFFERED", "ACCEPTED", "REJECTED", "CANCELLED"]),
  remarks: z.string().trim().optional().nullable(),
}).strict();

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

      if (newStatus === "ACCEPTED" && !application.principalId) {
        throw new ApiError(
          400,
          "Assign a principal before accepting the application into deployment flow.",
          "PRINCIPAL_REQUIRED"
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

      // Perform transition with side effects
      const updated = await prisma.$transaction(async (tx) => {
        // Update application
        const updatedApp = await tx.application.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            remarks: remarks || application.remarks,
          },
          include: {
            crew: true,
            principal: true,
          },
        });

        // Side effects based on new status
        switch (newStatus) {
          case "INTERVIEW":
            // Auto-create interview record
            {
              const existingInterview = await tx.interview.findFirst({
                where: { applicationId: application.id },
                select: { id: true },
              });

              if (!existingInterview) {
                await tx.interview.create({
                  data: {
                    crewId: application.crewId,
                    applicationId: application.id,
                    interviewerId: session.user.id,
                    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    status: "SCHEDULED",
                  },
                });
              }
            }
            break;

          case "ACCEPTED":
            // Update crew status to STANDBY (ready for assignment)
            await tx.crew.update({
              where: { id: application.crewId },
              data: { status: "STANDBY" },
            });
            break;

          case "REJECTED":
          case "CANCELLED":
            // No crew status change needed
            break;
        }

        // Create audit trail
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: `Application status changed: ${application.status} → ${newStatus}`,
            entityType: "Application",
            entityId: application.id,
          },
        });

        return updatedApp;
      });

      return NextResponse.json({
        data: updated,
        message: `Application transitioned to ${newStatus}`,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
