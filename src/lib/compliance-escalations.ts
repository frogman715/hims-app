import { prisma } from "@/lib/prisma";
import { buildCrewReadinessDashboard } from "@/lib/crewing-readiness";
import { ComplianceStatus, PrepareJoiningStatus } from "@prisma/client";
import { buildContractExpiryAlert } from "@/lib/contract-expiry";

const ACTIVE_PREPARE_JOINING_STATUSES: PrepareJoiningStatus[] = [
  PrepareJoiningStatus.PENDING,
  PrepareJoiningStatus.DOCUMENTS,
  PrepareJoiningStatus.MEDICAL,
  PrepareJoiningStatus.TRAINING,
  PrepareJoiningStatus.TRAVEL,
  PrepareJoiningStatus.READY,
];

export type EscalationItem = {
  id: string;
  ruleCode: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  owner: string;
  title: string;
  detail: string;
  href: string;
};

export async function getEscalationCenterData() {
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const thirtyDays = new Date(now);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const fortyFiveDays = new Date(now);
  fortyFiveDays.setDate(fortyFiveDays.getDate() + 45);

  const [expiringDocs, overdueCapa, blockedPrepareJoiningCrews, expiringContracts] = await Promise.all([
    prisma.crewDocument.findMany({
      where: {
        isActive: true,
        expiryDate: {
          gte: now,
          lte: thirtyDays,
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 25,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.correctiveAction.findMany({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS", "PENDING_VERIFICATION"],
        },
        targetDate: { lt: now },
      },
      orderBy: { targetDate: "asc" },
      take: 25,
    }),
    prisma.crew.findMany({
      where: {
        prepareJoinings: {
          some: {
            status: { in: ACTIVE_PREPARE_JOINING_STATUSES },
          },
        },
      },
      include: {
        documents: {
          where: { isActive: true },
          select: { id: true, docType: true, expiryDate: true },
        },
        medicalChecks: {
          orderBy: { expiryDate: "desc" },
          take: 5,
          select: { id: true, expiryDate: true, result: true },
        },
        orientations: {
          orderBy: { startDate: "desc" },
          take: 3,
          select: { id: true, startDate: true, status: true, remarks: true },
        },
        prepareJoinings: {
          where: { status: { in: ACTIVE_PREPARE_JOINING_STATUSES } },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            orientationCompleted: true,
            trainingRemarks: true,
            vessel: { select: { name: true } },
            principal: { select: { name: true } },
          },
        },
        assignments: {
          where: { status: { in: ["PLANNED", "ASSIGNED", "ACTIVE"] } },
          orderBy: { startDate: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            vessel: { select: { name: true } },
            principal: { select: { name: true } },
          },
        },
      },
    }),
    prisma.employmentContract.findMany({
      where: {
        contractEnd: {
          lte: fortyFiveDays,
        },
        status: {
          notIn: ["COMPLETED", "TERMINATED", "CANCELLED"],
        },
        crew: {
          assignments: {
            some: {
              status: {
                in: ["ONBOARD", "ACTIVE"],
              },
            },
          },
        },
      },
      orderBy: { contractEnd: "asc" },
      take: 25,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
        vessel: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const readiness = buildCrewReadinessDashboard(blockedPrepareJoiningCrews);

  const items: EscalationItem[] = [];

  for (const doc of expiringDocs) {
    const severity = doc.expiryDate && doc.expiryDate <= sevenDays ? "CRITICAL" : "HIGH";
    items.push({
      id: `doc-${doc.id}`,
      ruleCode: "DOC-EXPIRY",
      severity,
      owner: "CDMO",
      title: `${doc.docType} expiring for ${doc.crew.fullName}`,
      detail: `Renewal required before deployment and document control review.`,
      href: `/crewing/seafarers/${doc.crewId}/documents`,
    });
  }

  for (const capa of overdueCapa) {
    items.push({
      id: `capa-${capa.id}`,
      ruleCode: "CAPA-OVERDUE",
      severity: "CRITICAL",
      owner: "QMR",
      title: `${capa.capaNumber} overdue`,
      detail: `${capa.department} corrective action target date has passed.`,
      href: "/quality/corrective-actions",
    });
  }

  for (const contract of expiringContracts) {
    const alert = buildContractExpiryAlert(contract, now);
    let severity: EscalationItem["severity"] = "MEDIUM";
    if (alert.daysRemaining <= 14) {
      severity = "CRITICAL";
    } else if (alert.daysRemaining <= 30) {
      severity = "HIGH";
    }

    items.push({
      id: `contract-${contract.id}`,
      ruleCode: "CONTRACT-EXPIRY",
      severity,
      owner: "Operational / Director",
      title: `${contract.crew.fullName} contract ends in ${alert.daysRemaining} day(s)`,
      detail: `${contract.vessel?.name ?? "Unassigned vessel"} contract requires renewal decision or reliever planning before expiry.`,
      href: "/crewing/crew-list",
    });
  }

  for (const crew of readiness.notReady.slice(0, 25)) {
    if (crew.gaps.length === 0) continue;
    items.push({
      id: `readiness-${crew.id}`,
      ruleCode: "DEPLOY-BLOCK",
      severity: "HIGH",
      owner: "Operational / CDMO",
      title: `${crew.fullName} blocked for deployment`,
      detail: crew.gaps[0].detail,
      href: `/crewing/seafarers/${crew.id}/biodata`,
    });
  }

  const externalQueue = await prisma.externalCompliance.findMany({
    where: {
      status: {
        in: [ComplianceStatus.PENDING, ComplianceStatus.EXPIRED, ComplianceStatus.REJECTED],
      },
    },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
    take: 20,
    include: {
      crew: {
        select: {
          fullName: true,
        },
      },
    },
  });

  for (const item of externalQueue) {
    items.push({
      id: `ext-${item.id}`,
      ruleCode: "EXT-COMPLIANCE",
      severity: item.status === ComplianceStatus.EXPIRED ? "CRITICAL" : "MEDIUM",
      owner: "Compliance Desk",
      title: `${item.systemType} pending for ${item.crew.fullName}`,
      detail: `External compliance remains ${item.status.toLowerCase()} and may block mobilization.`,
      href: "/compliance/external",
    });
  }

  items.sort((left, right) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    return order[left.severity] - order[right.severity];
  });

  return {
    generatedAt: new Date().toISOString(),
    ruleCatalog: [
      {
        code: "DOC-EXPIRY",
        description: "Escalate crew documents expiring within 30 days. Raise to critical inside 7 days.",
      },
      {
        code: "CAPA-OVERDUE",
        description: "Escalate open corrective actions beyond target date to QMR.",
      },
      {
        code: "CONTRACT-EXPIRY",
        description: "Escalate onboard contracts inside 45 days. Raise to high inside 30 days and critical inside 14 days.",
      },
      {
        code: "DEPLOY-BLOCK",
        description: "Escalate not-ready crew already inside prepare joining or deployment workflow.",
      },
      {
        code: "EXT-COMPLIANCE",
        description: "Escalate pending, expired, or rejected external compliance items that can block joining.",
      },
    ],
    items,
  };
}
