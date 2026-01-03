import { prisma } from '@/lib/prisma';
import { 
  Audit, 
  AuditFinding, 
  NonConformity, 
  CorrectiveAction,
  AuditStatus,
  NonConformityStatus,
  CorrectiveActionStatus,
  FindingSeverity,
  AuditType
} from '@prisma/client';

// ============================================================================
// AUDIT MANAGEMENT SERVICE
// ============================================================================

export async function createAudit(data: {
  auditCode: string;
  auditType: AuditType;
  title: string;
  description?: string;
  scope?: string;
  leadAuditorId: string;
  teamMembers?: string[];
  plannedDate: Date;
}): Promise<Audit> {
  return prisma.audit.create({
    data: {
      auditCode: data.auditCode,
      auditType: data.auditType,
      title: data.title,
      description: data.description,
      scope: data.scope,
      leadAuditorId: data.leadAuditorId,
      teamMembers: data.teamMembers || [],
      plannedDate: data.plannedDate,
      status: 'PLANNED',
    },
    include: {
      leadAuditor: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function startAudit(auditId: string): Promise<Audit> {
  return prisma.audit.update({
    where: { id: auditId },
    data: {
      status: 'IN_PROGRESS',
      startDate: new Date(),
    },
  });
}

export async function completeAudit(auditId: string): Promise<Audit> {
  return prisma.audit.update({
    where: { id: auditId },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
    },
  });
}

export async function closeAudit(auditId: string): Promise<Audit> {
  return prisma.audit.update({
    where: { id: auditId },
    data: {
      status: 'CLOSED',
    },
  });
}

export async function getAuditWithDetails(auditId: string) {
  return prisma.audit.findUnique({
    where: { id: auditId },
    include: {
      leadAuditor: { select: { id: true, name: true, email: true } },
      findings: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      },
      nonConformities: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          verifiedBy: { select: { id: true, name: true } },
          correctiveActions: true,
        },
      },
    },
  });
}

export async function listAudits(filters?: {
  status?: AuditStatus;
  auditType?: AuditType;
  limit?: number;
  offset?: number;
}) {
  return prisma.audit.findMany({
    where: {
      status: filters?.status,
      auditType: filters?.auditType,
    },
    include: {
      leadAuditor: { select: { id: true, name: true, email: true } },
      findings: { select: { id: true } },
      nonConformities: { select: { id: true } },
    },
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
    orderBy: { plannedDate: 'desc' },
  });
}

// ============================================================================
// AUDIT FINDING SERVICE
// ============================================================================

