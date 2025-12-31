import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

enum ComplianceSystemType {
  DEPHUB_CERTIFICATE = "DEPHUB_CERTIFICATE",
  SCHENGEN_VISA_NL = "SCHENGEN_VISA_NL",
  ISO_9001 = "ISO_9001",
  ISO_14001 = "ISO_14001",
  ISO_45001 = "ISO_45001",
  OTHER = "OTHER",
}

enum ComplianceStatus {
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  VERIFIED = "VERIFIED",
}

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
