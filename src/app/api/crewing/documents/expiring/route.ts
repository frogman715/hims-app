import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError } from "@/lib/error-handler";

/**
 * GET /api/crewing/documents/expiring
 * Get documents expiring within specified months (default 14)
 */
export const GET = withPermission(
  "crew",
  PermissionLevel.VIEW_ACCESS,
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const monthsParam = searchParams.get("months");
      const months = monthsParam ? parseInt(monthsParam) : 14;

      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + months);

      const expiringDocuments = await prisma.crewDocument.findMany({
        where: {
          isActive: true,
          expiryDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: {
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
              status: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: {
          expiryDate: "asc",
        },
      });

      // Categorize by urgency
      const categorized = {
        expired: [] as typeof expiringDocuments,
        critical: [] as typeof expiringDocuments, // < 30 days
        warning: [] as typeof expiringDocuments, // 30-90 days
        notice: [] as typeof expiringDocuments, // 90-180 days
        monitor: [] as typeof expiringDocuments, // > 180 days
      };

      expiringDocuments.forEach((doc) => {
        if (!doc.expiryDate) return;

        const daysUntilExpiry = Math.floor(
          (doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          categorized.expired.push(doc);
        } else if (daysUntilExpiry < 30) {
          categorized.critical.push(doc);
        } else if (daysUntilExpiry < 90) {
          categorized.warning.push(doc);
        } else if (daysUntilExpiry < 180) {
          categorized.notice.push(doc);
        } else {
          categorized.monitor.push(doc);
        }
      });

      return NextResponse.json({
        data: expiringDocuments,
        categorized,
        summary: {
          total: expiringDocuments.length,
          expired: categorized.expired.length,
          critical: categorized.critical.length,
          warning: categorized.warning.length,
          notice: categorized.notice.length,
          monitor: categorized.monitor.length,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
