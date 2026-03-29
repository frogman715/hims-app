import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { updateSeafarerSchema } from "@/types/crewing";
import type { Prisma } from "@prisma/client";
import { buildCrewDocumentWorkspaceView } from "@/lib/document-control";

function differenceInDays(signOnDate: Date, signOffDate: Date | null) {
  const end = signOffDate ?? new Date();
  const milliseconds = end.getTime() - signOnDate.getTime();
  const wholeDays = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  return wholeDays > 0 ? wholeDays : 0;
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalDate(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "Invalid date field", "VALIDATION_ERROR");
  }

  return parsed;
}

/**
 * GET /api/crewing/seafarers/[id]
 * Get a single seafarer with full relations
 */
export const GET = withPermission(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async (req: NextRequest, session, context: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context.params;
      const { id } = params;

      const seafarer = await prisma.crew.findUnique({
        where: { id },
        include: {
          documentWorkspace: true,
          documents: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
          },
          assignments: {
            orderBy: { startDate: "desc" },
            include: {
              vessel: true,
              principal: true,
            },
          },
          applications: {
            orderBy: { applicationDate: "desc" },
            include: {
              principal: true,
            },
          },
          medicalChecks: {
            orderBy: { checkDate: "desc" },
          },
          orientations: {
            orderBy: { startDate: "desc" },
          },
          visaApplications: {
            orderBy: { applicationDate: "desc" },
            take: 5,
          },
          contracts: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          seaServiceHistories: {
            orderBy: [{ signOnDate: "desc" }, { createdAt: "desc" }],
            include: {
              verifier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!seafarer) {
        throw new ApiError(404, "Seafarer not found", "NOT_FOUND");
      }

      const seaServiceSummary = seafarer.seaServiceHistories.reduce(
        (summary, record) => {
          summary.totalContracts += 1;
          summary.totalSeaDays += differenceInDays(record.signOnDate, record.signOffDate);

          if (!summary.lastRank) {
            summary.lastRank = record.rank;
          }

          if (!summary.lastVessel) {
            summary.lastVessel = record.vesselName;
          }

          return summary;
        },
        {
          totalContracts: 0,
          totalSeaDays: 0,
          lastRank: null as string | null,
          lastVessel: null as string | null,
        }
      );

      return NextResponse.json({
        ...seafarer,
        seaServiceHistories: seafarer.seaServiceHistories.map((record) => ({
          ...record,
          verifiedBy: record.verifier,
        })),
        seaServiceSummary,
        documentWorkspace: buildCrewDocumentWorkspaceView({
          documents: seafarer.documents,
          identity: {
            crewId: seafarer.id,
            crewCode: seafarer.crewCode,
            fullName: seafarer.fullName ?? `Crew ${seafarer.id}`,
            rank: seafarer.rank,
            status: seafarer.status,
            crewStatus: seafarer.crewStatus,
            assignments: seafarer.assignments.map((assignment) => ({
              status: assignment.status,
            })),
          },
          stored: seafarer.documentWorkspace,
        }),
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

/**
 * PUT /api/crewing/seafarers/[id]
 * Update a seafarer
 */
export const PUT = withPermission(
  "crew",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest, session, context: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context.params;
      const { id } = params;
      const body = await req.json();

      // Validate input using Zod schema
      const validationResult = updateSeafarerSchema.safeParse(body);
      
      if (!validationResult.success) {
        throw new ApiError(
          400,
          "Invalid seafarer data",
          "VALIDATION_ERROR",
          validationResult.error.format()
        );
      }

      const data = validationResult.data;

      // Check if seafarer exists
      const existing = await prisma.crew.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Seafarer not found", "NOT_FOUND");
      }

      // Build update data
      const updateData: Prisma.CrewUpdateInput = {};
      
      if (data.fullName !== undefined) updateData.fullName = data.fullName;
      if (data.rank !== undefined) updateData.rank = data.rank;
      if (data.crewStatus !== undefined) updateData.crewStatus = data.crewStatus;
      if (data.nationality !== undefined) updateData.nationality = normalizeOptionalString(data.nationality);
      if (data.phone !== undefined) updateData.phone = normalizeOptionalString(data.phone);
      if (data.email !== undefined) updateData.email = normalizeOptionalString(data.email);
      if (data.address !== undefined) updateData.address = normalizeOptionalString(data.address);
      if (data.emergencyContactName !== undefined) updateData.emergencyContactName = normalizeOptionalString(data.emergencyContactName);
      if (data.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = normalizeOptionalString(data.emergencyContactRelation);
      if (data.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = normalizeOptionalString(data.emergencyContactPhone);
      if (data.bloodType !== undefined) updateData.bloodType = normalizeOptionalString(data.bloodType);
      if (data.heightCm !== undefined) updateData.heightCm = data.heightCm;
      if (data.weightKg !== undefined) updateData.weightKg = data.weightKg;
      if (data.coverallSize !== undefined) updateData.coverallSize = normalizeOptionalString(data.coverallSize);
      if (data.shoeSize !== undefined) updateData.shoeSize = normalizeOptionalString(data.shoeSize);
      if (data.waistSize !== undefined) updateData.waistSize = normalizeOptionalString(data.waistSize);
      if (data.passportNumber !== undefined) updateData.passportNumber = normalizeOptionalString(data.passportNumber);
      if (data.seamanBookNumber !== undefined) updateData.seamanBookNumber = normalizeOptionalString(data.seamanBookNumber);
      if (data.placeOfBirth !== undefined) updateData.placeOfBirth = normalizeOptionalString(data.placeOfBirth);

      const normalizedDateOfBirth = normalizeOptionalDate(data.dateOfBirth);
      if (normalizedDateOfBirth !== undefined) updateData.dateOfBirth = normalizedDateOfBirth;

      const normalizedPassportExpiry = normalizeOptionalDate(data.passportExpiry);
      if (normalizedPassportExpiry !== undefined) updateData.passportExpiry = normalizedPassportExpiry;

      const normalizedSeamanBookExpiry = normalizeOptionalDate(data.seamanBookExpiry);
      if (normalizedSeamanBookExpiry !== undefined) updateData.seamanBookExpiry = normalizedSeamanBookExpiry;

      const updated = await prisma.crew.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(updated);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

/**
 * DELETE /api/crewing/seafarers/[id]
 * Delete a seafarer (soft delete by setting status to OFF_SIGNED)
 */
export const DELETE = withPermission(
  "crew",
  PermissionLevel.FULL_ACCESS,
  async (req: NextRequest, session, context: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context.params;
      const { id } = params;

      // Check if seafarer exists
      const existing = await prisma.crew.findUnique({ 
        where: { id },
        include: {
          assignments: {
            where: { status: { in: ["ACTIVE", "ONBOARD", "ASSIGNED"] } },
          },
        },
      });

      if (!existing) {
        throw new ApiError(404, "Seafarer not found", "NOT_FOUND");
      }

      // Prevent deletion if has active assignments
      if (existing.assignments.length > 0) {
        throw new ApiError(
          400,
          "Cannot delete seafarer with active assignments",
          "HAS_ACTIVE_ASSIGNMENTS"
        );
      }

      // Soft delete by setting status to OFF_SIGNED
      await prisma.crew.update({
        where: { id },
        data: { status: "OFF_SIGNED" },
      });

      return NextResponse.json({ message: "Seafarer deleted successfully" });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
