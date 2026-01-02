import { prisma } from '@/lib/prisma';

export interface ComplianceKPI {
  complianceScore: number;
  documentCoverage: number;
  nonconformityClosure: number;
  auditCompletion: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface RiskDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface DocumentStatus {
  active: number;
  expiringSoon: number;
  expired: number;
  archived: number;
}

export interface Alert {
  id: string;
  type: 'DOCUMENT_EXPIRY' | 'NONCONFORMITY_OVERDUE' | 'AUDIT_DUE' | 'CRITICAL_FINDING';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  dueDate?: Date;
  actionRequired: boolean;
}

export interface TrendDataPoint {
  date: string;
  complianceScore: number;
  openNonconformities: number;
  documentsCoveragePercent: number;
}

export interface DashboardMetrics {
  kpis: ComplianceKPI;
  riskDistribution: RiskDistribution;
  documentStatus: DocumentStatus;
  alerts: Alert[];
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: Date;
    status: string;
  }>;
  trends: TrendDataPoint[];
}

/**
 * Advanced QMS Analytics Service
 * Provides comprehensive analytics and KPI calculations for QMS dashboard
 */
export class QMSAdvancedAnalytics {
  /**
   * Calculate overall compliance KPI
   */
  static async calculateComplianceKPI(): Promise<ComplianceKPI> {
    try {
      const [documents, nonconformities, auditTrail] = await Promise.all([
        prisma.qMSDocument.findMany(),
        prisma.nonconformityRecord.findMany(),
        prisma.auditTrail.findMany({
          where: { category: 'DOCUMENT_VERIFICATION' },
        }),
      ]);

      // Document coverage: percentage of crew with documented records
      const crews = await prisma.crew.findMany();
      const crewsWithDocs = new Set(documents.map((d) => d.crewId)).size;
      const documentCoverage = crews.length > 0 ? (crewsWithDocs / crews.length) * 100 : 0;

      // Nonconformity closure: percentage of closed vs total
      const closedNonconformities = nonconformities.filter((nc) => nc.status === 'CLOSED').length;
      const nonconformityClosure = nonconformities.length > 0 ? (closedNonconformities / nonconformities.length) * 100 : 0;

      // Audit completion: based on audit trail
      const completedAudits = auditTrail.filter((a) => a.event === 'COMPLETED').length;
      const auditCompletion = auditTrail.length > 0 ? (completedAudits / auditTrail.length) * 100 : 0;

      // Overall compliance score (weighted average)
      const complianceScore = (documentCoverage * 0.4 + nonconformityClosure * 0.35 + auditCompletion * 0.25) / 100;

      // Trend (simplified: compare last 30 days with previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDocs = documents.filter((d) => new Date(d.createdAt) > thirtyDaysAgo).length;
      const trend = recentDocs > 0 ? 'UP' : documents.length > 0 ? 'STABLE' : 'DOWN';

      return {
        complianceScore: Math.round(complianceScore * 100),
        documentCoverage: Math.round(documentCoverage),
        nonconformityClosure: Math.round(nonconformityClosure),
        auditCompletion: Math.round(auditCompletion),
        trend,
      };
    } catch (error) {
      console.error('Error calculating compliance KPI:', error);
      return {
        complianceScore: 0,
        documentCoverage: 0,
        nonconformityClosure: 0,
        auditCompletion: 0,
        trend: 'STABLE',
      };
    }
  }

