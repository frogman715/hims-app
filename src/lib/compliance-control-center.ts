import { prisma } from "@/lib/prisma";
import { buildCrewReadinessDashboard } from "@/lib/crewing-readiness";
import { QMSAdvancedAnalytics } from "@/lib/qms/advanced-analytics";
import { getHRComplianceStats } from "@/lib/compliance/service";
import { ComplianceStatus, PrepareJoiningStatus } from "@prisma/client";

const READINESS_STATUSES: PrepareJoiningStatus[] = [
  PrepareJoiningStatus.PENDING,
  PrepareJoiningStatus.DOCUMENTS,
  PrepareJoiningStatus.MEDICAL,
  PrepareJoiningStatus.TRAINING,
  PrepareJoiningStatus.TRAVEL,
  PrepareJoiningStatus.READY,
];

const NON_READY_STATUSES: ComplianceStatus[] = [
  ComplianceStatus.PENDING,
  ComplianceStatus.EXPIRED,
  ComplianceStatus.REJECTED,
];

export type ControlCenterCard = {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "rose" | "cyan";
  detail: string;
  href: string;
};

export type ControlCenterWatchItem = {
  id: string;
  crewId: string;
  fullName: string;
  crewCode: string | null;
  rank: string;
  issue: string;
  detail: string;
  href: string;
};

export type ControlCenterExternalItem = {
  id: string;
  crewId: string;
  crewName: string;
  rank: string;
  systemType: string;
  status: string;
  expiryDate: string | null;
  href: string;
};

export type ControlCenterNonconformityItem = {
  id: string;
  title: string;
  severity: string;
  status: string;
  dueDate: string | null;
  href: string;
};

export type ControlCenterStandardItem = {
  code: string;
  title: string;
  detail: string;
  href: string;
};

export type ComplianceControlCenterData = {
  generatedAt: string;
  cards: ControlCenterCard[];
  standards: ControlCenterStandardItem[];
  readinessWatch: ControlCenterWatchItem[];
  expiringDocuments: Array<{
    id: string;
    crewId: string;
    crewName: string;
    docType: string;
    expiryDate: string | null;
    href: string;
  }>;
  externalQueue: ControlCenterExternalItem[];
  qmsAlerts: Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    dueDate: string | null;
  }>;
  nonconformities: ControlCenterNonconformityItem[];
  summary: {
    readiness: {
      crewPool: number;
      readyToDeploy: number;
      notReady: number;
      expiringSoon: number;
    };
    qms: {
      complianceScore: number;
      documentCoverage: number;
      openAlerts: number;
      criticalAlerts: number;
    };
    hrCompliance: {
      overdueTrainings: number;
      expiringCertifications: number;
      overdueGaps: number;
    };
    audits: {
      openAudits: number;
      overdueCorrectiveActions: number;
    };
  };
};

function formatDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function getComplianceControlCenterData(): Promise<ComplianceControlCenterData> {
  const now = new Date();
  const warningDate = new Date(now);
  warningDate.setDate(warningDate.getDate() + 30);

  const [
    standbyCrews,
    expiringDocuments,
    externalQueueRaw,
    qmsMetrics,
    hrCompliance,
    nonconformitiesRaw,
    openAudits,
    overdueCorrectiveActions,
  ] = await Promise.all([
    prisma.crew.findMany({
      where: {
        status: "STANDBY",
        recruitments: {
          none: {
            status: {
              in: ["APPLICANT", "SCREENING", "INTERVIEW", "SELECTED", "APPROVED", "ON_HOLD", "WITHDRAWN", "REJECTED"],
            },
          },
        },
      },
      orderBy: { fullName: "asc" },
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
          where: { status: { in: READINESS_STATUSES } },
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
    prisma.crewDocument.findMany({
      where: {
        isActive: true,
        expiryDate: {
          gte: now,
          lte: warningDate,
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 8,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.externalCompliance.findMany({
      where: {
        status: {
          in: NON_READY_STATUSES,
        },
      },
      orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
      },
    }),
    QMSAdvancedAnalytics.getDashboardMetrics(),
    getHRComplianceStats(),
    prisma.nonconformityRecord.findMany({
      where: {
        status: { not: "CLOSED" },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.complianceAudit.count({
      where: {
        status: {
          in: ["PLANNED", "IN_PROGRESS"],
        },
      },
    }),
    prisma.correctiveAction.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
        targetDate: { lt: now },
      },
    }),
  ]);

  const readiness = buildCrewReadinessDashboard(standbyCrews);
  const criticalAlerts = qmsMetrics.alerts.filter((alert) => alert.severity === "CRITICAL").length;

  const cards: ControlCenterCard[] = [
    {
      label: "Ready to deploy",
      value: readiness.totals.readyToDeploy,
      tone: "emerald",
      detail: "Standby crew meeting core deployment checks",
      href: "/crewing/readiness",
    },
    {
      label: "Blocked crew",
      value: readiness.totals.notReady,
      tone: "rose",
      detail: "Crew with MLC/STCW blocking gaps",
      href: "/crewing/readiness",
    },
    {
      label: "Expiring crew docs",
      value: readiness.totals.expiringSoon,
      tone: "amber",
      detail: "Passport, seaman book, or medical nearing expiry",
      href: "/crewing/readiness-board",
    },
    {
      label: "Open QMS alerts",
      value: qmsMetrics.alerts.length,
      tone: "cyan",
      detail: "Live audit, document, and NC alerts",
      href: "/quality/qms-dashboard",
    },
    {
      label: "External pending",
      value: externalQueueRaw.length,
      tone: "slate",
      detail: "Flag/principal compliance queue requiring action",
      href: "/compliance/external",
    },
    {
      label: "Overdue CAPA",
      value: overdueCorrectiveActions,
      tone: "rose",
      detail: "Corrective actions past due",
      href: "/quality/corrective-actions",
    },
  ];

  const standards: ControlCenterStandardItem[] = [
    {
      code: "MLC 2006",
      title: "Crew welfare and employment readiness",
      detail: "Contracts, medical fitness, welfare evidence, and deployment checks before sign-on.",
      href: "/crewing/readiness",
    },
    {
      code: "IMO STCW",
      title: "Training and certificate validity",
      detail: "Monitor certificate expiry, training completion, and readiness gaps affecting mobilization.",
      href: "/crewing/readiness-board",
    },
    {
      code: "IMO ISM",
      title: "Document control, audits, and CAPA",
      detail: "Keep audit findings, non-conformities, and corrective actions visible in one operating picture.",
      href: "/quality/qms-dashboard",
    },
  ];

  const readinessWatch = readiness.notReady.slice(0, 8).map((crew) => {
    const firstGap = crew.gaps[0];
    return {
      id: crew.id,
      crewId: crew.id,
      fullName: crew.fullName,
      crewCode: crew.crewCode,
      rank: crew.rank,
      issue: firstGap?.label ?? "Readiness review",
      detail: firstGap?.detail ?? "Crew has unresolved readiness items.",
      href: `/crewing/seafarers/${crew.id}/biodata`,
    };
  });

  const externalQueue = externalQueueRaw.map((item) => ({
    id: item.id,
    crewId: item.crewId,
    crewName: item.crew?.fullName ?? "Unknown crew",
    rank: item.crew?.rank ?? "-",
    systemType: item.systemType,
    status: item.status,
    expiryDate: formatDate(item.expiryDate),
    href: "/compliance/external",
  }));

  const nonconformities = nonconformitiesRaw.map((item) => ({
    id: item.id,
    title: item.description,
    severity: item.severity ?? "MEDIUM",
    status: item.status,
    dueDate: formatDate(item.dueDate),
    href: "/nonconformity",
  }));

  return {
    generatedAt: new Date().toISOString(),
    cards,
    standards,
    readinessWatch,
    expiringDocuments: expiringDocuments.map((item) => ({
      id: item.id,
      crewId: item.crewId,
      crewName: item.crew.fullName,
      docType: item.docType,
      expiryDate: formatDate(item.expiryDate),
      href: `/crewing/seafarers/${item.crewId}/documents`,
    })),
    externalQueue,
    qmsAlerts: qmsMetrics.alerts.slice(0, 8).map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      dueDate: formatDate(alert.dueDate ?? null),
    })),
    nonconformities,
    summary: {
      readiness: readiness.totals,
      qms: {
        complianceScore: qmsMetrics.kpis.complianceScore,
        documentCoverage: qmsMetrics.kpis.documentCoverage,
        openAlerts: qmsMetrics.alerts.length,
        criticalAlerts,
      },
      hrCompliance: {
        overdueTrainings: hrCompliance.trainings.overdue,
        expiringCertifications: hrCompliance.certifications.expiring,
        overdueGaps: hrCompliance.complianceGaps.overdue,
      },
      audits: {
        openAudits,
        overdueCorrectiveActions,
      },
    },
  };
}
