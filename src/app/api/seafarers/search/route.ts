import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ApiError } from "@/lib/error-handler";
import type { Prisma } from "@prisma/client";

const MAX_RESULTS = 15;
const EXPIRY_WINDOW_MONTHS = 14;
const AGE_KEYWORDS = new Set(["umur", "usia", "tahun", "th", "thn", "yo", "yrs"]);

function createAgeRangeCondition(token: string): Prisma.CrewWhereInput | null {
  if (!/^\d{1,2}$/.test(token)) {
    return null;
  }

  const age = Number.parseInt(token, 10);
  if (!Number.isFinite(age) || age < 16 || age > 75) {
    return null;
  }

  const now = new Date();

  const upperBound = new Date(now);
  upperBound.setFullYear(upperBound.getFullYear() - age);
  upperBound.setHours(23, 59, 59, 999);

  const lowerBound = new Date(now);
  lowerBound.setFullYear(lowerBound.getFullYear() - age - 1);
  lowerBound.setDate(lowerBound.getDate() + 1);
  lowerBound.setHours(0, 0, 0, 0);

  return {
    dateOfBirth: {
      gte: lowerBound,
      lte: upperBound,
    },
  };
}

function calculateAge(date: Date | null): number | null {
  if (!date) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function buildSearchFilters(query: string): Prisma.CrewWhereInput {
  const tokens = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !AGE_KEYWORDS.has(token.toLowerCase()));

  if (!tokens.length) {
    throw new ApiError(400, "Search query must be at least 2 characters", "INVALID_QUERY");
  }

  return {
    AND: tokens.map((token) => {
      const insensitive = "insensitive" as const;
      const conditions: Prisma.CrewWhereInput[] = [
        { fullName: { contains: token, mode: insensitive } },
        { rank: { contains: token, mode: insensitive } },
        { nationality: { contains: token, mode: insensitive } },
        { passportNumber: { contains: token, mode: insensitive } },
        { seamanBookNumber: { contains: token, mode: insensitive } },
        { email: { contains: token, mode: insensitive } },
        { phone: { contains: token, mode: insensitive } },
        {
          applications: {
            some: {
              OR: [
                { position: { contains: token, mode: insensitive } },
                { vesselType: { contains: token, mode: insensitive } },
              ],
            },
          },
        },
        {
          assignments: {
            some: {
              OR: [
                { rank: { contains: token, mode: insensitive } },
                { vessel: { name: { contains: token, mode: insensitive } } },
              ],
            },
          },
        },
        {
          documents: {
            some: {
              docNumber: { contains: token, mode: insensitive },
            },
          },
        },
      ];

      const ageCondition = createAgeRangeCondition(token);
      if (ageCondition) {
        conditions.push(ageCondition);
      }

      return { OR: conditions };
    }),
  };
}

export const GET = withPermission("crew", PermissionLevel.VIEW_ACCESS, async (req) => {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("q")?.trim() ?? "";

  if (rawQuery.length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters", "INVALID_QUERY");
  }

  const now = new Date();
  const expiryThreshold = new Date(now);
  expiryThreshold.setMonth(expiryThreshold.getMonth() + EXPIRY_WINDOW_MONTHS);

  const crews = await prisma.crew.findMany({
    where: buildSearchFilters(rawQuery),
    take: MAX_RESULTS,
    orderBy: { fullName: "asc" },
    include: {
      assignments: {
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
            not: null,
            lte: expiryThreshold,
          },
        },
        orderBy: { expiryDate: "asc" },
        take: 8,
      },
    },
  });

  const results = crews.map((crew) => {
    const assignment = crew.assignments[0];
    const application = crew.applications[0];

    return {
      id: crew.id,
      fullName: crew.fullName,
      rank: crew.rank,
      status: crew.status,
      nationality: crew.nationality,
      passportNumber: crew.passportNumber,
      passportExpiry: crew.passportExpiry,
      seamanBookNumber: crew.seamanBookNumber,
      seamanBookExpiry: crew.seamanBookExpiry,
      phone: crew.phone,
      email: crew.email,
      latestAssignment: assignment
        ? {
            rank: assignment.rank,
            vesselName: assignment.vessel?.name ?? null,
            principalName: assignment.principal?.name ?? null,
            status: assignment.status,
            startDate: assignment.startDate,
            endDate: assignment.endDate ?? null,
          }
        : null,
      latestApplication: application
        ? {
            status: application.status,
            appliedAt: application.applicationDate,
            principalName: application.principal?.name ?? null,
            vesselType: application.vesselType ?? null,
          }
        : null,
      expiringDocuments: crew.documents.map((doc) => ({
        id: doc.id,
        docType: doc.docType,
        docNumber: doc.docNumber,
        expiryDate: doc.expiryDate ?? null,
      })),
      dateOfBirth: crew.dateOfBirth,
      age: calculateAge(crew.dateOfBirth),
    };
  });

  return NextResponse.json({
    query: rawQuery,
    count: results.length,
    results,
  });
});
