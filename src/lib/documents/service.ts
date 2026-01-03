import { prisma } from '@/lib/prisma';
import {
  DocumentControlStatus,
  ApprovalStatus,
  Role,
  RetentionPeriod,
} from '@prisma/client';
import {
  hasDocumentPermission,
} from './permissions';

/**
 * Create a new document
 */
export async function createDocument(input: {
  code: string;
  title: string;
  description?: string;
  documentType: string;
  department: string;
  retentionPeriod: string;
  effectiveDate: Date;
  createdById: string;
  contentUrl?: string;
  fileName?: string;
  fileSize?: number;
}) {
  // Check if code already exists
  const existing = await prisma.documentControl.findUnique({
    where: { code: input.code },
  });

  if (existing) {
    throw new Error(`Document code ${input.code} already exists`);
  }

  const document = await prisma.documentControl.create({
    data: {
      code: input.code,
      title: input.title,
      description: input.description,
      documentType: input.documentType,
      department: input.department,
      retentionPeriod: input.retentionPeriod as RetentionPeriod,
      effectiveDate: input.effectiveDate,
      status: DocumentControlStatus.DRAFT,
      createdById: input.createdById,
      contentUrl: input.contentUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Create initial revision v0
  await prisma.documentRevision.create({
    data: {
      documentId: document.id,
      revisionNumber: 0,
      changesSummary: 'Initial creation',
      revisionUrl: input.contentUrl,
      fileName: input.fileName,
      createdById: input.createdById,
    },
  });

  return document;
}

/**
 * Update document (only if in DRAFT status)
 */
export async function updateDocument(
  documentId: string,
  input: {
    title?: string;
    description?: string;
    documentType?: string;
    department?: string;
    contentUrl?: string;
    fileName?: string;
    fileSize?: number;
    userId: string;
    userRole: Role;
  }
) {
  // Check permissions
  if (!hasDocumentPermission(input.userRole, 'canEdit')) {
    throw new Error('You do not have permission to edit documents');
  }

  const document = await prisma.documentControl.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.status !== DocumentControlStatus.DRAFT) {
    throw new Error(
      'Can only edit documents in DRAFT status'
    );
  }

  const updated = await prisma.documentControl.update({
    where: { id: documentId },
    data: {
      title: input.title || document.title,
      description: input.description || document.description,
      documentType: input.documentType || document.documentType,
      department: input.department || document.department,
      contentUrl: input.contentUrl || document.contentUrl,
      fileName: input.fileName || document.fileName,
      fileSize: input.fileSize || document.fileSize,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return updated;
}

/**
 * Submit document for approval
 */
export async function submitForApproval(
  documentId: string,
  userId: string,
  userRole: Role
) {
  // Check permissions
  if (!hasDocumentPermission(userRole, 'canSubmit')) {
    throw new Error('You do not have permission to submit for approval');
  }

  const document = await prisma.documentControl.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.status !== DocumentControlStatus.DRAFT) {
    throw new Error('Only DRAFT documents can be submitted for approval');
  }

  // Update document status
  await prisma.documentControl.update({
    where: { id: documentId },
    data: {
      status: DocumentControlStatus.FOR_APPROVAL,
    },
  });

  // Create approval workflow (QMR first, then Director)
  const approvalLevels = [
    { level: 1, role: 'QMR' },
    { level: 2, role: 'DIRECTOR' },
  ];

  for (const approval of approvalLevels) {
    // Find user with this role to assign to
    const approver = await prisma.user.findFirst({
      where: { role: approval.role as Role },
    });

    if (approver) {
      await prisma.documentApproval.create({
        data: {
          documentId: documentId,
          approvalLevel: approval.level,
          approvalRole: approval.role,
          status: ApprovalStatus.PENDING,
          assignedToId: approver.id,
        },
      });
    }
  }

  return await prisma.documentControl.findUnique({
    where: { id: documentId },
    include: {
      approvals: {
        orderBy: { approvalLevel: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

/**
 * Approve document at current approval level
 */
export async function approveDocument(
  documentId: string,
  approvalId: string,
  userId: string,
  userRole: Role,
  comments?: string
) {
  // Check permissions
  if (!hasDocumentPermission(userRole, 'canApprove')) {
    throw new Error('You do not have permission to approve documents');
  }

  const approval = await prisma.documentApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error('Approval record not found');
  }

  if (approval.documentId !== documentId) {
    throw new Error('Approval does not belong to this document');
  }

  // Check if user is assigned to this approval
  if (approval.assignedToId !== userId) {
    throw new Error('This approval is not assigned to you');
  }

  if (approval.status !== ApprovalStatus.PENDING) {
    throw new Error('Approval already processed');
  }

  // Update approval
  await prisma.documentApproval.update({
    where: { id: approvalId },
    data: {
      status: ApprovalStatus.APPROVED,
      approvedById: userId,
      approvalComments: comments,
      approvedAt: new Date(),
    },
  });

  // Check if this was the last approval level
  const pendingApprovalsCount = await prisma.documentApproval.count({
    where: {
      documentId: documentId,
      status: ApprovalStatus.PENDING,
    },
  });

  if (pendingApprovalsCount === 0) {
    // All approvals complete - mark document as APPROVED
    await prisma.documentControl.update({
      where: { id: documentId },
      data: {
        status: DocumentControlStatus.APPROVED,
      },
    });
  }

  return await prisma.documentControl.findUnique({
    where: { id: documentId },
    include: {
      approvals: {
        orderBy: { approvalLevel: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

/**
 * Reject document
 */
export async function rejectDocument(
  documentId: string,
  approvalId: string,
  userId: string,
  rejectionReason: string
) {
  const approval = await prisma.documentApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error('Approval record not found');
  }

  if (approval.assignedToId !== userId) {
    throw new Error('This approval is not assigned to you');
  }

  // Update approval
  await prisma.documentApproval.update({
    where: { id: approvalId },
    data: {
      status: ApprovalStatus.REJECTED,
      approvedById: userId,
      rejectionReason: rejectionReason,
      approvedAt: new Date(),
    },
  });

  // Revert document to DRAFT
  await prisma.documentControl.update({
    where: { id: documentId },
    data: {
      status: DocumentControlStatus.DRAFT,
    },
  });

  // Mark all other pending approvals as REVOKED
  await prisma.documentApproval.updateMany({
    where: {
      documentId: documentId,
      status: ApprovalStatus.PENDING,
    },
    data: {
      status: ApprovalStatus.REVOKED,
    },
  });

  return await prisma.documentControl.findUnique({
    where: { id: documentId },
    include: {
      approvals: {
        orderBy: { approvalLevel: 'asc' },
      },
    },
  });
}

/**
 * Distribute document to users
 */
export async function distributeDocument(
  documentId: string,
  recipientIds: string[],
  userId: string,
  userRole: Role
) {
  // Check permissions
  if (!hasDocumentPermission(userRole, 'canDistribute')) {
    throw new Error('You do not have permission to distribute documents');
  }

  const document = await prisma.documentControl.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.status !== DocumentControlStatus.APPROVED) {
    throw new Error('Can only distribute APPROVED documents');
  }

  // Create distributions
  const distributions = await Promise.all(
    recipientIds.map((recipientId) =>
      prisma.documentDistribution.upsert({
        where: {
          documentId_recipientId: {
            documentId: documentId,
            recipientId: recipientId,
          },
        },
        update: {
          distributedAt: new Date(),
        },
        create: {
          documentId: documentId,
          recipientId: recipientId,
          distributionType: 'SYSTEM_NOTIFICATION',
          requiresAcknowledgement: true,
        },
        include: {
          recipient: { select: { id: true, name: true, email: true } },
        },
      })
    )
  );

  // Update document status to ACTIVE if not already
  const currentDoc = await prisma.documentControl.findUnique({
    where: { id: documentId },
  });

  if (currentDoc && currentDoc.status !== DocumentControlStatus.ACTIVE) {
    await prisma.documentControl.update({
      where: { id: documentId },
      data: {
        status: DocumentControlStatus.ACTIVE,
      },
    });
  }

  return distributions;
}

/**
 * Acknowledge document
 */
export async function acknowledgeDocument(
  documentId: string,
  userId: string,
  remarks?: string
) {
  const document = await prisma.documentControl.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // Check if user has received this document
  const distribution = await prisma.documentDistribution.findFirst({
    where: {
      documentId: documentId,
      recipientId: userId,
    },
  });

  if (!distribution) {
    throw new Error('You have not received this document');
  }

  // Create or update acknowledgement
  const acknowledgement = await prisma.documentAcknowledgement.upsert({
    where: {
      documentId_acknowledgedById: {
        documentId: documentId,
        acknowledgedById: userId,
      },
    },
    update: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      remarks: remarks,
    },
    create: {
      documentId: documentId,
      acknowledgedById: userId,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      remarks: remarks,
    },
    include: {
      acknowledgedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return acknowledgement;
}

/**
 * Get document with revisions and history
 */
export async function getDocumentHistory(documentId: string) {
  const document = await prisma.documentControl.findUnique({
    where: { id: documentId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      revisions: {
        orderBy: { revisionNumber: 'asc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      },
      approvals: {
        orderBy: { approvalLevel: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      },
      distributions: {
        include: {
          recipient: { select: { id: true, name: true, email: true } },
        },
      },
      acknowledgements: {
        include: {
          acknowledgedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return document;
}

/**
 * Delete document (only if DRAFT)
 */
export async function deleteDocument(
  documentId: string,
  userId: string,
  userRole: Role
) {
  // Check permissions
  if (!hasDocumentPermission(userRole, 'canDelete')) {
    throw new Error('You do not have permission to delete documents');
  }

  const document = await prisma.documentControl.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.status !== DocumentControlStatus.DRAFT) {
    throw new Error('Can only delete documents in DRAFT status');
  }

  // Delete all related records (cascade handled by Prisma)
  await prisma.documentControl.delete({
    where: { id: documentId },
  });

  return { success: true, message: 'Document deleted successfully' };
}
