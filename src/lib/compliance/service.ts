import { prisma } from '@/lib/prisma';
import { 
  HRTraining,
  EmployeeTraining,
  Certification,
  ComplianceGap,
  TrainingStatus,
  TrainingType,
  CertificationStatus,
  CertificationType,
  ComplianceGapType,
} from '@prisma/client';

// ============================================================================
// HR TRAINING SERVICE
// ============================================================================

export async function createTraining(data: {
  trainingCode: string;
  title: string;
  description?: string;
  trainingType: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  provider: string;
  location?: string;
}): Promise<HRTraining> {
  return prisma.hRTraining.create({
    data: {
      trainingCode: data.trainingCode,
      title: data.title,
      description: data.description,
      trainingType: data.trainingType as TrainingType,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: data.duration,
      provider: data.provider,
      location: data.location,
      isActive: true,
    },
  });
}

export async function enrollEmployeeInTraining(data: {
  employeeId: string;
  trainingId: string;
  enrolledDate?: Date;
}): Promise<EmployeeTraining> {
  return prisma.employeeTraining.create({
    data: {
      employeeId: data.employeeId,
      trainingId: data.trainingId,
      enrolledDate: data.enrolledDate || new Date(),
      status: 'NOT_STARTED',
    },
    include: {
      training: true,
      employee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function completeTraining(
  employeeTrainingId: string,
  score?: number,
  certificateUrl?: string
): Promise<EmployeeTraining> {
  return prisma.employeeTraining.update({
    where: { id: employeeTrainingId },
    data: {
      status: 'COMPLETED',
      completedDate: new Date(),
      score: score,
      certificateUrl: certificateUrl,
    },
    include: {
      training: true,
      employee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateTrainingProgress(
  employeeTrainingId: string,
  status: TrainingStatus
): Promise<EmployeeTraining> {
  return prisma.employeeTraining.update({
    where: { id: employeeTrainingId },
    data: { status },
    include: {
      training: true,
      employee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listEmployeeTrainings(
  employeeId: string,
  filters?: { status?: TrainingStatus }
) {
  return prisma.employeeTraining.findMany({
    where: {
      employeeId,
      status: filters?.status,
    },
    include: {
      training: true,
    },
    orderBy: { enrolledDate: 'desc' },
  });
}

export async function getTrainingById(trainingId: string) {
  return prisma.hRTraining.findUnique({
    where: { id: trainingId },
    include: {
      employeeTrainings: {
        include: {
          employee: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function listTrainings(filters?: { isActive?: boolean }) {
  return prisma.hRTraining.findMany({
    where: {
      isActive: filters?.isActive !== false,
    },
    include: {
      employeeTrainings: { select: { id: true } },
    },
    orderBy: { startDate: 'desc' },
  });
}

// ============================================================================
// CERTIFICATION SERVICE
// ============================================================================

export async function recordCertification(data: {
  employeeId: string;
  certCode: string;
  title: string;
  certType: string;
  issuer: string;
  issuedDate: Date;
  expiryDate?: Date;
  certificateUrl?: string;
}): Promise<Certification> {
  return prisma.certification.create({
    data: {
      employeeId: data.employeeId,
      certCode: data.certCode,
      title: data.title,
      certType: data.certType as CertificationType,
      issuer: data.issuer,
      issuedDate: data.issuedDate,
      expiryDate: data.expiryDate,
      status: data.expiryDate && data.expiryDate < new Date() ? 'EXPIRED' : 'ACTIVE',
      certificateUrl: data.certificateUrl,
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateCertificationStatus(
  certId: string,
  status: CertificationStatus
): Promise<Certification> {
  return prisma.certification.update({
    where: { id: certId },
    data: { status },
  });
}

export async function getEmployeeCertifications(employeeId: string) {
  return prisma.certification.findMany({
    where: { employeeId },
    orderBy: { expiryDate: 'asc' },
  });
}

export async function listExpiringCertifications(daysUntilExpiry: number = 90) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  return prisma.certification.findMany({
    where: {
      status: 'ACTIVE',
      expiryDate: {
        lte: expiryDate,
        gt: new Date(),
      },
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });
}

export async function listExpiredCertifications() {
  return prisma.certification.findMany({
    where: {
      expiryDate: { lt: new Date() },
      status: { not: 'REVOKED' },
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });
}

// ============================================================================
// COMPLIANCE GAP SERVICE
// ============================================================================

export async function identifyComplianceGap(data: {
  employeeId: string;
  gapType: ComplianceGapType;
  description: string;
  assignedToId?: string;
  dueDate: Date;
}): Promise<ComplianceGap> {
  return prisma.complianceGap.create({
    data: {
      employeeId: data.employeeId,
      gapType: data.gapType,
      description: data.description,
      assignedToId: data.assignedToId,
      dueDate: data.dueDate,
      identifiedDate: new Date(),
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function resolveComplianceGap(gapId: string): Promise<ComplianceGap> {
  return prisma.complianceGap.update({
    where: { id: gapId },
    data: {
      resolvedDate: new Date(),
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getEmployeeComplianceGaps(employeeId: string) {
  return prisma.complianceGap.findMany({
    where: { employeeId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function listOpenComplianceGaps(filters?: {
  gapType?: ComplianceGapType;
  assignedToId?: string;
  overdueOnly?: boolean;
}) {
  const where: Record<string, unknown> = {
    resolvedDate: null,
    gapType: filters?.gapType,
    assignedToId: filters?.assignedToId,
  };

  if (filters?.overdueOnly) {
    where.dueDate = { lt: new Date() };
  }

  return prisma.complianceGap.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

// ============================================================================
// HR COMPLIANCE ANALYTICS
// ============================================================================

export async function getHRComplianceStats() {
  const [
    totalEmployees,
    completedTrainings,
    pendingTrainings,
    overdueTrainings,
    activeCertifications,
    expiringCertifications,
    expiredCertifications,
    totalGaps,
    openGaps,
    overdueGaps,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.employeeTraining.count({ where: { status: 'COMPLETED' } }),
    prisma.employeeTraining.count({
      where: { status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } },
    }),
    prisma.employeeTraining.count({
      where: {
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        training: { endDate: { lt: new Date() } },
      },
    }),
    prisma.certification.count({ where: { status: 'ACTIVE' } }),
    prisma.certification.count({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          gt: new Date(),
        },
      },
    }),
    prisma.certification.count({
      where: { expiryDate: { lt: new Date() } },
    }),
    prisma.complianceGap.count(),
    prisma.complianceGap.count({ where: { resolvedDate: null } }),
    prisma.complianceGap.count({
      where: {
        resolvedDate: null,
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return {
    employees: totalEmployees,
    trainings: {
      completed: completedTrainings,
      pending: pendingTrainings,
      overdue: overdueTrainings,
    },
    certifications: {
      active: activeCertifications,
      expiring: expiringCertifications,
      expired: expiredCertifications,
    },
    complianceGaps: {
      total: totalGaps,
      open: openGaps,
      overdue: overdueGaps,
    },
  };
}

export async function getEmployeeComplianceSummary(employeeId: string) {
  const [trainings, certifications, gaps] = await Promise.all([
    prisma.employeeTraining.findMany({
      where: { employeeId },
      include: { training: true },
    }),
    prisma.certification.findMany({
      where: { employeeId },
    }),
    prisma.complianceGap.findMany({
      where: { employeeId },
    }),
  ]);

  const completedTrainings = trainings.filter(t => t.status === 'COMPLETED').length;
  const activeOrExpiringCerts = certifications.filter(
    c => c.status === 'ACTIVE' || c.status === 'EXPIRING'
  ).length;
  const openGaps = gaps.filter(g => !g.resolvedDate).length;

  return {
    totalTrainings: trainings.length,
    completedTrainings,
    completionRate: trainings.length > 0 ? (completedTrainings / trainings.length) * 100 : 0,
    certifications: {
      total: certifications.length,
      activeOrExpiring: activeOrExpiringCerts,
      expired: certifications.filter(c => c.status === 'EXPIRED').length,
    },
    complianceGaps: {
      total: gaps.length,
      open: openGaps,
      overdue: gaps.filter(g => !g.resolvedDate && g.dueDate < new Date()).length,
    },
    complianceScore: calculateComplianceScore(
      completedTrainings,
      trainings.length,
      activeOrExpiringCerts,
      openGaps
    ),
  };
}

function calculateComplianceScore(
  completedTrainings: number,
  totalTrainings: number,
  activeCerts: number,
  openGaps: number
): number {
  const trainingScore = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 40 : 0;
  const certScore = Math.min(activeCerts * 10, 30);
  const gapScore = Math.max(30 - openGaps * 5, 0);
  return Math.round(trainingScore + certScore + gapScore);
}
