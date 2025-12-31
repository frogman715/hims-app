/**
 * Format a date string for display in the UI using Asia/Jakarta timezone
 * Formats as: DD MMM YYYY (e.g., "20 Des 2025")
 */
export function formatDocumentDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Return original if invalid parse
    
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  } catch (error) {
    console.warn('Failed to format date:', dateStr, error);
    return dateStr || '-';
  }
}

/**
 * Calculate days remaining until a date
 * Returns negative number for expired documents
 */
export function getDaysRemaining(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((expiry.getTime() - now.getTime()) / millisecondsPerDay);
  } catch (error) {
    console.warn('Failed to calculate days remaining:', expiryDate, error);
    return null;
  }
}

/**
 * Get expiry status for display
 */
export function getExpiryStatus(expiryDate: string | null | undefined): 'EXPIRED' | 'EXPIRING' | 'ACTIVE' | 'UNKNOWN' {
  const daysRemaining = getDaysRemaining(expiryDate);
  
  if (daysRemaining === null) return 'UNKNOWN';
  if (daysRemaining < 0) return 'EXPIRED';
  if (daysRemaining <= 90) return 'EXPIRING'; // 3 months warning
  return 'ACTIVE';
}
