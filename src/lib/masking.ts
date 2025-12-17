/**
 * Masking helpers for sensitive data display in UI
 * Used when users don't have RED access to show partial data instead of full values
 */

/**
 * Masks a passport number
 * Example: "C1234567" -> "C1****67"
 */
export function maskPassport(passport: string): string {
  if (!passport || passport.length < 4) return '****';

  const firstTwo = passport.slice(0, 2);
  const lastTwo = passport.slice(-2);
  const middleStars = '*'.repeat(Math.max(0, passport.length - 4));

  return `${firstTwo}${middleStars}${lastTwo}`;
}

/**
 * Masks a generic document number while leaving minimal context for verification
 */
export function maskDocumentNumber(documentNumber: string): string {
  if (!documentNumber) {
    return '****';
  }

  const normalized = documentNumber.trim();
  if (normalized.length <= 4) {
    return '*'.repeat(normalized.length || 4);
  }

  const visiblePrefix = normalized.slice(0, 2);
  const visibleSuffix = normalized.slice(-2);
  const hiddenLength = Math.max(0, normalized.length - (visiblePrefix.length + visibleSuffix.length));

  return `${visiblePrefix}${'*'.repeat(hiddenLength)}${visibleSuffix}`;
}

/**
 * Masks a seaman code (10-digit Indonesian seafarer code)
 * Example: "1234567890" -> "1234****90"
 */
export function maskSeamanCode(code: string): string {
  if (!code || code.length !== 10) return '****';

  return `${code.slice(0, 4)}****${code.slice(-2)}`;
}

/**
 * Masks a currency/salary amount
 * Example: 5000 -> "****"
 * For display purposes, we hide the full amount when user lacks RED access
 */
export function maskCurrency(amount: number): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '****';
  }

  const normalized = Math.abs(amount).toFixed(2);
  const lastDigits = normalized.replace('.', '').slice(-2).padStart(2, '0');
  const sign = amount < 0 ? '-' : '';

  return `${sign}****${lastDigits}`;
}

/**
 * Masks medical result/status
 * Example: "PASS" -> "**SS", "FAIL" -> "F**L"
 */
export function maskMedicalResult(result: string): string {
  if (!result || result.length < 3) return '***';

  const first = result.charAt(0);
  const last = result.charAt(result.length - 1);
  const middleStars = '*'.repeat(Math.max(0, result.length - 2));

  return `${first}${middleStars}${last}`;
}

/**
 * Masks medical remarks/notes
 * Shows only first few characters then asterisks
 */
export function maskMedicalRemarks(remarks: string): string {
  if (!remarks) return '';

  const visibleChars = Math.min(10, remarks.length);
  const masked = '*'.repeat(Math.max(0, remarks.length - visibleChars));

  return `${remarks.slice(0, visibleChars)}${masked}`;
}