/**
 * Centralized Upload Path Management
 * 
 * Provides unified file upload directory management for HIMS.
 * All upload operations should use these utilities to ensure consistent
 * file organization and VPS deployment compatibility.
 * 
 * Directory Structure:
 * /home/hanmarine/seafarers_files/ (production)
 *   └── {crewId}_{slug}/
 *       ├── passport.pdf
 *       ├── photo.jpg
 *       └── certificate_coc.pdf
 * 
 * Environment Variables:
 * - UPLOAD_BASE_DIR: Base directory for all uploads (default: /home/hanmarine/seafarers_files)
 * - UPLOAD_MAX_SIZE_MB: Maximum file size in MB (default: 20)
 */

import path from 'path';
import fs from 'fs';

// Default base directory for production VPS
const DEFAULT_BASE = '/home/hanmarine/seafarers_files';

/**
 * Get the base upload directory from environment or use default
 * @returns Absolute path to the base upload directory
 */
export function getUploadBaseDir(): string {
  return process.env.UPLOAD_BASE_DIR || DEFAULT_BASE;
}

/**
 * Get maximum allowed file size in bytes
 * @returns Maximum file size in bytes
 */
export function getMaxFileSize(): number {
  const maxSizeMB = Number(process.env.UPLOAD_MAX_SIZE_MB || '20');
  return maxSizeMB * 1024 * 1024;
}

/**
 * Create and ensure crew-specific upload directory exists
 * 
 * @param crewId - Crew/Seafarer ID (e.g., "cm123abc")
 * @param slug - Human-readable crew identifier (e.g., "JOHN_DOE_MASTER")
 * @returns Absolute path to the crew's upload directory
 * 
 * @example
 * const dir = ensureCrewUploadDir("cm123abc", "JOHN_DOE_MASTER");
 * // Returns: /home/hanmarine/seafarers_files/cm123abc_JOHN_DOE_MASTER
 */
export function ensureCrewUploadDir(crewId: string | number, slug: string): string {
  const base = getUploadBaseDir();
  
  // Sanitize inputs to prevent directory traversal
  const sanitizedId = String(crewId).replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '');
  
  const dirname = `${sanitizedId}_${sanitizedSlug}`;
  const fullPath = path.join(base, dirname);

  // Create directory if it doesn't exist
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return fullPath;
}

/**
 * Build full file path for a crew member's file
 * 
 * @param crewId - Crew/Seafarer ID
 * @param slug - Human-readable crew identifier
 * @param filename - Target filename (will be sanitized)
 * @returns Absolute path to the file
 * 
 * @example
 * const filePath = buildCrewFilePath("cm123abc", "JOHN_DOE_MASTER", "passport.pdf");
 * // Returns: /home/hanmarine/seafarers_files/cm123abc_JOHN_DOE_MASTER/passport.pdf
 */
export function buildCrewFilePath(
  crewId: string | number,
  slug: string,
  filename: string
): string {
  const dir = ensureCrewUploadDir(crewId, slug);
  
  // Sanitize filename to prevent path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_.\-]/g, '_');
  
  return path.join(dir, sanitizedFilename);
}

/**
 * Get relative path from base directory (useful for storing in database)
 * 
 * @param absolutePath - Absolute file path
 * @returns Relative path from upload base directory
 * 
 * @example
 * const relativePath = getRelativePath("/home/hanmarine/seafarers_files/cm123abc_JOHN_DOE/photo.jpg");
 * // Returns: "cm123abc_JOHN_DOE/photo.jpg"
 */
export function getRelativePath(absolutePath: string): string {
  const base = getUploadBaseDir();
  return absolutePath.replace(base, '').replace(/^\//, '');
}

/**
 * Get absolute path from relative path stored in database
 * 
 * @param relativePath - Relative path from database
 * @returns Absolute file path
 * 
 * @example
 * const absolutePath = getAbsolutePath("cm123abc_JOHN_DOE/photo.jpg");
 * // Returns: "/home/hanmarine/seafarers_files/cm123abc_JOHN_DOE/photo.jpg"
 */
export function getAbsolutePath(relativePath: string): string {
  const base = getUploadBaseDir();
  return path.join(base, relativePath);
}

/**
 * Generate safe filename with timestamp and crew info
 * 
 * @param crewId - Crew/Seafarer ID
 * @param fileType - Type of file (e.g., "photo", "passport", "coc")
 * @param originalFilename - Original uploaded filename
 * @returns Sanitized filename with timestamp
 * 
 * @example
 * const filename = generateSafeFilename("cm123abc", "photo", "my photo.jpg");
 * // Returns: "20251230_cm123abc_photo.jpg"
 */
export function generateSafeFilename(
  crewId: string | number,
  fileType: string,
  originalFilename: string
): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const extension = path.extname(originalFilename).toLowerCase();
  const sanitizedType = fileType.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  
  return `${timestamp}_${crewId}_${sanitizedType}${extension}`;
}

export function generateCrewDocumentFilename(params: {
  crewName: string;
  rank: string;
  docType: string;
  docNumber: string;
  extension: string;
  issuedAt?: Date;
}): string {
  const date = params.issuedAt ?? new Date();
  const timestamp = date.toISOString().split('T')[0].replace(/-/g, '');
  const crewName = params.crewName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const rank = params.rank.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const docType = params.docType.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const docNumber = params.docNumber.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const extension = params.extension.startsWith('.') ? params.extension.toLowerCase() : `.${params.extension.toLowerCase()}`;

  return `${timestamp}_${crewName}_${rank}_${docType}_${docNumber}${extension}`;
}

/**
 * Validate file path to prevent directory traversal attacks
 * 
 * @param filePath - Path to validate
 * @returns True if path is safe, false otherwise
 */
export function isPathSafe(filePath: string): boolean {
  const base = getUploadBaseDir();
  const resolved = path.resolve(filePath);
  return resolved.startsWith(base);
}

/**
 * Delete a file safely
 * 
 * @param filePath - Absolute path to file to delete
 * @returns True if deleted successfully, false otherwise
 */
export function deleteFileSafe(filePath: string): boolean {
  try {
    // Validate path is within upload directory
    if (!isPathSafe(filePath)) {
      console.error('[UPLOAD] Attempted to delete file outside upload directory:', filePath);
      return false;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    // File doesn't exist, consider it a success
    return true;
  } catch (error) {
    console.error('[UPLOAD] Error deleting file:', error);
    return false;
  }
}
