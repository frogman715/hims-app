/**
 * GET /api/audits/dashboard/metrics
 * Get audit dashboard metrics and KPIs
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

    const schedules = await prisma.auditSchedule.findMany({
      include: {
        findings: { select: { severity: true } },
        report: { select: { status: true } },
      },
    });

    let totalObservations = 0;
    let totalMinorNC = 0;
    let totalMajorNC = 0;

    schedules.forEach((s) => {
      s.findings.forEach((f) => {
        if (f.severity === "OBSERVATION") totalObservations++;
        else if (f.severity === "MINOR_NC") totalMinorNC++;
        else if (f.severity === "MAJOR_NC") totalMajorNC++;
      });
    });

    const metrics = {
      total: schedules.length,
      byStatus: {
        SCHEDULED: schedules.filter((s) => s.status === "SCHEDULED").length,
        IN_PROGRESS: schedules.filter((s) => s.status === "IN_PROGRESS").length,
        COMPLETED: schedules.filter((s) => s.status === "COMPLETED").length,
        CANCELLED: schedules.filter((s) => s.status === "CANCELLED").length,
      },
      byType: {
        INTERNAL_QMS: schedules.filter((s) => s.auditType === "INTERNAL_QMS").length,
        EXTERNAL_CERTIFICATION: schedules.filter((s) => s.auditType === "EXTERNAL_CERTIFICATION").length,
        SURVEILLANCE: schedules.filter((s) => s.auditType === "SURVEILLANCE").length,
        SPECIAL: schedules.filter((s) => s.auditType === "SPECIAL").length,
      },
      findings: {
        total: totalObservations + totalMinorNC + totalMajorNC,
        observations: totalObservations,
        minorNC: totalMinorNC,
        majorNC: totalMajorNC,
      },
      reportsGenerated: schedules.filter((s) => s.report?.status).length,
      completionRate:
        schedules.length > 0
          ? Math.round(
              (schedules.filter((s) => s.status === "COMPLETED").length / schedules.length) * 100
            )
          : 0,
    };

    return NextResponse.json({ data: metrics });
  } catch (error) {
    return handleApiError(error);
  }
}
