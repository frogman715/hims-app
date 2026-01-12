import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { isValidStateTransition } from "@/types/crewing";

/**
 * POST /api/crewing/applications/[id]/transition
 * Transition application status with state machine validation
 */
export const POST = withPermission(
  "applications",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest, session, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const body = await req.json();
      const { newStatus, remarks } = body;

      if (!newStatus) {
        throw new ApiError(400, "newStatus is required", "VALIDATION_ERROR");
      }

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
            await tx.interview.create({
              data: {
                crewId: application.crewId,
                applicationId: application.id,
                interviewerId: session.user.id,
                scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                status: "SCHEDULED",
              },
            });
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
