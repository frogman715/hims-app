/**
 * Application-wide constants for HIMS
 * Centralized configuration values to avoid magic numbers/strings
 */

// ========================================
// DOCUMENT & CERTIFICATE EXPIRY WARNINGS
// ========================================

/** Days before document expiry to show warning (30 days) */
export const DOCUMENT_EXPIRY_WARNING_DAYS = 30;

/** Days before contract expiry to show warning (60 days) */
export const CONTRACT_EXPIRY_WARNING_DAYS = 60;

/** Days before certificate expiry to show critical alert (7 days) */
export const CERTIFICATE_CRITICAL_EXPIRY_DAYS = 7;

// ========================================
// PAGINATION & LIMITS
// ========================================

/** Default page size for list views */
export const DEFAULT_PAGE_SIZE = 50;

/** Maximum items per page */
export const MAX_PAGE_SIZE = 200;

/** Dashboard widgets max items */
export const DASHBOARD_WIDGET_LIMIT = 10;

// ========================================
// UI CONSTANTS
// ========================================

/** Sidebar height offset for scrollable content (in pixels) */
export const SIDEBAR_HEIGHT_OFFSET = 300;

/** Toast notification display duration (ms) */
export const TOAST_DURATION = 5000;

/** Debounce delay for search inputs (ms) */
export const SEARCH_DEBOUNCE_MS = 300;

// ========================================
// FILE UPLOAD
// ========================================

/** Maximum file size in bytes (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed file types for documents */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

/** Allowed file extensions */
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// ========================================
// MARITIME SPECIFIC
// ========================================

/** Minimum contract duration in months */
export const MIN_CONTRACT_DURATION_MONTHS = 1;

/** Maximum contract duration in months (per MLC) */
export const MAX_CONTRACT_DURATION_MONTHS = 12;

/** Standard crew sign-on notice period (days) */
export const SIGN_ON_NOTICE_DAYS = 7;

/** Standard crew sign-off notice period (days) */
export const SIGN_OFF_NOTICE_DAYS = 14;

// ========================================
// API RATE LIMITING
// ========================================

/** Rate limit for authentication endpoints (requests per minute) */
export const AUTH_RATE_LIMIT = 5;

/** Rate limit for standard API endpoints (requests per minute) */
export const API_RATE_LIMIT = 60;

/** Rate limit for report generation (requests per hour) */
export const REPORT_RATE_LIMIT = 10;

// ========================================
// SESSION & AUTH
// ========================================

/** JWT session max age (30 days) */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Password minimum length */
export const PASSWORD_MIN_LENGTH = 8;

/** Password reset token expiry (1 hour) */
export const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 60;

// ========================================
// DATA MASKING RULES (per HIMS sensitivity levels)
// ========================================

/** Fields that require RED level encryption */
export const RED_SENSITIVITY_FIELDS = [
  'passport',
  'passportNumber',
  'medicalResults',
  'basicSalary',
  'overtimeRate',
  'seamanCode',
  'ssn',
  'taxId'
];

/** Fields that require AMBER level masking */
export const AMBER_SENSITIVITY_FIELDS = [
  'phone',
  'address',
  'email',
  'birthDate',
  'disciplinaryRecords',
  'certificateNumbers'
];

// ========================================
// EXTERNAL COMPLIANCE SYSTEMS
// ========================================

/** KOSMA certificate validity period (days) */
export const KOSMA_VALIDITY_DAYS = 365;

/** Days before KOSMA expiry to show renewal reminder */
export const KOSMA_RENEWAL_REMINDER_DAYS = 30;

/** Dephub certificate check cooldown (hours) */
export const DEPHUB_CHECK_COOLDOWN_HOURS = 24;

/** Schengen visa processing time estimate (business days) */
export const SCHENGEN_PROCESSING_DAYS = 15;

// ========================================
// QUALITY MANAGEMENT
// ========================================

/** Internal audit frequency (months) */
export const INTERNAL_AUDIT_FREQUENCY_MONTHS = 1;

/** External audit frequency (months) */
export const EXTERNAL_AUDIT_FREQUENCY_MONTHS = 12;

/** Non-conformity follow-up period (days) */
export const NONCONFORMITY_FOLLOWUP_DAYS = 30;

/** Corrective action deadline (days) */
export const CORRECTIVE_ACTION_DEADLINE_DAYS = 30;

// ========================================
// REPORT GENERATION
// ========================================

/** SIUPPAK report valid periods */
export const SIUPPAK_VALID_PERIODS = ['BULANAN', 'SEMESTER', 'TAHUNAN'] as const;

/** Excel report timeout (ms) */
export const EXCEL_GENERATION_TIMEOUT_MS = 30000;

// ========================================
// COMPANY INFO (move to database or env in production)
// ========================================

/** Company legal name */
export const COMPANY_NAME = process.env.COMPANY_NAME || 'PT HANMARINE INTERNATIONAL MARITIME SERVICE';

/** Company address */
export const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || 'Jalan Raya New No. 123, Jakarta Pusat 10110, Indonesia';

/** Company phone */
export const COMPANY_PHONE = process.env.COMPANY_PHONE || '+62 21 1234 5678';

/** Company email */
export const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'office@hanmarine.com';

/** Company license number */
export const COMPANY_LICENSE_NUMBER = process.env.COMPANY_LICENSE_NUMBER || 'SIUPAK/123/2020';

// ========================================
// TYPE EXPORTS
// ========================================

export type SiuppakPeriod = typeof SIUPPAK_VALID_PERIODS[number];
