import { prisma } from '@/lib/prisma';
import type { 
  ComplianceAudit, 
  ComplianceAuditFinding, 
  NonConformity,
  ComplianceAuditStatus,
  NCFindingSeverity
} from '@prisma/client';
import type { Prisma } from '@prisma/client';

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

// TODO: Fix createNonConformity - schema mismatch with fields
// Currently disabled - use direct Prisma queries instead
/*
export async function createNonConformity(data: {
  auditId: string;
  findingId?: string;
  description: string;
  rootCause?: string;
  correctionAction?: string;
  preventionAction?: string;
  targetDate?: Date;
}): Promise<NonConformity> {
  // TODO: Fix findingId field - currently disabled due to schema mismatch
  return prisma.nonConformity.create({
    data: {
      id: `nc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      auditId: data.auditId,
      // findingId: data.findingId,  // DISABLED - schema doesn't have this field
      description: data.description,
      rootCause: data.rootCause,
      correctionAction: data.correctionAction,
      preventionAction: data.preventionAction,
      targetDate: data.targetDate,
      status: 'OPEN',
    },
  });
}
*/

/*
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

export async function getNonConformityWithActions(ncId: string) {
  return prisma.nonConformity.findUnique({
    where: { id: ncId },
    include: {
      audit: {
        select: { id: true, auditNumber: true, auditType: true },
      },
      finding: {
        select: { id: true, findingCode: true, description: true },
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
      finding: { select: { id: true, findingCode: true } },
    },
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
    orderBy: { targetDate: 'asc' },
  });
}
*/

// ============================================================================
// CORRECTIVE ACTION SERVICE
// ============================================================================

// TODO: FIXME - createCorrectiveAction disabled due to schema mismatch
// The CorrectiveAction model fields don't match what this code expects
// Schema requires: formNumber, capaNumber, type, source, department, nonconformity (text), etc.
// This code tries to use: nonConformityId, caNumber, action, assignedToId, dueDate, evidenceDoc
/*
export async function createCorrectiveAction(data: {
  nonConformityId: string;
  caNumber: string;
  action: string;
  assignedToId: string;
  dueDate: Date;
  evidenceDoc?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<any> { // TODO: Fix CorrectiveAction/NCCorrectiveAction schema mismatch
  return prisma.correctiveAction.create({
    data: {
      nonConformityId: data.nonConformityId,
      caNumber: data.caNumber,
      action: data.action,
      assignedToId: data.assignedToId,
      dueDate: data.dueDate,
      evidenceDoc: data.evidenceDoc,
      status: 'OPEN',
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}
*/

// // TODO: FIXME - All CorrectiveAction functions disabled - schema mismatch
/*
export async function updateCAStatus(
  caId: string,
  status: CorrectiveActionStatus,
  verifiedById?: string,
  completedDate?: Date
): Promise<CorrectiveAction> {
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
*/

/*
export async function listCorrectiveActions(filters?: {
  status?: CorrectiveActionStatus;
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
*/

// ============================================================================
// AUDIT STATISTICS & ANALYTICS
// ============================================================================

export async function getAuditStats() {
  // Return dummy data for disabled audit stats
  return {
    audits: { total: 0, planned: 0, inProgress: 0, completed: 0 },
    findings: { total: 0, critical: 0 },
    nonConformities: { total: 0, open: 0, overdue: 0 },
    correctiveActions: { total: 0, open: 0, overdue: 0 },
  };
}

/*
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
*/
