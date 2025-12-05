import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ComplianceSystemType, ComplianceStatus } from "@prisma/client";

/**
 * GET /api/external-compliance/stats
 * Get statistics for external compliance systems
 */
export const GET = withPermission("compliance", PermissionLevel.VIEW_ACCESS, async () => {
  // Get all compliances
  const compliances = await prisma.externalCompliance.findMany({
    select: {
      systemType: true,
      status: true,
      expiryDate: true,
    },
  });

  const now = new Date();

  // Initialize stats (KOSMA removed - now in Documents Management)
  const stats = {
    dephub: { total: 0, verified: 0, expired: 0, pending: 0 },
    schengen: { total: 0, verified: 0, expired: 0, pending: 0 },
  };

  // Process each compliance
  compliances.forEach((c) => {
    let category: keyof typeof stats;

    switch (c.systemType) {
      case ComplianceSystemType.DEPHUB_CERTIFICATE:
        category = "dephub";
        break;
      case ComplianceSystemType.SCHENGEN_VISA_NL:
        category = "schengen";
        break;
      default:
        return;
    }

    stats[category].total++;

    // Check if expired
    if (c.expiryDate && c.expiryDate < now) {
      stats[category].expired++;
    } else if (c.status === ComplianceStatus.VERIFIED) {
      stats[category].verified++;
    } else if (c.status === ComplianceStatus.PENDING) {
      stats[category].pending++;
    }
  });

  return NextResponse.json(stats);
});
