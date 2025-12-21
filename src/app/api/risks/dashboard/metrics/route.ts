/**
 * GET /api/risks/dashboard/metrics
 * Get risk dashboard metrics and KPIs
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError } from "@/lib/error-handler";
import type { Session } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = checkPermission(session as Session, "quality", PermissionLevel.VIEW_ACCESS);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const risks = await prisma.risk.findMany({
      select: { status: true, riskScore: true, source: true, createdAt: true },
    });

    const metrics = {
      total: risks.length,
      byStatus: {
        ACTIVE: risks.filter((r) => r.status === "ACTIVE").length,
        MITIGATED: risks.filter((r) => r.status === "MITIGATED").length,
        TRANSFERRED: risks.filter((r) => r.status === "TRANSFERRED").length,
        ACCEPTED: risks.filter((r) => r.status === "ACCEPTED").length,
        CLOSED: risks.filter((r) => r.status === "CLOSED").length,
      },
      bySource: {
        REGULATORY: risks.filter((r) => r.source === "REGULATORY").length,
        OPERATIONAL: risks.filter((r) => r.source === "OPERATIONAL").length,
        STRATEGIC: risks.filter((r) => r.source === "STRATEGIC").length,
        FINANCIAL: risks.filter((r) => r.source === "FINANCIAL").length,
        ENVIRONMENTAL: risks.filter((r) => r.source === "ENVIRONMENTAL").length,
      },
      averageScore: risks.length > 0 ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length) : 0,
      highRisks: risks.filter((r) => r.riskScore >= 15).length,
      mediumRisks: risks.filter((r) => r.riskScore >= 9 && r.riskScore < 15).length,
      lowRisks: risks.filter((r) => r.riskScore < 9).length,
      recentlyCreated: risks.filter((r) => {
        const daysSince = (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      }).length,
    };

    return NextResponse.json({ data: metrics });
  } catch (error) {
    return handleApiError(error);
  }
}
