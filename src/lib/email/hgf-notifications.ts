/**
 * HGF Email Notifications
 * Wrapper functions untuk mengirim email terkait HGF form submissions
 */

import { PrismaClient } from '@prisma/client';
import { EmailService } from './email-service';
import {
  submissionConfirmationTemplate,
  approvalNotificationTemplate,
  rejectionNotificationTemplate,
  documentExpiryWarningTemplate,
  missingDocumentsTemplate,
  approvalRequestTemplate,
} from './email-templates';

export interface HGFEmailNotificationOptions {
  emailService: EmailService;
  prisma: PrismaClient;
  appBaseUrl: string; // e.g., "https://hims.example.com"
}

export class HGFEmailNotifications {
  private emailService: EmailService;
  private prisma: PrismaClient;
  private appBaseUrl: string;

  constructor(options: HGFEmailNotificationOptions) {
    this.emailService = options.emailService;
    this.prisma = options.prisma;
    this.appBaseUrl = options.appBaseUrl;
  }

  /**
   * Send submission confirmation email to crew
   */
  async sendSubmissionConfirmation(submissionId: string): Promise<void> {
    try {
      const submission = await this.prisma.hGFSubmission.findUnique({
        where: { id: submissionId },
        include: {
          crew: true,
          form: true,
        },
      });

      if (!submission || !submission.crew || !submission.form) {
        console.warn(`Submission ${submissionId} not found`);
        return;
      }

      const template = submissionConfirmationTemplate({
        crewName: submission.crew.fullName || submission.crew.email || 'Crew',
        formName: submission.form.name,
        formCode: submission.form.formCode,
        submissionId: submission.id,
        submittedAt: submission.submittedAt?.toLocaleDateString('id-ID') || 'N/A',
        dashboardUrl: `${this.appBaseUrl}/dashboard/submissions/${submissionId}`,
      });

      await this.emailService.send({
        to: submission.crew.email || '',
        subject: template.subject,
        html: template.html,
      });

      // Log email sent
      await this.prisma.emailNotificationLog.create({
        data: {
          relatedEntityType: 'HGFSubmission',
          relatedEntityId: submission.id,
          recipientEmail: submission.crew.email || '',
          recipientName: submission.crew.fullName,
          emailType: 'SUBMISSION_CONFIRMATION',
          subject: template.subject,
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error(`Failed to send submission confirmation: ${error}`);
      // Don't throw - email failure shouldn't block form submission
    }
  }

  /**
   * Send approval notification email to crew
   */
  async sendApprovalNotification(submissionId: string, approverId: string, remarks: string): Promise<void> {
    try {
      const submission = await this.prisma.hGFSubmission.findUnique({
        where: { id: submissionId },
        include: {
          crew: true,
          form: true,
        },
      });

      const approver = await this.prisma.user.findUnique({
        where: { id: approverId },
      });

      if (!submission || !submission.crew || !submission.form || !approver) {
        console.warn(`Submission ${submissionId} or approver not found`);
        return;
      }

      const template = approvalNotificationTemplate({
        crewName: submission.crew.fullName || submission.crew.email || 'Crew',
        formName: submission.form.name,
        formCode: submission.form.formCode,
        approverName: approver.name || 'Manager',
        approvalRemarks: remarks,
        approvedAt: new Date().toLocaleDateString('id-ID'),
        dashboardUrl: `${this.appBaseUrl}/dashboard/submissions/${submissionId}`,
      });

      await this.emailService.send({
        to: submission.crew.email || '',
        subject: template.subject,
        html: template.html,
      });

      // Log email sent
      await this.prisma.emailNotificationLog.create({
        data: {
          relatedEntityType: 'HGFSubmission',
          relatedEntityId: submission.id,
          recipientEmail: submission.crew.email || '',
          recipientName: submission.crew.fullName,
          emailType: 'APPROVAL_NOTIFICATION',
          subject: template.subject,
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error(`Failed to send approval notification: ${error}`);
    }
  }

  /**
   * Send rejection notification email to crew
   */
  async sendRejectionNotification(submissionId: string, rejectionReason: string): Promise<void> {
    try {
      const submission = await this.prisma.hGFSubmission.findUnique({
        where: { id: submissionId },
        include: {
          crew: true,
          form: true,
        },
      });

      if (!submission || !submission.crew || !submission.form) {
        console.warn(`Submission ${submissionId} not found`);
        return;
      }

      const template = rejectionNotificationTemplate({
        crewName: submission.crew.fullName || submission.crew.email || 'Crew',
        formName: submission.form.name,
        formCode: submission.form.formCode,
        rejectionReason,
        rejectedAt: new Date().toLocaleDateString('id-ID'),
        dashboardUrl: `${this.appBaseUrl}/dashboard/submissions/${submissionId}`,
      });

      await this.emailService.send({
        to: submission.crew.email || '',
        subject: template.subject,
        html: template.html,
      });

      // Log email sent
      await this.prisma.emailNotificationLog.create({
        data: {
          relatedEntityType: 'HGFSubmission',
          relatedEntityId: submission.id,
          recipientEmail: submission.crew.email || '',
          recipientName: submission.crew.fullName,
          emailType: 'REJECTION_NOTIFICATION',
          subject: template.subject,
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error(`Failed to send rejection notification: ${error}`);
    }
  }

  /**
   * Send missing documents reminder email
   */
  async sendMissingDocumentsNotification(
    submissionId: string,
    missingDocuments: string[]
  ): Promise<void> {
    try {
      const submission = await this.prisma.hGFSubmission.findUnique({
        where: { id: submissionId },
        include: {
          crew: true,
        },
      });

      if (!submission || !submission.crew) {
        console.warn(`Submission ${submissionId} not found`);
        return;
      }

      const template = missingDocumentsTemplate({
        crewName: submission.crew.fullName || submission.crew.email || 'Crew',
        submissionId: submission.id,
        missingDocuments,
        requiredBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'), // 3 days from now
        dashboardUrl: `${this.appBaseUrl}/dashboard/submissions/${submissionId}`,
      });

      await this.emailService.send({
        to: submission.crew.email || '',
        subject: template.subject,
        html: template.html,
      });

      // Log email sent
      await this.prisma.emailNotificationLog.create({
        data: {
          relatedEntityType: 'HGFSubmission',
          relatedEntityId: submission.id,
          recipientEmail: submission.crew.email || '',
          recipientName: submission.crew.fullName,
          emailType: 'MISSING_DOCUMENTS',
          subject: template.subject,
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error(`Failed to send missing documents notification: ${error}`);
    }
  }

  /**
   * Send document expiry warning email
   */
  async sendDocumentExpiryWarning(crewId: string, documentTitle: string, expiryDate: Date): Promise<void> {
    try {
      const crew = await this.prisma.user.findUnique({
        where: { id: crewId },
      });

      if (!crew) {
        console.warn(`Crew ${crewId} not found`);
        return;
      }

      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const template = documentExpiryWarningTemplate({
        crewName: crew.name || 'Crew',
        documentTitle,
        expiryDate: expiryDate.toLocaleDateString('id-ID'),
        daysUntilExpiry,
        dashboardUrl: `${this.appBaseUrl}/dashboard/documents`,
      });

      await this.emailService.send({
        to: crew.email || '',
        subject: template.subject,
        html: template.html,
      });

      // Log email sent
      await this.prisma.emailNotificationLog.create({
        data: {
          recipientEmail: crew.email || '',
          recipientName: crew.name,
          emailType: 'DOCUMENT_EXPIRY_WARNING',
          subject: template.subject,
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error(`Failed to send document expiry warning: ${error}`);
    }
  }

  /**
   * Send approval request email to manager
   */
  async sendApprovalRequest(submissionId: string): Promise<void> {
    try {
      const submission = await this.prisma.hGFSubmission.findUnique({
        where: { id: submissionId },
        include: {
          crew: true,
          form: true,
        },
      });

      if (!submission || !submission.crew || !submission.form) {
        console.warn(`Submission ${submissionId} not found`);
        return;
      }

      // Get all managers
      const managers = await this.prisma.user.findMany({
        where: {
          role: {
            in: ['HR', 'HR_ADMIN', 'CDMO', 'DIRECTOR'],
          },
        },
      });

      if (managers.length === 0) {
        console.warn('No managers found to notify');
        return;
      }

      const promises = managers.map(async (manager) => {
        if (!manager.email) return;

        const template = approvalRequestTemplate({
          managerName: manager.name || 'Manager',
          crewName: submission.crew!.fullName || submission.crew!.email || 'Crew',
          formName: submission.form!.name,
          formCode: submission.form!.formCode,
          submittedAt: submission.submittedAt?.toLocaleDateString('id-ID') || 'N/A',
          dashboardUrl: `${this.appBaseUrl}/dashboard/approvals/${submissionId}`,
        });

        await this.emailService.send({
          to: manager.email,
          subject: template.subject,
          html: template.html,
        });

        // Log email sent
        await this.prisma.emailNotificationLog.create({
          data: {
            relatedEntityType: 'HGFSubmission',
            relatedEntityId: submission.id,
            recipientEmail: manager.email,
            recipientName: manager.name,
            emailType: 'APPROVAL_REQUEST',
            subject: template.subject,
            status: 'SENT',
          },
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error(`Failed to send approval request: ${error}`);
    }
  }
}

/**
 * Create HGF Email Notifications instance
 */
export function createHGFEmailNotifications(
  options: HGFEmailNotificationOptions
): HGFEmailNotifications {
  return new HGFEmailNotifications(options);
}
