/**
 * Email Configuration
 * Provider-agnostic email service configuration
 * Support: Gmail, SendGrid, Nodemailer, Mailgun, AWS SES, etc
 */

export enum EmailProvider {
  NODEMAILER = 'nodemailer',
  SENDGRID = 'sendgrid',
  GMAIL = 'gmail',
  MAILGUN = 'mailgun',
  AWS_SES = 'aws_ses',
}

export interface EmailConfig {
  provider: EmailProvider;
  from: string; // "noreply@hims.com" atau "HIMS <noreply@hims.com>"
  
  // Nodemailer SMTP config
  host?: string;
  port?: number;
  secure?: boolean; // true untuk 465, false untuk 587
  auth?: {
    user: string;
    pass: string;
  };
  
  // SendGrid API key
  apiKey?: string;
  
  // AWS SES config
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  
  // Mailgun config
  domain?: string;
}

/**
 * Get email configuration dari environment variables
 * Priority: Environment variables > Default fallback
 */
export function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || EmailProvider.NODEMAILER) as EmailProvider;
  
  const config: EmailConfig = {
    provider,
    from: process.env.EMAIL_FROM || 'noreply@hims.com',
  };

  // Nodemailer configuration
  if (provider === EmailProvider.NODEMAILER || provider === EmailProvider.GMAIL) {
    config.host = process.env.SMTP_HOST || 'smtp.gmail.com';
    config.port = parseInt(process.env.SMTP_PORT || '587');
    config.secure = process.env.SMTP_SECURE === 'true' ? true : false;
    config.auth = {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    };
  }

  // SendGrid configuration
  if (provider === EmailProvider.SENDGRID) {
    config.apiKey = process.env.SENDGRID_API_KEY || '';
  }

  // AWS SES configuration
  if (provider === EmailProvider.AWS_SES) {
    config.accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    config.region = process.env.AWS_REGION || 'us-east-1';
  }

  // Mailgun configuration
  if (provider === EmailProvider.MAILGUN) {
    config.apiKey = process.env.MAILGUN_API_KEY || '';
    config.domain = process.env.MAILGUN_DOMAIN || '';
  }

  return config;
}

/**
 * Validate email configuration
 * Ensures required fields are present for chosen provider
 */
export function validateEmailConfig(config: EmailConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.from) {
    errors.push('EMAIL_FROM is required');
  }

  switch (config.provider) {
    case EmailProvider.NODEMAILER:
    case EmailProvider.GMAIL:
      if (!config.host) errors.push('SMTP_HOST is required');
      if (!config.port) errors.push('SMTP_PORT is required');
      if (!config.auth?.user) errors.push('SMTP_USER is required');
      if (!config.auth?.pass) errors.push('SMTP_PASS is required');
      break;

    case EmailProvider.SENDGRID:
      if (!config.apiKey) errors.push('SENDGRID_API_KEY is required');
      break;

    case EmailProvider.AWS_SES:
      if (!config.accessKeyId) errors.push('AWS_ACCESS_KEY_ID is required');
      if (!config.secretAccessKey) errors.push('AWS_SECRET_ACCESS_KEY is required');
      break;

    case EmailProvider.MAILGUN:
      if (!config.apiKey) errors.push('MAILGUN_API_KEY is required');
      if (!config.domain) errors.push('MAILGUN_DOMAIN is required');
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
