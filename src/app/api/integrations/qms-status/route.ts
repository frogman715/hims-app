/**
 * GET /api/integrations/qms-status
 * Get overall QMS status (Risk + Audit integration dashboard)
 * Shows holistic view of QMS health
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

    // Get risk data
    const risks = await prisma.risk.findMany({
      select: { riskScore: true, status: true, source: true },
    });

    // Get audit data
    const audits = await prisma.auditSchedule.findMany({
      include: { findings: { select: { severity: true } } },
    });

    // Calculate metrics
    const riskMetrics = {
      total: risks.length,
      active: risks.filter((r) => r.status === "ACTIVE").length,
      averageScore: risks.length > 0 ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length) : 0,
      highRisks: risks.filter((r) => r.riskScore >= 15).length,
    };

    const auditFindings = { total: 0, majorNC: 0, minorNC: 0, observations: 0 };
    audits.forEach((a) => {
      a.findings.forEach((f) => {
        auditFindings.total++;
        if (f.severity === "MAJOR_NC") auditFindings.majorNC++;
        else if (f.severity === "MINOR_NC") auditFindings.minorNC++;
        else auditFindings.observations++;
      });
    });

    const auditMetrics = {
      total: audits.length,
      completed: audits.filter((a) => a.status === "COMPLETED").length,
      findings: auditFindings,
    };

    // Overall QMS health score (1-100)
    let healthScore = 100;
    healthScore -= riskMetrics.highRisks * 10; // -10 per high risk
    healthScore -= auditFindings.majorNC * 15; // -15 per major NC
    healthScore -= auditFindings.minorNC * 5; // -5 per minor NC
    healthScore = Math.max(0, Math.min(100, healthScore));

    const status = {
      risk: riskMetrics,
      audit: auditMetrics,
      overallHealth: {
        score: healthScore,
        level: healthScore >= 80 ? "GOOD" : healthScore >= 60 ? "FAIR" : healthScore >= 40 ? "AT_RISK" : "CRITICAL",
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ data: status });
  } catch (error) {
    return handleApiError(error);
  }
}
