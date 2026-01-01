/**
 * Audit Management Service
 * Business logic for audit operations
 * Handles scheduling, findings, reporting, and audit logging
 */

import { prisma } from "./prisma";
import { ApiError } from "./error-handler";

/**
 * Generate auto-incrementing audit finding number
 * Format: AUD-YYYY-001
 */
export async function generateFindingNumber(scheduleId: string): Promise<string> {
  const schedule = await prisma.auditSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
  }

  const year = new Date().getFullYear();
  const existingFindings = await prisma.auditFinding.findMany({
    where: {
      scheduleId,
      findingNumber: {
        startsWith: `AUD-${year}-`,
      },
    },
    select: { findingNumber: true },
    orderBy: { findingNumber: "desc" },
    take: 1,
  });

  let nextNumber = 1;
  if (existingFindings.length > 0) {
    const lastNumber = parseInt(existingFindings[0].findingNumber.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `AUD-${year}-${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Generate auto-incrementing audit report number
 * Format: AUD-RPT-YYYY-001
 */
export async function generateReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const existingReports = await prisma.auditReport.findMany({
    where: {
      reportNumber: {
        startsWith: `AUD-RPT-${year}-`,
      },
    },
    select: { reportNumber: true },
    orderBy: { reportNumber: "desc" },
    take: 1,
  });

  let nextNumber = 1;
  if (existingReports.length > 0) {
    const lastNumber = parseInt(existingReports[0].reportNumber.split("-")[3], 10);
    nextNumber = lastNumber + 1;
  }

  return `AUD-RPT-${year}-${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Create audit schedule
 */
export async function createAuditSchedule(
  data: {
    title: string;
    description: string;
    auditType: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    auditees: string[];
    auditors: string[];
  },
  trx?: unknown
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (trx || prisma) as any;

  const schedule = await client.auditSchedule.create({
    data: {
      title: data.title,
      description: data.description,
      auditType: data.auditType as "INTERNAL_QMS" | "EXTERNAL_CERTIFICATION" | "SURVEILLANCE" | "SPECIAL",
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      auditees: data.auditees,
      auditors: data.auditors,
      status: "SCHEDULED",
    },
    include: {
      findings: true,
      report: true,
    },
  });

  return schedule;
}

/**
 * Update audit schedule
 */
export async function updateAuditSchedule(
  scheduleId: string,
  data: {
    status?: string;
    endDate?: Date;
  },
  trx?: unknown
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (trx || prisma) as any;

  // Verify schedule exists
  const schedule = await client.auditSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
  }

  const updateData: { status?: string; endDate?: Date } = {};
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate;
  }

  const updated = await client.auditSchedule.update({
    where: { id: scheduleId },
    data: updateData,
    include: {
      findings: true,
      report: true,
    },
  });

  return updated;
}

/**
 * Create audit finding
 */
export async function createAuditFinding(
  scheduleId: string,
  data: {
    clause: string;
    description: string;
    severity: string;
    evidence: string[];
  },
  trx?: unknown
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (trx || prisma) as any;

  // Verify schedule exists
  const schedule = await client.auditSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
  }

  // Generate finding number
  const findingNumber = await generateFindingNumber(scheduleId);

  const finding = await client.auditFinding.create({
    data: {
      scheduleId,
      findingNumber,
      clause: data.clause,
      description: data.description,
      severity: data.severity as "OBSERVATION" | "MINOR_NC" | "MAJOR_NC",
      evidence: data.evidence,
      status: "OPEN",
    },
    include: {
      schedule: true,
    },
  });

  return finding;
}

/**
 * Create audit report
 */
export async function createAuditReport(
  scheduleId: string,
  data: {
    summary: string;
    recommendations: string;
    findings: {
      total: number;
      observations: number;
      minorNC: number;
      majorNC: number;
    };
  },
  userId: string,
  trx?: unknown
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (trx || prisma) as any;

  // Verify schedule exists
  const schedule = await client.auditSchedule.findUnique({
    where: { id: scheduleId },
    include: { report: true },
  });

  if (!schedule) {
    throw new ApiError(404, "Audit schedule not found", "NOT_FOUND");
  }

  // Check if report already exists
  if (schedule.report) {
    throw new ApiError(409, "Audit report already exists for this schedule", "DUPLICATE_ENTRY");
  }

  // Generate report number
  const reportNumber = await generateReportNumber();

  const report = await client.auditReport.create({
    data: {
      scheduleId,
      reportNumber,
      summary: data.summary,
      recommendations: data.recommendations,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findings: data.findings as any,
      status: "DRAFT",
    },
    include: {
      schedule: true,
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return report;
}

/**
 * Approve audit report
 */
export async function approveAuditReport(
  reportId: string,
  userId: string,
  trx?: unknown
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (trx || prisma) as any;

  // Verify report exists
  const report = await client.auditReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new ApiError(404, "Audit report not found", "NOT_FOUND");
  }

  const approved = await client.auditReport.update({
    where: { id: reportId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: userId,
    },
    include: {
      schedule: true,
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return approved;
}

/**
 * Get audit metrics for dashboard
 */
export async function getAuditMetrics() {
  const schedules = await prisma.auditSchedule.findMany({
    include: {
      findings: { select: { severity: true } },
      report: { select: { status: true } },
    },
  });

  // Count findings by severity
  let totalObservations = 0;
  let totalMinorNC = 0;
  let totalMajorNC = 0;

  schedules.forEach((schedule) => {
    schedule.findings.forEach((finding) => {
      if (finding.severity === "OBSERVATION") totalObservations++;
      else if (finding.severity === "MINOR_NC") totalMinorNC++;
      else if (finding.severity === "MAJOR_NC") totalMajorNC++;
    });
  });

  const metrics = {
    total: schedules.length,
    byStatus: {
      SCHEDULED: schedules.filter((s) => s.status === "SCHEDULED").length,
      IN_PROGRESS: schedules.filter((s) => s.status === "IN_PROGRESS").length,
      COMPLETED: schedules.filter((s) => s.status === "COMPLETED").length,
      CANCELLED: schedules.filter((s) => s.status === "CANCELLED").length,
    },
    byType: {
      INTERNAL_QMS: schedules.filter((s) => s.auditType === "INTERNAL_QMS").length,
      EXTERNAL_CERTIFICATION: schedules.filter((s) => s.auditType === "EXTERNAL_CERTIFICATION").length,
      SURVEILLANCE: schedules.filter((s) => s.auditType === "SURVEILLANCE").length,
      SPECIAL: schedules.filter((s) => s.auditType === "SPECIAL").length,
    },
    findings: {
      total: totalObservations + totalMinorNC + totalMajorNC,
      observations: totalObservations,
      minorNC: totalMinorNC,
      majorNC: totalMajorNC,
    },
    reportsGenerated: schedules.filter((s) => s.report?.status).length,
  };

  return metrics;
}
