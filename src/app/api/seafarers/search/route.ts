import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError } from "@/lib/error-handler";
import type { CrewSearchResult, CrewSearchResponse } from "@/types/crewing";

/**
 * Global Crew Search API
 * Searches across name, passport, seaman book, phone, and vessel assignments
 */
export const GET = withPermission(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get("q")?.trim();
      const page = parseInt(searchParams.get("page") || "1");
      const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "10"), 50);
      
      if (!query || query.length < 2) {
        return NextResponse.json({
          results: [],
          total: 0,
          page: 1,
          pageSize: 10,
        } as CrewSearchResponse);
      }

      const skip = (page - 1) * pageSize;
      
      // Build search conditions for fuzzy matching
      const searchConditions = {
        OR: [
          { fullName: { contains: query, mode: "insensitive" as const } },
          { rank: { contains: query, mode: "insensitive" as const } },
          { passportNumber: { contains: query, mode: "insensitive" as const } },
          { seamanBookNumber: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { nationality: { contains: query, mode: "insensitive" as const } },
        ],
      };

      // Get total count
      const total = await prisma.crew.count({ where: searchConditions });

      // Get crew with relations
      const crews = await prisma.crew.findMany({
        where: searchConditions,
        take: pageSize,
        skip,
        orderBy: { fullName: "asc" },
        include: {
          assignments: {
            where: { status: { in: ["ACTIVE", "ONBOARD", "ASSIGNED"] } },
            orderBy: { startDate: "desc" },
            take: 1,
            include: {
              vessel: { select: { name: true } },
              principal: { select: { name: true } },
            },
          },
          applications: {
            orderBy: { applicationDate: "desc" },
            take: 1,
            include: {
              principal: { select: { name: true } },
            },
          },
          documents: {
            where: {
              isActive: true,
              expiryDate: {
                lte: new Date(Date.now() + 14 * 30 * 24 * 60 * 60 * 1000), // 14 months
                gte: new Date(),
              },
            },
            select: {
              id: true,
              docType: true,
              docNumber: true,
              expiryDate: true,
            },
          },
        },
      });

      // Transform to search results
      const results: CrewSearchResult[] = crews.map((crew) => {
        const latestAssignment = crew.assignments[0];
        const latestApplication = crew.applications[0];
        
        // Calculate age
        let age: number | null = null;
        if (crew.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(crew.dateOfBirth);
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          id: crew.id,
          fullName: crew.fullName,
          rank: crew.rank,
          status: crew.status,
          nationality: crew.nationality,
          passportNumber: crew.passportNumber,
          passportExpiry: crew.passportExpiry?.toISOString() || null,
          seamanBookNumber: crew.seamanBookNumber,
          seamanBookExpiry: crew.seamanBookExpiry?.toISOString() || null,
          phone: crew.phone,
          email: crew.email,
          dateOfBirth: crew.dateOfBirth?.toISOString() || null,
          age,
          latestAssignment: latestAssignment
            ? {
                rank: latestAssignment.rank || null,
                vesselName: latestAssignment.vessel?.name || null,
                principalName: latestAssignment.principal?.name || null,
                status: latestAssignment.status,
                startDate: latestAssignment.startDate.toISOString(),
                endDate: latestAssignment.endDate?.toISOString() || null,
              }
            : null,
          latestApplication: latestApplication
            ? {
                status: latestApplication.status,
                appliedAt: latestApplication.applicationDate.toISOString(),
                principalName: latestApplication.principal?.name || null,
                vesselType: latestApplication.vesselType,
              }
            : null,
          expiringDocuments: crew.documents.map((doc) => ({
            id: doc.id,
            docType: doc.docType,
            docNumber: doc.docNumber,
            expiryDate: doc.expiryDate?.toISOString() || null,
          })),
        };
      });

      return NextResponse.json({
        results,
        total,
        page,
        pageSize,
      } as CrewSearchResponse);
    } catch (error) {
      return handleApiError(error);
    }
  }
);
