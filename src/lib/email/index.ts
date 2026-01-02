/**
 * Email Service Initialization
 * Initialize email service on application startup
 */

import { getEmailConfig, validateEmailConfig } from './email-config';
import { EmailService } from './email-service';

let emailService: EmailService | null = null;

/**
 * Initialize email service
 * Call this on application startup
 */
export async function initializeEmailService(): Promise<EmailService> {
  try {
    // Get configuration
    const config = getEmailConfig();

    // Validate configuration
    const validation = validateEmailConfig(config);
    if (!validation.valid) {
      console.warn('⚠️ Email configuration validation failed:');
      validation.errors.forEach((err) => console.warn(`   - ${err}`));
      console.warn('Email service will not send emails. Configure environment variables.');
    }

    // Create email service
    emailService = new EmailService(config);

    // Verify connection
    const connected = await emailService.verify();
    if (!connected && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Email service verification failed in production');
    }

    console.log(`✅ Email service initialized with provider: ${config.provider}`);
    return emailService;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    throw error;
  }
}

/**
 * Get email service instance
 * Ensure initialized first!
 */
export function getEmailServiceInstance(): EmailService {
  if (!emailService) {
    throw new Error('Email service not initialized. Call initializeEmailService() first.');
  }
  return emailService;
}

/**
 * Set email service (for testing)
 */
export function setEmailServiceInstance(service: EmailService): void {
  emailService = service;
}
