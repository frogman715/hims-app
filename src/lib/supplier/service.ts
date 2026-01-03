import { prisma } from '@/lib/prisma';
import { 
  Supplier,
  SupplierAudit,
  SupplierCompliance,
  SupplierDocument,
  PurchaseOrder,
  SupplierStatus,
  SupplierType,
  SupplierAuditStatus,
  PurchaseOrderStatus,
} from '@prisma/client';

// ============================================================================
// SUPPLIER MANAGEMENT SERVICE
// ============================================================================

export async function registerSupplier(data: {
  supplierCode: string;
  name: string;
  supplierType: SupplierType;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<Supplier> {
  return prisma.supplier.create({
    data: {
      supplierCode: data.supplierCode,
      name: data.name,
      supplierType: data.supplierType,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      status: 'PROSPECT',
    },
  });
}

export async function approveSupplier(
  supplierId: string,
  approvedById: string,
  assessmentScore?: number
): Promise<Supplier> {
  return prisma.supplier.update({
    where: { id: supplierId },
    data: {
      status: 'APPROVED',
      approvedDate: new Date(),
      approvedById: approvedById,
      assessmentScore: assessmentScore,
      lastAssessmentDate: new Date(),
    },
    include: {
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateSupplierStatus(
  supplierId: string,
  status: SupplierStatus
): Promise<Supplier> {
  return prisma.supplier.update({
    where: { id: supplierId },
    data: { status },
  });
}

export async function getSupplierWithDetails(supplierId: string) {
  return prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      approvedBy: { select: { id: true, name: true, email: true } },
      audits: {
        include: {
          auditor: { select: { id: true, name: true, email: true } },
        },
      },
      compliance: true,
      documents: true,
      purchaseOrders: true,
    },
  });
}

export async function listSuppliers(filters?: {
  status?: SupplierStatus;
  supplierType?: SupplierType;
  limit?: number;
  offset?: number;
}) {
  return prisma.supplier.findMany({
    where: {
      status: filters?.status,
      supplierType: filters?.supplierType,
    },
    include: {
      approvedBy: { select: { id: true, name: true } },
      audits: { select: { id: true } },
      compliance: { select: { id: true } },
      purchaseOrders: { select: { id: true } },
    },
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
    orderBy: { name: 'asc' },
  });
}

// ============================================================================
// SUPPLIER AUDIT SERVICE
// ============================================================================

export async function scheduleSupplierAudit(data: {
  supplierId: string;
  auditCode: string;
  title: string;
  scope?: string;
  plannedDate: Date;
  auditorId: string;
}): Promise<SupplierAudit> {
  return prisma.supplierAudit.create({
    data: {
      supplierId: data.supplierId,
      auditCode: data.auditCode,
      title: data.title,
      scope: data.scope,
      plannedDate: data.plannedDate,
      auditorId: data.auditorId,
      status: 'PLANNED',
    },
    include: {
      supplier: { select: { id: true, name: true } },
      auditor: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function conductSupplierAudit(
  auditId: string,
  findings?: string,
  score?: number
): Promise<SupplierAudit> {
  return prisma.supplierAudit.update({
    where: { id: auditId },
    data: {
      status: 'COMPLETED',
      auditDate: new Date(),
      findings: findings,
      score: score,
    },
  });
}

export async function finalizeSupplierAudit(
  auditId: string,
  status: SupplierAuditStatus
): Promise<SupplierAudit> {
  return prisma.supplierAudit.update({
    where: { id: auditId },
    data: { status },
  });
}

export async function listSupplierAudits(filters?: {
  supplierId?: string;
  status?: SupplierAuditStatus;
  auditorId?: string;
  limit?: number;
  offset?: number;
}) {
  return prisma.supplierAudit.findMany({
    where: {
      supplierId: filters?.supplierId,
      status: filters?.status,
      auditorId: filters?.auditorId,
    },
    include: {
      supplier: { select: { id: true, name: true } },
      auditor: { select: { id: true, name: true, email: true } },
    },
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
    orderBy: { auditDate: 'desc' },
  });
}

// ============================================================================
// SUPPLIER COMPLIANCE SERVICE
// ============================================================================

export async function recordSupplierCompliance(data: {
  supplierId: string;
  requirement: string;
  status: string;
  dueDate?: Date;
  evidence?: string;
  notes?: string;
}): Promise<SupplierCompliance> {
  return prisma.supplierCompliance.create({
    data: {
      supplierId: data.supplierId,
      requirement: data.requirement,
      status: data.status,
      dueDate: data.dueDate,
      evidence: data.evidence,
      notes: data.notes,
      checkDate: new Date(),
    },
  });
}

export async function updateComplianceStatus(
  complianceId: string,
  status: string,
  evidence?: string
): Promise<SupplierCompliance> {
  return prisma.supplierCompliance.update({
    where: { id: complianceId },
    data: {
      status,
      evidence: evidence,
      checkDate: new Date(),
    },
  });
}

export async function listSupplierCompliance(supplierId: string) {
  return prisma.supplierCompliance.findMany({
    where: { supplierId },
    orderBy: { checkDate: 'desc' },
  });
}

export async function getSupplierComplianceSummary(supplierId: string) {
  const complianceRecords = await prisma.supplierCompliance.findMany({
    where: { supplierId },
  });

  const compliant = complianceRecords.filter(c => c.status === 'COMPLIANT').length;
  const nonCompliant = complianceRecords.filter(c => c.status === 'NON_COMPLIANT').length;
  const pending = complianceRecords.filter(c => c.status === 'PENDING').length;

  return {
    total: complianceRecords.length,
    compliant,
    nonCompliant,
    pending,
    complianceRate: complianceRecords.length > 0 
      ? (compliant / complianceRecords.length) * 100 
      : 0,
  };
}

// ============================================================================
// SUPPLIER DOCUMENT SERVICE
// ============================================================================

export async function uploadSupplierDocument(data: {
  supplierId: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  expiryDate?: Date;
}): Promise<SupplierDocument> {
  return prisma.supplierDocument.create({
    data: {
      supplierId: data.supplierId,
      docType: data.docType,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      expiryDate: data.expiryDate,
      uploadedDate: new Date(),
    },
  });
}

export async function listSupplierDocuments(supplierId: string) {
  return prisma.supplierDocument.findMany({
    where: { supplierId },
    orderBy: { uploadedDate: 'desc' },
  });
}

export async function deleteSupplierDocument(docId: string): Promise<SupplierDocument> {
  return prisma.supplierDocument.delete({
    where: { id: docId },
  });
}

export async function listExpiringSupplierDocuments(daysUntilExpiry: number = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  return prisma.supplierDocument.findMany({
    where: {
      expiryDate: {
        lte: expiryDate,
        gt: new Date(),
      },
    },
    include: {
      supplier: { select: { id: true, name: true, email: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });
}

// ============================================================================
// PURCHASE ORDER SERVICE
// ============================================================================

export async function createPurchaseOrder(data: {
  poNumber: string;
  supplierId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  dueDate: Date;
  createdById: string;
  notes?: string;
}): Promise<PurchaseOrder> {
  const totalAmount = data.quantity * data.unitPrice;

  return prisma.purchaseOrder.create({
    data: {
      poNumber: data.poNumber,
      supplierId: data.supplierId,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit,
      unitPrice: data.unitPrice,
      totalAmount: totalAmount,
      dueDate: data.dueDate,
      createdById: data.createdById,
      notes: data.notes,
      status: 'DRAFT',
    },
    include: {
      supplier: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function submitPurchaseOrder(poId: string): Promise<PurchaseOrder> {
  return prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: 'PENDING_APPROVAL' },
  });
}

export async function approvePurchaseOrder(
  poId: string,
  approvedById: string
): Promise<PurchaseOrder> {
  return prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status: 'APPROVED',
      approvedById: approvedById,
    },
    include: {
      supplier: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updatePOStatus(
  poId: string,
  status: PurchaseOrderStatus,
  deliveryDate?: Date
): Promise<PurchaseOrder> {
  const updateData: any = { status };
  if (status === 'DELIVERED' && deliveryDate) {
    updateData.deliveryDate = deliveryDate;
  }

  return prisma.purchaseOrder.update({
    where: { id: poId },
    data: updateData,
  });
}

export async function listPurchaseOrders(filters?: {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  createdById?: string;
  limit?: number;
  offset?: number;
}) {
  return prisma.purchaseOrder.findMany({
    where: {
      supplierId: filters?.supplierId,
      status: filters?.status,
      createdById: filters?.createdById,
    },
    include: {
      supplier: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    take: filters?.limit || 20,
    skip: filters?.offset || 0,
    orderBy: { poDate: 'desc' },
  });
}

export async function getPurchaseOrderWithDetails(poId: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          contactPerson: true,
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

// ============================================================================
// SUPPLIER ANALYTICS
// ============================================================================

export async function getSupplierStats() {
  const [
    totalSuppliers,
    prospectSuppliers,
    approvedSuppliers,
    conditionalSuppliers,
    suspendedSuppliers,
    totalAudits,
    passedAudits,
    failedAudits,
    totalPOs,
    pendingPOs,
    deliveredPOs,
  ] = await Promise.all([
    prisma.supplier.count(),
    prisma.supplier.count({ where: { status: 'PROSPECT' } }),
    prisma.supplier.count({ where: { status: 'APPROVED' } }),
    prisma.supplier.count({ where: { status: 'CONDITIONAL' } }),
    prisma.supplier.count({ where: { status: 'SUSPENDED' } }),
    prisma.supplierAudit.count(),
    prisma.supplierAudit.count({ where: { status: 'PASSED' } }),
    prisma.supplierAudit.count({ where: { status: 'FAILED' } }),
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({
      where: { status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED'] } },
    }),
    prisma.purchaseOrder.count({ where: { status: 'DELIVERED' } }),
  ]);

  return {
    suppliers: {
      total: totalSuppliers,
      prospect: prospectSuppliers,
      approved: approvedSuppliers,
      conditional: conditionalSuppliers,
      suspended: suspendedSuppliers,
    },
    audits: {
      total: totalAudits,
      passed: passedAudits,
      failed: failedAudits,
    },
    purchaseOrders: {
      total: totalPOs,
      pending: pendingPOs,
      delivered: deliveredPOs,
    },
  };
}

export async function getSupplierPerformanceRanking(limit: number = 10) {
  const suppliers = await prisma.supplier.findMany({
    where: { status: 'APPROVED' },
    include: {
      audits: true,
      compliance: true,
      purchaseOrders: true,
    },
    take: limit,
  });

  return suppliers
    .map(supplier => {
      const auditScore = supplier.audits.length > 0
        ? supplier.audits.filter(a => a.status === 'PASSED').length / supplier.audits.length * 40
        : 0;

      const compliance = supplier.compliance;
      const complianceScore = compliance.length > 0
        ? compliance.filter(c => c.status === 'COMPLIANT').length / compliance.length * 40
        : 0;

      const poScore = Math.min(supplier.purchaseOrders.length * 2, 20);

      const totalScore = auditScore + complianceScore + poScore;

      return {
        supplierId: supplier.id,
        name: supplier.name,
        score: totalScore,
        assessmentScore: supplier.assessmentScore,
        auditScore: auditScore,
        complianceScore: complianceScore,
        poScore: poScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}
