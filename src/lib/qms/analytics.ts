/**
 * QMS Analytics Engine
 * Calculates compliance metrics, trends, and insights
 */

import { prisma } from '@/lib/prisma';

export class QMSAnalytics {
  /**
   * Calculate document compliance rate
   * Percentage of active/non-expired documents vs total documents
   */
  static async calculateDocumentComplianceRate(
    crewId?: string
  ): Promise<{ rate: number; active: number; total: number }> {
    const where = crewId ? { crewId } : {};

    const [active, total] = await Promise.all([
      prisma.qMSDocument.count({
        where: {
          ...where,
          status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
          expiresAt: {
            gt: new Date(),
          },
        },
      }),
      prisma.qMSDocument.count({ where }),
    ]);

    return {
      rate: total === 0 ? 100 : Math.round((active / total) * 100),
      active,
      total,
    };
  }

  /**
   * Calculate non-conformity closure rate
   * Percentage of closed non-conformities vs total
   */
  static async calculateNonconformityClosureRate(): Promise<{
    rate: number;
    closed: number;
    open: number;
    total: number;
  }> {
    const [closed, total] = await Promise.all([
      prisma.nonconformityRecord.count({
        where: { status: 'CLOSED' },
      }),
      prisma.nonconformityRecord.count(),
    ]);

    return {
      rate: total === 0 ? 100 : Math.round((closed / total) * 100),
      closed,
      open: total - closed,
      total,
    };
  }

