import { prisma } from '@/lib/prisma';
import { 
  ComplianceAudit, 
  ComplianceAuditFinding, 
  NonConformity, 
  NCCorrectiveAction,
  ComplianceAuditStatus,
  NonConformityStatus,
  NCCorrectiveActionStatus,
  NCFindingSeverity
} from '@prisma/client';

// ============================================================================
// AUDIT MANAGEMENT SERVICE
// ============================================================================

export async function createAudit(data: {
  auditNumber: string;
  auditType: string;
  scope?: string;
  objectives?: string;
  auditCriteria?: string;
  leadAuditorId: string;
  assistantAuditors?: string;
  auditeeContactPerson?: string;
  auditeeContactEmail?: string;
  auditeeContactPhone?: string;
  estimatedDuration?: number;
  location?: string;
  auditDate?: Date;
}): Promise<ComplianceAudit> {
  return prisma.complianceAudit.create({
    data: {
      auditNumber: data.auditNumber,
      auditType: data.auditType,
      scope: data.scope || '',
      objectives: data.objectives || '',
      auditCriteria: data.auditCriteria || '',
      leadAuditorId: data.leadAuditorId,
      assistantAuditors: data.assistantAuditors || '',
      auditeeContactPerson: data.auditeeContactPerson || '',
      auditeeContactEmail: data.auditeeContactEmail || '',
      auditeeContactPhone: data.auditeeContactPhone || '',
      estimatedDuration: data.estimatedDuration || 0,
      location: data.location || '',
      auditDate: data.auditDate || new Date(),
      status: 'PLANNED',
    },
  });
}

export async function startAudit(auditId: string): Promise<ComplianceAudit> {
  return prisma.complianceAudit.update({
    where: { id: auditId },
    data: {
      status: 'IN_PROGRESS',
      startDate: new Date(),
    },
  });
}

export async function completeAudit(auditId: string): Promise<ComplianceAudit> {
  return prisma.complianceAudit.update({
    where: { id: auditId },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
    },
  });
}

export async function closeAudit(auditId: string): Promise<ComplianceAudit> {
  return prisma.complianceAudit.update({
    where: { id: auditId },
    data: {
      status: 'CANCELLED',
    },
  });
}

export async function getAuditWithDetails(auditId: string) {
  return prisma.complianceAudit.findUnique({
    where: { id: auditId },
  });
}

export async function listAudits(filters?: {
  status?: ComplianceAuditStatus;
  auditType?: string;
  limit?: number;
  offset?: number;
}) {
  const take = filters?.limit || 20;
  const skip = filters?.offset || 0;
  const orderBy = { auditDate: 'desc' as const };

  // No filters - return all audits
  if (!filters?.status && !filters?.auditType) {
    return prisma.complianceAudit.findMany({
      take,
      skip,
      orderBy,
    });
  }

  // With filters - build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.auditType) where.auditType = filters.auditType;

  return prisma.complianceAudit.findMany({
    where,
    take,
    skip,
    orderBy,
  });
}

// ============================================================================
// AUDIT FINDING SERVICE
// ============================================================================

export async function createAuditFinding(data: {
  auditId: string;
  findingCode: string;
  description: string;
  severity?: NCFindingSeverity;
  relatedDocId?: string;
  relatedProcess?: string;
  assignedToId?: string;
  dueDate?: Date;
}): Promise<ComplianceAuditFinding> {
  return prisma.complianceAuditFinding.create({
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

export async function closeFinding(findingId: string): Promise<ComplianceAuditFinding> {
  return prisma.complianceAuditFinding.update({
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
  findingId?: string;
  description: string;
  rootCause?: string;
  correctionAction?: string;
  preventionAction?: string;
  targetDate?: Date;
}): Promise<NonConformity> {
  return prisma.nonConformity.create({
    data: {
      id: `nc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      auditId: data.auditId,
      findingId: data.findingId,
      description: data.description,
      rootCause: data.rootCause,
      correctionAction: data.correctionAction,
      preventionAction: data.preventionAction,
      targetDate: data.targetDate,
      status: 'OPEN',
    },
  });
}

export async function updateNonConformityStatus(
  ncId: string,
  status: string,
  completedDate?: Date
): Promise<NonConformity> {
  const updateData: Record<string, unknown> = { status };
  
  if (status === 'RESOLVED' || status === 'VERIFIED' || status === 'CLOSED') {
    updateData.completionDate = completedDate || new Date();
  }

  return prisma.nonConformity.update({
    where: { id: ncId },
    data: updateData,
  });
}
      verifiedBy: { select: { id: true, name: true } },
      correctiveActions: true,
    },
  });
}

export async function getNonConformityWithActions(ncId: string) {
  return prisma.nonConformity.findUnique({
    where: { id: ncId },
    include: {
      audit: {
        select: { id: true, auditNumber: true, auditType: true },
      },
      finding: {
        select: { id: true, findingNumber: true, description: true },
      },
    },
  });
}

export async function listNonConformities(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return prisma.nonConformity.findMany({
    where: {
      status: filters?.status,
    },
    include: {
      audit: { select: { id: true, auditNumber: true } },
      finding: { select: { id: true, findingNumber: true } },
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
}): Promise<NCCorrectiveAction> {
  return prisma.nCCorrectiveAction.create({
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
  status: NCCorrectiveActionStatus,
  verifiedById?: string,
  completedDate?: Date
): Promise<NCCorrectiveAction> {
  const updateData: Record<string, unknown> = { status };

  if (status === 'COMPLETED') {
    updateData.completedDate = completedDate || new Date();
  } else if (status === 'VERIFIED') {
    updateData.verifiedDate = new Date();
    updateData.verifiedById = verifiedById;
  } else if (status === 'CLOSED') {
    updateData.verifiedDate = new Date();
    updateData.verifiedById = verifiedById;
  }

  return prisma.nCCorrectiveAction.update({
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
  status?: NCCorrectiveActionStatus;
  assignedToId?: string;
  overduOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {
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

  return prisma.nCCorrectiveAction.findMany({
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
    prisma.complianceAudit.count(),
    prisma.complianceAudit.count({ where: { status: 'PLANNED' } }),
    prisma.complianceAudit.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.complianceAudit.count({ where: { status: 'COMPLETED' } }),
    prisma.complianceAuditFinding.count(),
    prisma.complianceAuditFinding.count({ where: { severity: 'CRITICAL' } }),
    prisma.nonConformity.count(),
    prisma.nonConformity.count({ where: { status: 'OPEN' } }),
    prisma.nonConformity.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        targetDate: { lt: new Date() },
      },
    }),
    prisma.nCCorrectiveAction.count(),
    prisma.nCCorrectiveAction.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
    }),
    prisma.nCCorrectiveAction.count({
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

  const audits = await prisma.complianceAudit.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  return audits;
}