export async function createAuditFinding(data: {
  auditId: string;
  findingCode: string;
  description: string;
  severity?: FindingSeverity;
  relatedDocId?: string;
  relatedProcess?: string;
  assignedToId?: string;
  dueDate?: Date;
}): Promise<AuditFinding> {
  return prisma.auditFinding.create({
    data: {
      auditId: data.auditId,
      findingCode: data.findingCode,
      description: data.description,
      severity: data.severity || 'MINOR',
      relatedDocId: data.relatedDocId,
      relatedProcess: data.relatedProcess,
      assignedToId: data.assignedToId,
      dueDate: data.dueDate,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function closeFinding(findingId: string): Promise<AuditFinding> {
  return prisma.auditFinding.update({
    where: { id: findingId },
    data: {
      closedDate: new Date(),
    },
  });
}

// ============================================================================
// NON-CONFORMITY SERVICE
// ============================================================================

export async function createNonConformity(data: {
  auditId: string;
  ncNumber: string;
  description: string;
  rootCause?: string;
  assignedToId: string;
  targetDate: Date;
}): Promise<NonConformity> {
  return prisma.nonConformity.create({
    data: {
      auditId: data.auditId,
      ncNumber: data.ncNumber,
      description: data.description,
      rootCause: data.rootCause,
      assignedToId: data.assignedToId,
      targetDate: data.targetDate,
      status: 'OPEN',
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      correctiveActions: true,
    },
  });
}

export async function updateNonConformityStatus(
  ncId: string,
  status: NonConformityStatus,
  verifiedById?: string
): Promise<NonConformity> {
  const updateData: any = { status };
  
  if (status === 'RESOLVED') {
    updateData.resolvedDate = new Date();
  } else if (status === 'VERIFIED') {
    updateData.verifiedDate = new Date();
    updateData.verifiedById = verifiedById;
  } else if (status === 'CLOSED') {
    updateData.verifiedDate = new Date();
    updateData.verifiedById = verifiedById;
  }

  return prisma.nonConformity.update({
    where: { id: ncId },
    data: updateData,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      verifiedBy: { select: { id: true, name: true } },
      correctiveActions: true,
    },
  });
}

export async function getNonConformityWithActions(ncId: string) {
  return prisma.nonConformity.findUnique({
    where: { id: ncId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      verifiedBy: { select: { id: true, name: true } },
      correctiveActions: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      },
      audit: {
        select: { id: true, auditCode: true, title: true },
      },
    },
  });
}

export async function listNonConformities(filters?: {
  status?: NonConformityStatus;
  assignedToId?: string;
  limit?: number;
  offset?: number;
}) {
  return prisma.nonConformity.findMany({
    where: {
      status: filters?.status,
      assignedToId: filters?.assignedToId,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      audit: { select: { id: true, auditCode: true } },
      correctiveActions: { select: { id: true } },
    },
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
    orderBy: { targetDate: 'asc' },
  });
}

// ============================================================================
// CORRECTIVE ACTION SERVICE
// ============================================================================

export async function createCorrectiveAction(data: {
  nonConformityId: string;
  caNumber: string;
  action: string;
  assignedToId: string;
  dueDate: Date;
  evidenceDoc?: string;
}): Promise<CorrectiveAction> {
  return prisma.correctiveAction.create({
    data: {
      nonConformityId: data.nonConformityId,
      caNumber: data.caNumber,
      action: data.action,
      assignedToId: data.assignedToId,
      dueDate: data.dueDate,
      evidenceDoc: data.evidenceDoc,
      status: 'PENDING',
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateCAStatus(
  caId: string,
  status: CorrectiveActionStatus,
  verifiedById?: string,
  completedDate?: Date
): Promise<CorrectiveAction> {
  const updateData: any = { status };

  if (status === 'COMPLETED') {
    updateData.completedDate = completedDate || new Date();
  } else if (status === 'VERIFIED') {
    updateData.verifiedDate = new Date();
    updateData.verifiedById = verifiedById;
  } else if (status === 'CLOSED') {
    updateData.verifiedDate = new Date();
    updateData.verifiedById = verifiedById;
  }

  return prisma.correctiveAction.update({
    where: { id: caId },
    data: updateData,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      verifiedBy: { select: { id: true, name: true } },
      nonConformity: { select: { id: true, ncNumber: true } },
    },
  });
}

export async function listCorrectiveActions(filters?: {
  status?: CorrectiveActionStatus;
  assignedToId?: string;
  overduOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = {
    status: filters?.status,
    assignedToId: filters?.assignedToId,
  };

  if (filters?.overduOnly) {
    where.dueDate = {
      lt: new Date(),
    };
    where.status = {
      in: ['PENDING', 'IN_PROGRESS'],
    };
  }

  return prisma.correctiveAction.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      nonConformity: { select: { id: true, ncNumber: true } },
    },
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
    orderBy: { dueDate: 'asc' },
  });
}

// ============================================================================
// AUDIT STATISTICS & ANALYTICS
// ============================================================================

export async function getAuditStats() {
  const [
    totalAudits,
    plannedAudits,
    inProgressAudits,
    completedAudits,
    totalFindings,
    criticalFindings,
    totalNCs,
    openNCs,
    overdueNCs,
    totalCAs,
    openCAs,
    overdueCAs,
  ] = await Promise.all([
    prisma.audit.count(),
    prisma.audit.count({ where: { status: 'PLANNED' } }),
    prisma.audit.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.audit.count({ where: { status: 'COMPLETED' } }),
    prisma.auditFinding.count(),
    prisma.auditFinding.count({ where: { severity: 'CRITICAL' } }),
    prisma.nonConformity.count(),
    prisma.nonConformity.count({ where: { status: 'OPEN' } }),
    prisma.nonConformity.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        targetDate: { lt: new Date() },
      },
    }),
    prisma.correctiveAction.count(),
    prisma.correctiveAction.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
    }),
    prisma.correctiveAction.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return {
    audits: {
      total: totalAudits,
      planned: plannedAudits,
      inProgress: inProgressAudits,
      completed: completedAudits,
    },
    findings: {
      total: totalFindings,
      critical: criticalFindings,
    },
    nonConformities: {
      total: totalNCs,
      open: openNCs,
      overdue: overdueNCs,
    },
    correctiveActions: {
      total: totalCAs,
      open: openCAs,
      overdue: overdueCAs,
    },
  };
}

export async function getAuditTrendData(months: number = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const audits = await prisma.audit.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  return audits;
}
