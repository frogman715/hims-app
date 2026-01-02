import { prisma } from '@/lib/prisma';
import { ReportExportService } from './report-export';

type EmailProvider = 'nodemailer' | 'sendgrid' | 'mailgun' | 'aws-ses';

interface ScheduledDistribution {
  id: string;
  reportId: string;
  recipients: string[];
  schedule: 'daily' | 'weekly' | 'monthly';
  provider: EmailProvider;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
}

/**
 * EmailDistributionService - Manages scheduled report distribution
 * Handles recurring email delivery of QMS reports
 */
export class EmailDistributionService {
  private static scheduledJobs: Map<string, ScheduledDistribution> = new Map();

  /**
   * Schedule recurring report email distribution
   * In production, would use database storage + cron jobs
   */
  static async scheduleDistribution(
    reportId: string,
    recipients: string[],
    schedule: 'daily' | 'weekly' | 'monthly',
    provider: EmailProvider = 'nodemailer'
  ): Promise<ScheduledDistribution> {
    const distribution: ScheduledDistribution = {
      id: `${reportId}-${Date.now()}`,
      reportId,
      recipients,
      schedule,
      provider,
      isActive: true,
      nextRunAt: this.calculateNextRun(schedule),
    };

    this.scheduledJobs.set(distribution.id, distribution);

    // In production, would persist to database:
    // await prisma.reportDistributionSchedule.create({
    //   data: { reportId, recipients, schedule, provider, nextRunAt }
    // });

    return distribution;
  }

  /**
   * Get all active distribution schedules
   */
  static async getActiveDistributions(): Promise<ScheduledDistribution[]> {
    // In production, would query database for active schedules where nextRunAt <= now()
    const activeJobs: ScheduledDistribution[] = [];

    this.scheduledJobs.forEach((job) => {
      if (job.isActive && job.nextRunAt <= new Date()) {
        activeJobs.push(job);
      }
    });

    return activeJobs;
  }

  /**
   * Execute pending report distributions
   * Should be called by a scheduler/cron job
   */
  static async executePendingDistributions(): Promise<{
    success: number;
    failed: number;
    errors: Array<{ jobId: string; error: string }>;
  }> {
    const pendingJobs = await this.getActiveDistributions();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ jobId: string; error: string }>,
    };

    for (const job of pendingJobs) {
      try {
        await this.executeDistribution(job);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Execute single distribution
   */
  private static async executeDistribution(job: ScheduledDistribution): Promise<void> {
    // Fetch report
    const report = await prisma.qMSReport.findUnique({
      where: { id: job.reportId },
      include: {
        approver: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    if (!report) {
      throw new Error(`Report ${job.reportId} not found`);
    }

    // Fetch non-conformities for report period
    const nonconformities = await prisma.nonconformityRecord.findMany({
      where: {
        reportedAt: {
          gte: report.periodStart,
          lte: report.periodEnd,
        },
      },
      select: {
        id: true,
        severity: true,
        status: true,
        type: true,
        description: true,
        dueDate: true,
        assignedTo: true,
      },
    });

    // Generate exports
    const metricsSnapshot = report.metricsSnapshot as Record<string, unknown> | null;
    const pdfBuffer = await ReportExportService.generatePDFReport(
      report,
      metricsSnapshot,
      nonconformities as Array<Record<string, unknown>>
    );
    const excelBuffer = await ReportExportService.generateExcelReport(
      report,
      metricsSnapshot,
      nonconformities as Array<Record<string, unknown>>
    );

    // Send email
    const emailResult = await ReportExportService.sendReportEmail(
      report,
      job.recipients,
      pdfBuffer,
      excelBuffer,
      job.provider
    );

    if (!emailResult.success) {
      throw new Error(`Email send failed: ${emailResult.error}`);
    }

    // Update job
    const updatedJob = { ...job, lastRunAt: new Date(), nextRunAt: this.calculateNextRun(job.schedule) };
    this.scheduledJobs.set(job.id, updatedJob);

    // In production, would update database:
    // await prisma.reportDistributionSchedule.update({
    //   where: { id: job.id },
    //   data: { lastRunAt: new Date(), nextRunAt: updatedJob.nextRunAt }
    // });
  }

  /**
   * Pause or resume distribution schedule
   */
  static async toggleSchedule(jobId: string, isActive: boolean): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return false;

    job.isActive = isActive;
    return true;
  }

  /**
   * Remove distribution schedule
   */
  static async removeDistribution(jobId: string): Promise<boolean> {
    return this.scheduledJobs.delete(jobId);
  }

  /**
   * Calculate next run time
   */
  private static calculateNextRun(schedule: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const next = new Date(now);

    switch (schedule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(8, 0, 0, 0);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(8, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(8, 0, 0, 0);
        break;
    }

    return next;
  }

  /**
   * Get distribution details
   */
  static async getDistributionDetails(jobId: string): Promise<ScheduledDistribution | null> {
    return this.scheduledJobs.get(jobId) || null;
  }

  /**
   * List all distributions for a report
   */
  static async listReportDistributions(reportId: string): Promise<ScheduledDistribution[]> {
    const distributions: ScheduledDistribution[] = [];

    this.scheduledJobs.forEach((job) => {
      if (job.reportId === reportId) {
        distributions.push(job);
      }
    });

    return distributions;
  }
}
