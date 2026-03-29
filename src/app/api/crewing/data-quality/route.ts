import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { prisma } from "@/lib/prisma";
import {
  buildSeafarerBiodataQualitySnapshot,
  type SeafarerBiodataIssueCode,
} from "@/lib/seafarer-biodata-quality";

export const GET = withPermission(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async () => {
    const now = new Date();

    const crews = await prisma.crew.findMany({
      orderBy: { fullName: "asc" },
      include: {
        documents: {
          where: { isActive: true },
          select: {
            id: true,
            docType: true,
            expiryDate: true,
          },
        },
        assignments: {
          where: {
            status: {
              in: ["ACTIVE", "ASSIGNED", "ONBOARD"],
            },
          },
          orderBy: { startDate: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            startDate: true,
            vessel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        seaServiceHistories: {
          orderBy: [{ signOnDate: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            vesselType: true,
            flag: true,
            grt: true,
            engineOutput: true,
          },
        },
      },
    });

    const crewIssues = crews
      .map((crew) => {
        const snapshot = buildSeafarerBiodataQualitySnapshot(
          {
            id: crew.id,
            rank: crew.rank,
            nationality: crew.nationality,
            dateOfBirth: crew.dateOfBirth,
            placeOfBirth: crew.placeOfBirth,
            phone: crew.phone,
            email: crew.email,
            crewStatus: crew.crewStatus,
            emergencyContactName: crew.emergencyContactName,
            emergencyContactPhone: crew.emergencyContactPhone,
          },
          {
            now,
            expiryWarningDays: 30,
            documents: crew.documents,
            assignments: crew.assignments,
            latestSeaServiceRecord: crew.seaServiceHistories[0] ?? null,
          }
        );

        const issues: Array<{
          type: SeafarerBiodataIssueCode;
          message: string;
          severity: "high" | "medium";
        }> = snapshot.issues.map((issue) => ({
          type: issue.code,
          message: issue.detail,
          severity: issue.severity === "critical" ? "high" : "medium",
        }));

        return {
          id: crew.id,
          crewCode: crew.crewCode,
          fullName: crew.fullName,
          rank: crew.rank,
          crewStatus: crew.crewStatus,
          status: crew.status,
          issues,
          expiringDocuments: snapshot.expiringDocuments.map((document) => ({
            id: document.id,
            docType: document.docType ?? "",
            expiryDate: document.expiryDate instanceof Date
              ? document.expiryDate.toISOString()
              : document.expiryDate
                ? new Date(document.expiryDate).toISOString()
                : null,
          })),
          activeAssignment:
            crew.assignments[0] == null
              ? null
              : {
                  id: crew.assignments[0].id,
                  status: crew.assignments[0].status,
                  startDate: crew.assignments[0].startDate.toISOString(),
                  vesselName: crew.assignments[0].vessel?.name ?? null,
                },
        };
      })
      .filter((crew) => crew.issues.length > 0);

    const summary = crewIssues.reduce(
      (accumulator, crew) => {
        for (const issue of crew.issues) {
          accumulator.byType[issue.type] = (accumulator.byType[issue.type] ?? 0) + 1;
          if (issue.severity === "high") {
            accumulator.highSeverity += 1;
          }
          if (issue.severity === "medium") {
            accumulator.mediumSeverity += 1;
          }
        }
        return accumulator;
      },
      {
        totalCrewsWithIssues: crewIssues.length,
        highSeverity: 0,
        mediumSeverity: 0,
        byType: {} as Record<SeafarerBiodataIssueCode, number>,
      }
    );

    return NextResponse.json({
      generatedAt: now.toISOString(),
      summary,
      data: crewIssues,
    });
  }
);
