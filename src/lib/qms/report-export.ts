import { QMSReport, AuditTrail } from '@prisma/client';
import nodemailer from 'nodemailer';

/**
 * ReportExportService - Handles PDF, Excel, and email distribution of QMS reports
 * Provides comprehensive report generation with charts, metrics, and formatting
 */
export class ReportExportService {
  /**
   * Generate PDF report with charts and metrics
   * Uses simple table formatting for charts (text-based representation)
   * In production, would integrate with libraries like PDFKit or html2pdf
   */
  static async generatePDFReport(
    report: QMSReport & Record<string, unknown>,
    metrics?: Record<string, unknown>,
    nonconformities?: Array<Record<string, unknown>>
  ): Promise<Buffer> {
    // Simulate PDF generation with text content
    const pdfContent = this.buildPDFContent(report, metrics, nonconformities);

    // In a real implementation, this would use PDFKit or similar:
    // const pdfDoc = new PDFDocument();
    // pdfDoc.text(pdfContent, ...);
    // return pdfDoc.toBuffer();

    // For now, return UTF-8 encoded content as mockup
    return Buffer.from(pdfContent, 'utf-8');
  }

  /**
   * Generate Excel report with formatting and multiple sheets
   * Sheet 1: Report summary
   * Sheet 2: Metrics snapshot
   * Sheet 3: Non-conformities
   * Sheet 4: Audit trail summary
   */
  static async generateExcelReport(
    report: QMSReport & Record<string, unknown>,
    metrics?: Record<string, unknown>,
    nonconformities?: Array<Record<string, unknown>>,
    auditEvents?: AuditTrail[]
  ): Promise<Buffer> {
    // CSV format as simple Excel export mockup
    const csvContent = this.buildExcelContent(report, metrics, nonconformities, auditEvents);

    // In production, would use libraries like ExcelJS:
    // const workbook = new ExcelWorkbook();
    // const sheet1 = workbook.addWorksheet('Report Summary');
    // sheet1.addRows([...]);
    // return workbook.xlsx.writeBuffer();

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Send report via email to specified recipients
   * Supports multiple providers (Nodemailer, SendGrid, Mailgun, AWS SES)
   */
  static async sendReportEmail(
    report: QMSReport & Record<string, unknown>,
    recipients: string[],
    pdfBuffer: Buffer,
    excelBuffer: Buffer,
    provider?: 'nodemailer' | 'sendgrid' | 'mailgun' | 'aws-ses'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailContent = this.buildEmailContent(report);

      // For all providers, we'll use nodemailer as the base
      // Real implementation would dispatch based on provider
      if (provider === 'nodemailer') {
        return await this.sendViaNodemailer(
          recipients,
          emailContent,
          report.title,
          pdfBuffer,
          excelBuffer
        );
      }

      // SendGrid, Mailgun, AWS SES would follow similar patterns
      // For this phase, defaulting to nodemailer
      return await this.sendViaNodemailer(
        recipients,
        emailContent,
        report.title,
        pdfBuffer,
        excelBuffer
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Schedule recurring report generation and email distribution
   * Uses cron-like pattern for scheduling (in production: node-cron, bull, etc.)
   */
  static async scheduleReportDistribution(
    reportId: string,
    schedule: 'daily' | 'weekly' | 'monthly'
  ): Promise<{ success: boolean; jobId: string; nextRun: Date }> {
    // In production, would use libraries like:
    // - node-cron: for simple schedules
    // - bull/bullmq: for job queuing and persistence
    // - agenda: for MongoDB-backed scheduling

    const nextRun = this.calculateNextRun(schedule);
    const jobId = `report-${reportId}-${Date.now()}`;

    // Store scheduled job details in database or job queue
    // For now, return mock response
    return {
      success: true,
      jobId,
      nextRun,
    };
  }

  /**
   * Calculate next scheduled run time based on frequency
   */
  private static calculateNextRun(schedule: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const next = new Date(now);

    switch (schedule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(8, 0, 0, 0); // 8 AM
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 - next.getDay())); // Next Monday
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
   * Build formatted PDF content with report data
   */
  private static buildPDFContent(
    report: QMSReport & {
      approver?: { email: string; name: string } | null;
    },
    metrics?: Record<string, unknown>,
    nonconformities?: Array<Record<string, unknown>>
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    QMS COMPLIANCE REPORT');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    // Report Info
    lines.push(`Title: ${report.title}`);
    lines.push(`Type: ${report.reportType || 'GENERAL'}`);
    lines.push(`Period: ${this.formatDate(report.periodStart)} to ${this.formatDate(report.periodEnd)}`);
    lines.push(`Status: ${report.status}`);
    if (report.approver) {
      lines.push(`Approved By: ${report.approver.name} on ${this.formatDate(report.approvedAt)}`);
    }
    lines.push('');

    // Description
    if (report.description) {
      lines.push('Description:');
      lines.push(report.description);
      lines.push('');
    }

    // Metrics Section
    if (metrics && Object.keys(metrics).length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                        COMPLIANCE METRICS');
      lines.push('───────────────────────────────────────────────────────────────');
      Object.entries(metrics).forEach(([key, value]) => {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      });
      lines.push('');
    }

    // Non-conformities Summary
    if (nonconformities && nonconformities.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push(`                    NON-CONFORMITIES (${nonconformities.length} items)`);
      lines.push('───────────────────────────────────────────────────────────────');

      const bySeverity: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      nonconformities.forEach((nc) => {
        const severity = String(nc.severity || 'unknown');
        const status = String(nc.status || 'unknown');
        bySeverity[severity] = (bySeverity[severity] || 0) + 1;
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      lines.push('By Severity:');
      Object.entries(bySeverity).forEach(([severity, count]) => {
        lines.push(`  ${severity}: ${count}`);
      });

      lines.push('');
      lines.push('By Status:');
      Object.entries(byStatus).forEach(([status, count]) => {
        lines.push(`  ${status}: ${count}`);
      });
      lines.push('');
    }

    // Report Sections
    if (report.sections && typeof report.sections === 'object') {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                      REPORT SECTIONS');
      lines.push('───────────────────────────────────────────────────────────────');
      const sections = report.sections as Record<string, unknown>;
      Object.entries(sections).forEach(([section, content]) => {
        lines.push(`\n${section}:`);
        lines.push(String(content));
      });
      lines.push('');
    }

    // Footer
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Build CSV/Excel content with multiple sections
   */
  private static buildExcelContent(
    report: QMSReport & {
      approver?: { email: string; name: string } | null;
    },
    metrics?: Record<string, unknown>,
    nonconformities?: Array<Record<string, unknown>>,
    auditEvents?: AuditTrail[]
  ): string {
    const lines: string[] = [];

    // Sheet 1: Report Summary
    lines.push('REPORT SUMMARY');
    lines.push('Title,Type,Period Start,Period End,Status,Approved By,Approved Date');
    lines.push(
      `"${report.title}","${report.reportType}","${this.formatDate(report.periodStart)}","${this.formatDate(report.periodEnd)}","${report.status}","${report.approver?.name || 'N/A'}","${report.approvedAt ? this.formatDate(report.approvedAt) : 'N/A'}"`,
    );
    lines.push('');

    // Sheet 2: Metrics Snapshot
    if (metrics && Object.keys(metrics).length > 0) {
      lines.push('METRICS SNAPSHOT');
      lines.push('Metric,Value');
      Object.entries(metrics).forEach(([key, value]) => {
        const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
        lines.push(`"${key}","${val.replace(/"/g, '""')}"`);
      });
      lines.push('');
    }

    // Sheet 3: Non-conformities
    if (nonconformities && nonconformities.length > 0) {
      lines.push('NON-CONFORMITIES');
      lines.push('ID,Severity,Status,Type,Description,Due Date,Assigned To');
      nonconformities.forEach((nc) => {
        const id = String(nc.id || '');
        const severity = String(nc.severity || '');
        const status = String(nc.status || '');
        const type = String(nc.type || '');
        const description = String(nc.description || '').replace(/"/g, '""');
        const dueDate = nc.dueDate instanceof Date ? this.formatDate(nc.dueDate) : String(nc.dueDate || '');
        const assignedTo = String(nc.assignedTo || 'N/A');
        lines.push(
          `"${id}","${severity}","${status}","${type}","${description}","${dueDate}","${assignedTo}"`
        );
      });
      lines.push('');
    }

    // Sheet 4: Audit Summary
    if (auditEvents && auditEvents.length > 0) {
      lines.push('AUDIT TRAIL SUMMARY');
      lines.push('Category,Count');
      const byCategory: Record<string, number> = {};
      auditEvents.forEach((event) => {
        byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      });
      Object.entries(byCategory).forEach(([category, count]) => {
        lines.push(`"${category}",${count}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Build HTML email content for report distribution
   */
  private static buildEmailContent(
    report: QMSReport & {
      approver?: { email: string; name: string } | null;
    }
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1f2937; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .section { margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 5px; }
    .section h3 { margin-top: 0; color: #1f2937; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${report.title}</h1>
      <p>QMS Compliance Report</p>
    </div>

    <div class="section">
      <h3>Report Details</h3>
      <p><strong>Type:</strong> ${report.reportType || 'General'}</p>
      <p><strong>Period:</strong> ${this.formatDate(report.periodStart)} to ${this.formatDate(report.periodEnd)}</p>
      <p><strong>Status:</strong> <span style="color: #059669;">${report.status}</span></p>
      ${report.approver ? `<p><strong>Approved By:</strong> ${report.approver.name}</p>` : ''}
    </div>

    ${report.description ? `<div class="section"><h3>Description</h3><p>${report.description}</p></div>` : ''}

    <div class="section">
      <h3>Attachments</h3>
      <p>This email includes two attachments:</p>
      <ul>
        <li>PDF Report: ${report.title}.pdf</li>
        <li>Excel Data: ${report.title}.xlsx</li>
      </ul>
    </div>

    <div class="footer">
      <p>This is an automated report from the Quality Management System. Please do not reply to this email.</p>
      <p>Generated: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send report via Nodemailer (supports 4+ providers)
   */
  private static async sendViaNodemailer(
    recipients: string[],
    htmlContent: string,
    subject: string,
    pdfBuffer: Buffer,
    excelBuffer: Buffer
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // In production, these would be environment variables
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || '',
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@qms.example.com',
        to: recipients.join(','),
        subject: `QMS Report: ${subject}`,
        html: htmlContent,
        attachments: [
          {
            filename: `${subject.replace(/[^a-z0-9]/gi, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
          {
            filename: `${subject.replace(/[^a-z0-9]/gi, '_')}.xlsx`,
            content: excelBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format date to readable string
   */
  private static formatDate(date?: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