  /**
   * Calculate average non-conformity resolution time (in days)
   */
  static async calculateAverageResolutionTime(): Promise<number> {
    const records = await prisma.nonconformityRecord.findMany({
      where: { status: 'CLOSED', closedAt: { not: null } },
      select: {
        reportedAt: true,
        closedAt: true,
      },
    });

    if (records.length === 0) return 0;

    const totalDays = records.reduce((sum, record) => {
      if (!record.closedAt) return sum;
      const days = Math.floor(
        (record.closedAt.getTime() - record.reportedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / records.length);
  }

  /**
   * Get risk level distribution of documents
   */
  static async getRiskLevelDistribution(): Promise<
    Record<string, number>
  > {
    const distribution: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    // Count documents by risk level
    const [low, medium, high, critical] = await Promise.all([
      prisma.qMSDocument.count({ where: { riskLevel: 'LOW' } }),
      prisma.qMSDocument.count({ where: { riskLevel: 'MEDIUM' } }),
      prisma.qMSDocument.count({ where: { riskLevel: 'HIGH' } }),
      prisma.qMSDocument.count({ where: { riskLevel: 'CRITICAL' } }),
    ]);

    return { LOW: low, MEDIUM: medium, HIGH: high, CRITICAL: critical };

    return distribution;
  }

  /**
   * Get non-conformity severity distribution
   */
  static async getSeverityDistribution(): Promise<
    Record<string, number>
  > {
    const [low, medium, high, critical] = await Promise.all([
      prisma.nonconformityRecord.count({ where: { severity: 'LOW' } }),
      prisma.nonconformityRecord.count({ where: { severity: 'MEDIUM' } }),
      prisma.nonconformityRecord.count({ where: { severity: 'HIGH' } }),
      prisma.nonconformityRecord.count({ where: { severity: 'CRITICAL' } }),
    ]);

    return { LOW: low, MEDIUM: medium, HIGH: high, CRITICAL: critical };
  }

  /**
   * Get documents expiring soon (within X days)
   */
  static async getExpiringDocuments(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.qMSDocument.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gt: new Date(),
        },
        status: { not: 'ARCHIVED' },
      },
      include: {
        crew: { select: { id: true, fullName: true, email: true } },
        document: { select: { docType: true, expiryDate: true } },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  /**
   * Get critical non-conformities
   */
  static async getCriticalNonconformities() {
    return prisma.nonconformityRecord.findMany({
      where: {
        severity: 'CRITICAL',
        status: { not: 'CLOSED' },
      },
      include: {
        crew: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  /**
   * Get overdue non-conformities
   */
  static async getOverdueNonconformities() {
    return prisma.nonconformityRecord.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'CLOSED' },
      },
      include: {
        crew: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Get crew with highest risk
   */
  static async getHighRiskCrews(limit: number = 10) {
    // Get documents with critical/high risk
    const criticalDocs = await prisma.qMSDocument.findMany({
      where: {
        riskLevel: { in: ['CRITICAL', 'HIGH'] },
        status: { not: 'ARCHIVED' },
        crewId: { not: null },
      },
      select: { crewId: true },
    });

    // Count by crew
    const crewRiskMap = new Map<string, number>();
    criticalDocs.forEach((doc) => {
      if (doc.crewId) {
        crewRiskMap.set(doc.crewId, (crewRiskMap.get(doc.crewId) || 0) + 1);
      }
    });

    // Get top crews
    const topCrewIds = Array.from(crewRiskMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const crews = await prisma.crew.findMany({
      where: { id: { in: topCrewIds } },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
      },
    });

    // Map with counts
    return crews
      .map((crew) => ({
        ...crew,
        riskDocumentCount: crewRiskMap.get(crew.id) || 0,
      }))
      .sort((a, b) => b.riskDocumentCount - a.riskDocumentCount);
  }

  /**
   * Get crew with most non-conformities
   */
  static async getProblematicCrews(limit: number = 10) {
    // Get non-conformities by crew
    const records = await prisma.nonconformityRecord.findMany({
      where: { crewId: { not: null } },
      select: { crewId: true },
    });

    // Count by crew
    const crewNonconformityMap = new Map<string, number>();
    records.forEach((record) => {
      if (record.crewId) {
        crewNonconformityMap.set(
          record.crewId,
          (crewNonconformityMap.get(record.crewId) || 0) + 1
        );
      }
    });

    // Get top crews
    const topCrewIds = Array.from(crewNonconformityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const crews = await prisma.crew.findMany({
      where: { id: { in: topCrewIds } },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    return crews
      .map((crew) => ({
        ...crew,
        nonconformityCount: crewNonconformityMap.get(crew.id) || 0,
      }))
      .sort((a, b) => b.nonconformityCount - a.nonconformityCount);
  }

  /**
   * Get audit trail summary for period
   */
  static async getAuditSummary(days: number = 30): Promise<{
    totalEvents: number;
    criticalEvents: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, critical] = await Promise.all([
      prisma.auditTrail.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.auditTrail.count({
        where: {
          createdAt: { gte: startDate },
          severity: 'CRITICAL',
        },
      }),
    ]);

    // Fetch and group events manually
    const events = await prisma.auditTrail.findMany({
      where: { createdAt: { gte: startDate } },
      select: { category: true, severity: true },
    });

    const categoryMap: Record<string, number> = {};
    const severityMap: Record<string, number> = {};

    events.forEach((event) => {
      categoryMap[event.category] = (categoryMap[event.category] || 0) + 1;
      severityMap[event.severity] = (severityMap[event.severity] || 0) + 1;
    });

    return {
      totalEvents: total,
      criticalEvents: critical,
      byCategory: categoryMap,
      bySeverity: severityMap,
    };
  }

  /**
   * Calculate compliance metrics and update database
   */
  static async updateComplianceMetrics(): Promise<void> {
    const [docCompliance, nonconformityClosure] = await Promise.all([
      this.calculateDocumentComplianceRate(),
      this.calculateNonconformityClosureRate(),
    ]);

    // Update or create metrics
    await prisma.complianceMetric.upsert({
      where: { name: 'DOCUMENT_COMPLIANCE_RATE' },
      update: {
        currentValue: docCompliance.rate,
        lastCalculatedAt: new Date(),
      },
      create: {
        name: 'DOCUMENT_COMPLIANCE_RATE',
        description: 'Percentage of active and valid documents',
        currentValue: docCompliance.rate,
        targetValue: 95,
        unit: 'PERCENT',
        category: 'DOCUMENT_COMPLIANCE',
      },
    });

    await prisma.complianceMetric.upsert({
      where: { name: 'NONCONFORMITY_CLOSURE_RATE' },
      update: {
        currentValue: nonconformityClosure.rate,
        lastCalculatedAt: new Date(),
      },
      create: {
        name: 'NONCONFORMITY_CLOSURE_RATE',
        description: 'Percentage of closed non-conformities',
        currentValue: nonconformityClosure.rate,
        targetValue: 80,
        unit: 'PERCENT',
        category: 'PROCESS_COMPLIANCE',
      },
    });
  }
}