  /**
   * Analyze risk distribution from nonconformities
   */
  static async analyzeRiskDistribution(): Promise<RiskDistribution> {
    try {
      const nonconformities = await prisma.nonconformityRecord.findMany();

      const distribution = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: nonconformities.length,
      };

      nonconformities.forEach((nc) => {
        const severity = (nc.severity || 'medium').toLowerCase();
        if (severity === 'critical') distribution.critical++;
        else if (severity === 'high') distribution.high++;
        else if (severity === 'medium') distribution.medium++;
        else distribution.low++;
      });

      return distribution;
    } catch (error) {
      console.error('Error analyzing risk distribution:', error);
      return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    }
  }

  /**
   * Get document status breakdown
   */
  static async getDocumentStatusBreakdown(): Promise<DocumentStatus> {
    try {
      const documents = await prisma.qMSDocument.findMany();
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const status = {
        active: 0,
        expiringSoon: 0,
        expired: 0,
        archived: 0,
      };

      documents.forEach((doc) => {
        if (doc.status === 'ARCHIVED') {
          status.archived++;
        } else if (doc.expiresAt) {
          const expiresAt = new Date(doc.expiresAt);
          if (expiresAt < now) {
            status.expired++;
          } else if (expiresAt < thirtyDaysFromNow) {
            status.expiringSoon++;
          } else {
            status.active++;
          }
        } else {
          status.active++;
        }
      });

      return status;
    } catch (error) {
      console.error('Error getting document status:', error);
      return { active: 0, expiringSoon: 0, expired: 0, archived: 0 };
    }
  }

  /**
   * Generate alerts for dashboard
   */
  static async generateAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Check for expiring documents (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringDocs = await prisma.qMSDocument.findMany({
        where: {
          expiresAt: {
            gte: new Date(),
            lte: thirtyDaysFromNow,
          },
          status: { not: 'ARCHIVED' },
        },
        include: {
          crew: { select: { fullName: true } },
        },
      });

      expiringDocs.forEach((doc) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(doc.expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          id: `doc-expiry-${doc.id}`,
          type: 'DOCUMENT_EXPIRY',
          severity: daysUntilExpiry <= 7 ? 'CRITICAL' : daysUntilExpiry <= 14 ? 'HIGH' : 'MEDIUM',
          title: `Document expiring soon`,
          description: `${doc.crew?.fullName || 'Crew'} document expires in ${daysUntilExpiry} days`,
          dueDate: doc.expiresAt || undefined,
          actionRequired: daysUntilExpiry <= 7,
        });
      });

      // Check for overdue nonconformities
      const overdueNC = await prisma.nonconformityRecord.findMany({
        where: {
          status: { not: 'CLOSED' },
          dueDate: {
            lt: new Date(),
          },
        },
      });

      overdueNC.forEach((nc) => {
        const daysOverdue = Math.ceil(
          (new Date().getTime() - new Date(nc.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          id: `overdue-${nc.id}`,
          type: 'NONCONFORMITY_OVERDUE',
          severity: daysOverdue > 30 ? 'CRITICAL' : daysOverdue > 14 ? 'HIGH' : 'MEDIUM',
          title: `Nonconformity overdue`,
          description: `Nonconformity overdue by ${daysOverdue} days - Status: ${nc.status}`,
          dueDate: nc.dueDate || undefined,
          actionRequired: true,
        });
      });

      // Check for critical findings
      const criticalNC = await prisma.nonconformityRecord.findMany({
        where: {
          severity: 'CRITICAL',
          status: { not: 'CLOSED' },
        },
      });

      criticalNC.slice(0, 5).forEach((nc) => {
        alerts.push({
          id: `critical-${nc.id}`,
          type: 'CRITICAL_FINDING',
          severity: 'CRITICAL',
          title: `Critical nonconformity open`,
          description: nc.description,
          actionRequired: true,
        });
      });
    } catch (error) {
      console.error('Error generating alerts:', error);
    }

    return alerts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get recent QMS activity
   */
  static async getRecentActivity(limit: number = 10) {
    try {
      const auditEvents = await prisma.auditTrail.findMany({
        where: {
          category: {
            in: [
              'DOCUMENT_VERIFICATION',
              'PROCESS_COMPLIANCE',
              'CREW_RECORD',
              'TRAINING_REQUIREMENT',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return auditEvents.map((event) => ({
        id: event.id,
        type: event.category,
        title: event.event,
        timestamp: event.createdAt,
        status: event.severity,
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Get compliance trends over time
   */
  static async getComplianceTrends(days: number = 30): Promise<TrendDataPoint[]> {
    const trends: TrendDataPoint[] = [];

    try {
      const documents = await prisma.qMSDocument.findMany();
      const nonconformities = await prisma.nonconformityRecord.findMany();
      const crews = await prisma.crew.findMany();

      // Generate data points for each day
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Count documents created up to this date
        const docsUpToDate = documents.filter((d) => new Date(d.createdAt) <= date).length;
        const documentsCoveragePercent = crews.length > 0 ? Math.round((docsUpToDate / crews.length) * 100) : 0;

        // Count open nonconformities as of this date
        const openNCUpToDate = nonconformities.filter(
          (nc) =>
            new Date(nc.createdAt) <= date &&
            (nc.closedAt === null || new Date(nc.closedAt) > date) &&
            nc.status !== 'CLOSED'
        ).length;

        // Calculate compliance score
        const complianceScore = Math.max(0, 100 - openNCUpToDate * 5 + documentsCoveragePercent * 0.5);

        trends.push({
          date: dateStr,
          complianceScore: Math.min(100, Math.round(complianceScore)),
          openNonconformities: openNCUpToDate,
          documentsCoveragePercent,
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting compliance trends:', error);
      return [];
    }
  }

  /**
   * Get complete dashboard metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [kpis, riskDistribution, documentStatus, alerts, recentActivity, trends] = await Promise.all([
      this.calculateComplianceKPI(),
      this.analyzeRiskDistribution(),
      this.getDocumentStatusBreakdown(),
      this.generateAlerts(),
      this.getRecentActivity(10),
      this.getComplianceTrends(30),
    ]);

    return {
      kpis,
      riskDistribution,
      documentStatus,
      alerts: alerts.slice(0, 8),
      recentActivity,
      trends,
    };
  }
}
