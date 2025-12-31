import { prisma } from '@/lib/prisma';

export enum HgqsAuditAction {
  MANUAL_CREATED = 'HGQS_MANUAL_CREATED',
  MANUAL_UPDATED = 'HGQS_MANUAL_UPDATED',
  MANUAL_APPROVED = 'HGQS_MANUAL_APPROVED',
  MANUAL_REJECTED = 'HGQS_MANUAL_REJECTED',
  PROCEDURE_CREATED = 'HGQS_PROCEDURE_CREATED',
  PROCEDURE_UPDATED = 'HGQS_PROCEDURE_UPDATED',
  GUIDELINE_CREATED = 'HGQS_GUIDELINE_CREATED',
  GUIDELINE_UPDATED = 'HGQS_GUIDELINE_UPDATED',
  GUIDELINE_ACKNOWLEDGED = 'HGQS_GUIDELINE_ACKNOWLEDGED',
  GUIDELINE_REVOKED = 'HGQS_GUIDELINE_REVOKED',
  LEAVE_SUBMITTED = 'HGQS_LEAVE_SUBMITTED',
  LEAVE_REVIEWED = 'HGQS_LEAVE_REVIEWED',
  LEAVE_APPROVED = 'HGQS_LEAVE_APPROVED',
  LEAVE_REJECTED = 'HGQS_LEAVE_REJECTED',
  DISCIPLINARY_CREATED = 'HGQS_DISCIPLINARY_CREATED',
  DISCIPLINARY_UPDATED = 'HGQS_DISCIPLINARY_UPDATED',
  DISCIPLINARY_CLOSED = 'HGQS_DISCIPLINARY_CLOSED'
}

export type AuditEntityType =
  | 'HGQS_MANUAL_VERSION'
  | 'HGQS_PROCEDURE'
  | 'HGQS_GUIDELINE'
  | 'HGQS_GUIDELINE_ASSIGNMENT'
  | 'HGQS_ACKNOWLEDGEMENT'
  | 'HGQS_LEAVE_REQUEST'
  | 'HGQS_DISCIPLINARY_CASE';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'ssn',
  'passport',
  'salary',
  'medical',
  'financial'
]);

function sanitizePayload(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizePayload(entry));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) {
        result[key] = '[REDACTED]';
        continue;
      }
      result[key] = sanitizePayload(entry);
    }
    return result;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value);
}

interface AuditLogPayload {
  actorUserId: string;
  action: HgqsAuditAction | string;
  entityType: AuditEntityType | string;
  entityId: string;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export async function recordAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
  before,
  after
}: AuditLogPayload): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      metadataJson: metadata ? sanitizePayload(metadata) : null,
      oldValuesJson: before ? sanitizePayload(before) : null,
      newValuesJson: after ? sanitizePayload(after) : null
    }
  });
}

export async function logManualEvent(params: {
  actorUserId: string;
  manualId: string;
  action: Exclude<
    HgqsAuditAction,
    | HgqsAuditAction.PROCEDURE_CREATED
    | HgqsAuditAction.PROCEDURE_UPDATED
    | HgqsAuditAction.GUIDELINE_CREATED
    | HgqsAuditAction.GUIDELINE_UPDATED
    | HgqsAuditAction.GUIDELINE_ACKNOWLEDGED
    | HgqsAuditAction.GUIDELINE_REVOKED
    | HgqsAuditAction.LEAVE_SUBMITTED
    | HgqsAuditAction.LEAVE_REVIEWED
    | HgqsAuditAction.LEAVE_APPROVED
    | HgqsAuditAction.LEAVE_REJECTED
    | HgqsAuditAction.DISCIPLINARY_CREATED
    | HgqsAuditAction.DISCIPLINARY_UPDATED
    | HgqsAuditAction.DISCIPLINARY_CLOSED
  >;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await recordAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: 'HGQS_MANUAL_VERSION',
    entityId: params.manualId,
    metadata: params.metadata,
    before: params.before,
    after: params.after
  });
}

export async function logProcedureEvent(params: {
  actorUserId: string;
  procedureId: string;
  action: HgqsAuditAction.PROCEDURE_CREATED | HgqsAuditAction.PROCEDURE_UPDATED;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await recordAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: 'HGQS_PROCEDURE',
    entityId: params.procedureId,
    metadata: params.metadata,
    before: params.before,
    after: params.after
  });
}

export async function logGuidelineEvent(params: {
  actorUserId: string;
  guidelineId: string;
  action:
    | HgqsAuditAction.GUIDELINE_CREATED
    | HgqsAuditAction.GUIDELINE_UPDATED
    | HgqsAuditAction.GUIDELINE_ACKNOWLEDGED
    | HgqsAuditAction.GUIDELINE_REVOKED;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await recordAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: 'HGQS_GUIDELINE',
    entityId: params.guidelineId,
    metadata: params.metadata,
    before: params.before,
    after: params.after
  });
}

export async function logGuidelineAssignmentEvent(params: {
  actorUserId: string;
  assignmentId: string;
  action: HgqsAuditAction.GUIDELINE_UPDATED;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await recordAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: 'HGQS_GUIDELINE_ASSIGNMENT',
    entityId: params.assignmentId,
    metadata: params.metadata,
    before: params.before,
    after: params.after
  });
}

export async function logAcknowledgementEvent(params: {
  actorUserId: string;
  acknowledgementId: string;
  action:
    | HgqsAuditAction.GUIDELINE_ACKNOWLEDGED
    | HgqsAuditAction.GUIDELINE_REVOKED;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await recordAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: 'HGQS_ACKNOWLEDGEMENT',
    entityId: params.acknowledgementId,
    metadata: params.metadata,
    before: params.before,
    after: params.after
  });
}

export async function logLeaveEvent(params: {
  actorUserId: string;
  leaveId: string;
  action:
    | HgqsAuditAction.LEAVE_SUBMITTED
    | HgqsAuditAction.LEAVE_REVIEWED
    | HgqsAuditAction.LEAVE_APPROVED
    | HgqsAuditAction.LEAVE_REJECTED;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await recordAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: 'HGQS_LEAVE_REQUEST',
    entityId: params.leaveId,
    metadata: params.metadata,
    before: params.before,
    after: params.after
  });
}

export async function logDisciplinaryEvent(params: {
  actorUserId: string;
  caseId: string;
  action:
    | HgqsAuditAction.DISCIPLINARY_CREATED
    | HgqsAuditAction.DISCIPLINARY_UPDATED
    | HgqsAuditAction.DISCIPLINARY_CLOSED;
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await recordAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: 'HGQS_DISCIPLINARY_CASE',
    entityId: params.caseId,
    metadata: params.metadata,
    before: params.before,
    after: params.after
  });
}
