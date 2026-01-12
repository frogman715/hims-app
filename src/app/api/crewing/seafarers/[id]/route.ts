import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { updateSeafarerSchema } from "@/types/crewing";
import type { Prisma } from "@prisma/client";

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
            take: 5,
          },
          visaApplications: {
            orderBy: { applicationDate: "desc" },
            take: 5,
          },
          contracts: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      if (!seafarer) {
        throw new ApiError(404, "Seafarer not found", "NOT_FOUND");
      }

      return NextResponse.json(seafarer);
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
      if (data.nationality !== undefined) updateData.nationality = data.nationality;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.emergencyContactName !== undefined) updateData.emergencyContactName = data.emergencyContactName;
      if (data.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = data.emergencyContactRelation;
      if (data.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = data.emergencyContactPhone;
      if (data.bloodType !== undefined) updateData.bloodType = data.bloodType;
      if (data.heightCm !== undefined) updateData.heightCm = data.heightCm;
      if (data.weightKg !== undefined) updateData.weightKg = data.weightKg;
      if (data.coverallSize !== undefined) updateData.coverallSize = data.coverallSize;
      if (data.shoeSize !== undefined) updateData.shoeSize = data.shoeSize;
      if (data.waistSize !== undefined) updateData.waistSize = data.waistSize;
      if (data.passportNumber !== undefined) updateData.passportNumber = data.passportNumber;
      if (data.seamanBookNumber !== undefined) updateData.seamanBookNumber = data.seamanBookNumber;
      if (data.placeOfBirth !== undefined) updateData.placeOfBirth = data.placeOfBirth;

      if (data.dateOfBirth !== undefined && data.dateOfBirth !== null) {
        updateData.dateOfBirth = new Date(data.dateOfBirth);
      }

      if (data.passportExpiry !== undefined && data.passportExpiry !== null) {
        updateData.passportExpiry = new Date(data.passportExpiry);
      }

      if (data.seamanBookExpiry !== undefined && data.seamanBookExpiry !== null) {
        updateData.seamanBookExpiry = new Date(data.seamanBookExpiry);
      }

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
