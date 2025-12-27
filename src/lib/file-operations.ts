/**
 * File Operations Utility
 * Centralized file handling for documents
 */

import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface FileUploadResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
  size: number;
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Upload file to documents directory
 */
export async function uploadDocument(file: File): Promise<FileUploadResult> {
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');

  // Create uploads directory if it doesn't exist
  await mkdir(uploadsDir, { recursive: true });

  // Validate file
  if (!file || file.size === 0) {
    throw new Error('File is empty');
  }

  // Get file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Validate extension (whitelist approach)
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'];
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
  }

  // Generate unique filename with UUID
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${fileExtension}`;
  const filePath = join(uploadsDir, fileName);

  // Write file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  await writeFile(filePath, buffer);

  return {
    fileName,
    filePath,
    fileUrl: `/uploads/documents/${fileName}`,
    size: buffer.length,
  };
}

/**
 * Delete file from disk
 */
export async function deleteDocument(fileUrl: string | null): Promise<FileDeleteResult> {
  if (!fileUrl) {
    return { success: true };
  }

  try {
    const fileName = fileUrl.split('/').pop();

    // Validate fileName to prevent directory traversal attacks
    // Only allow alphanumeric, dash, underscore, and dot
    if (!fileName || !/^[\w\-\.]+$/.test(fileName)) {
      return {
        success: false,
        error: `Invalid file name format: ${fileName}`,
      };
    }

    const filePath = join(process.cwd(), 'public', 'uploads', 'documents', fileName);

    try {
      await unlink(filePath);
      return { success: true };
    } catch (fileError: unknown) {
      const err = fileError as NodeJS.ErrnoException;
      
      // ENOENT means file doesn't exist, which is acceptable
      if (err.code === 'ENOENT') {
        return { success: true };
      }

      return {
        success: false,
        error: `Failed to delete file: ${err.message}`,
      };
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Unexpected error during file deletion: ${err}`,
    };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSize?: number; // in bytes
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
  }
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  } = options || {};

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension .${fileExtension} is not allowed`,
    };
  }

  return { valid: true };
}
