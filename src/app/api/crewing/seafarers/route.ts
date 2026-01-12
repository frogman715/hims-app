import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError, validatePagination } from "@/lib/error-handler";
import { createSeafarerSchema } from "@/types/crewing";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/crewing/seafarers
 * List all seafarers with optional filtering
 */
export const GET = withPermission(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const rank = searchParams.get("rank");
      const nationality = searchParams.get("nationality");
      
      const { limit, offset } = validatePagination(
        searchParams.get("limit") || undefined,
        searchParams.get("offset") || undefined
      );

      const where: Record<string, unknown> = {};
      
      if (status && status !== "all") {
        where.status = status;
      }
      
      if (rank) {
        where.rank = { contains: rank, mode: "insensitive" };
      }
      
      if (nationality) {
        where.nationality = { contains: nationality, mode: "insensitive" };
      }

      const [seafarers, total] = await Promise.all([
        prisma.crew.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { fullName: "asc" },
          include: {
            documents: {
              where: { isActive: true },
              select: {
                id: true,
                docType: true,
                docNumber: true,
                expiryDate: true,
              },
            },
            assignments: {
              where: { status: { in: ["ACTIVE", "ONBOARD", "ASSIGNED"] } },
              orderBy: { startDate: "desc" },
              take: 1,
              include: {
                vessel: { select: { name: true } },
                principal: { select: { name: true } },
              },
            },
          },
        }),
        prisma.crew.count({ where }),
      ]);

      return NextResponse.json({
        data: seafarers,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

/**
 * POST /api/crewing/seafarers
 * Create a new seafarer
 */
export const POST = withPermission(
  "crew",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      
      // Validate input using Zod schema
      const validationResult = createSeafarerSchema.safeParse(body);
      
      if (!validationResult.success) {
        throw new ApiError(
          400,
          "Invalid seafarer data",
          "VALIDATION_ERROR",
          validationResult.error.format()
        );
      }

      const data = validationResult.data;

      // Convert string dates to Date objects
      const seafarerData: Prisma.CrewCreateInput = {
        fullName: data.fullName,
        rank: data.rank,
        nationality: data.nationality,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactRelation: data.emergencyContactRelation || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        bloodType: data.bloodType || null,
        heightCm: data.heightCm || null,
        weightKg: data.weightKg || null,
        coverallSize: data.coverallSize || null,
        shoeSize: data.shoeSize || null,
        waistSize: data.waistSize || null,
        passportNumber: data.passportNumber || null,
        seamanBookNumber: data.seamanBookNumber || null,
        placeOfBirth: data.placeOfBirth || null,
        status: "STANDBY",
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : null,
        seamanBookExpiry: data.seamanBookExpiry ? new Date(data.seamanBookExpiry) : null,
      };

      const seafarer = await prisma.crew.create({
        data: seafarerData,
      });

      return NextResponse.json(seafarer, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
