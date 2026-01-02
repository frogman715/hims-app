/**
 * Email Service
 * Provider-agnostic email sending service
 * Supports: Gmail, SendGrid, Nodemailer, Mailgun, AWS SES
 */

import nodemailer from 'nodemailer';
import { EmailConfig, EmailProvider } from './email-config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Abstrak Email Service
 * Implementasi untuk berbagai provider
 */
export class EmailService {
  private config: EmailConfig;
  private transporter?: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeTransporter();
  }

  /**
   * Initialize transporter based on provider
   */
  private initializeTransporter(): void {
    switch (this.config.provider) {
      case EmailProvider.NODEMAILER:
      case EmailProvider.GMAIL:
        this.initializeNodemailer();
        break;

      case EmailProvider.SENDGRID:
        // SendGrid akan dihandle dengan REST API
        console.log('📧 SendGrid configuration ready');
        break;

      case EmailProvider.AWS_SES:
        // AWS SES akan dihandle dengan SDK
        console.log('📧 AWS SES configuration ready');
        break;

      case EmailProvider.MAILGUN:
        // Mailgun akan dihandle dengan API
        console.log('📧 Mailgun configuration ready');
        break;
    }
  }

  /**
   * Initialize Nodemailer transporter
   */
  private initializeNodemailer(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure, // true untuk 465, false untuk 587
      auth: {
        user: this.config.auth?.user,
        pass: this.config.auth?.pass,
      },
      // For Gmail
      ...(this.config.provider === EmailProvider.GMAIL && {
        service: 'gmail',
      }),
    });
  }

  /**
   * Send email via Nodemailer
   */
  private async sendViaNodemailer(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      if (!this.transporter) {
        throw new Error('Nodemailer transporter not initialized');
      }

      const result = await this.transporter.sendMail({
        from: options.from || this.config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: {
            email: options.from || this.config.from,
          },
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid error: ${error}`);
      }

      return {
        success: true,
        messageId: response.headers.get('x-message-id') || 'unknown',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send email via Mailgun
   */
  private async sendViaMailgun(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      const formData = new FormData();
      formData.append('from', options.from || this.config.from);
      formData.append('to', options.to);
      formData.append('subject', options.subject);
      formData.append('html', options.html);

      const auth = Buffer.from(`api:${this.config.apiKey}`).toString('base64');

      const response = await fetch(
        `https://api.mailgun.net/v3/${this.config.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mailgun error: ${error}`);
      }

      const data = (await response.json()) as { id: string };
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send email (provider-agnostic)
   * Automatically routes to correct provider
   */
  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      console.log(`📧 Sending email to ${options.to} via ${this.config.provider}...`);

      let result: EmailSendResult;

      switch (this.config.provider) {
        case EmailProvider.NODEMAILER:
        case EmailProvider.GMAIL:
          result = await this.sendViaNodemailer(options);
          break;

        case EmailProvider.SENDGRID:
          result = await this.sendViaSendGrid(options);
          break;

        case EmailProvider.MAILGUN:
          result = await this.sendViaMailgun(options);
          break;

        case EmailProvider.AWS_SES:
          // TODO: Implement AWS SES
          result = {
            success: false,
            error: 'AWS SES not yet implemented',
          };
          break;

        default:
          result = {
            success: false,
            error: `Unknown provider: ${this.config.provider}`,
          };
      }

      if (result.success) {
        console.log(`✅ Email sent successfully! Message ID: ${result.messageId}`);
      } else {
        console.error(`❌ Failed to send email: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Email service error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send batch emails
   * Useful for sending to multiple recipients
   */
  async sendBatch(
    recipients: string[],
    subject: string,
    html: string
  ): Promise<EmailSendResult[]> {
    const results = await Promise.all(
      recipients.map((to) =>
        this.send({
          to,
          subject,
          html,
        })
      )
    );
    return results;
  }

  /**
   * Verify connection (test email config)
   */
  async verify(): Promise<boolean> {
    try {
      if (this.config.provider === EmailProvider.NODEMAILER || this.config.provider === EmailProvider.GMAIL) {
        if (!this.transporter) {
          console.error('❌ Nodemailer transporter not initialized');
          return false;
        }
        await this.transporter.verify();
        console.log('✅ Email service connected successfully');
        return true;
      }
      console.log('✅ Email service configured (provider: ' + this.config.provider + ')');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Email service verification failed: ${errorMessage}`);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let emailService: EmailService | null = null;

/**
 * Get or create email service instance
 */
export function getEmailService(config: EmailConfig): EmailService {
  if (!emailService) {
    emailService = new EmailService(config);
  }
  return emailService;
}
