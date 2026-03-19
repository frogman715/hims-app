import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "quality", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const [pendingAudits, openCAPAs, pendingApprovals, overdueItems] = await Promise.all([
      prisma.internalAudit.count({
        where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } }
      }),
      prisma.correctiveAction.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } }
      }),
      prisma.managementReview.count({
        where: { status: "SCHEDULED" }
      }),
      prisma.qMRTask.count({
        where: {
          status: "OVERDUE",
          dueDate: { lt: new Date() }
        }
      })
    ]);

    return NextResponse.json({
      pendingAudits,
      openCAPAs,
      pendingApprovals,
      overdueItems
    });
  } catch (error) {
    console.error("Error fetching QMR stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
