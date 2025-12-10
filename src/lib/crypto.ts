import crypto from 'crypto';

// AES-256-GCM encryption/decryption helper
// Uses environment variable HIMS_CRYPTO_KEY for the encryption key

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.HIMS_CRYPTO_KEY;
  if (!key) {
    throw new Error('HIMS_CRYPTO_KEY environment variable is not set');
  }
  if (key.length < KEY_LENGTH) {
    throw new Error('HIMS_CRYPTO_KEY must be at least 32 characters long');
  }
  return Buffer.from(key.slice(0, KEY_LENGTH), 'utf8');
}

/**
 * Encrypts a plain text string using AES-256-GCM
 * @param plain - The plain text to encrypt
 * @returns Base64 encoded encrypted string with IV and auth tag
 */
export function encrypt(plain: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from('HANMARINE_HIMS')); // Additional authenticated data

  let encrypted = cipher.update(plain, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV + Auth Tag + Encrypted Data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);

  return combined.toString('base64');
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 * @param cipherText - The base64 encoded encrypted string
 * @returns The decrypted plain text
 */
export function decrypt(cipherText: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(cipherText, 'base64');

  // Extract IV (first 16 bytes), Auth Tag (next 16 bytes), and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from('HANMARINE_HIMS'));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Checks if a user has RED sensitivity access for a specific data type
 * @param userRoles - Array of user roles
 * @param dataType - Type of data being accessed ('medical', 'salary', 'identity')
 * @returns boolean indicating if user can access decrypted RED data
 */
import { hasSensitivityAccess } from '@/lib/permissions';
import { DataSensitivity } from '@prisma/client';

const sensitivityMap: Record<'medical' | 'salary' | 'identity', DataSensitivity> = {
  medical: DataSensitivity.RED,
  salary: DataSensitivity.RED,
  identity: DataSensitivity.RED
};

export function canAccessRedData(userRoles: string[], dataType: 'medical' | 'salary' | 'identity'): boolean {
  const requiredSensitivity = sensitivityMap[dataType];
  return hasSensitivityAccess(userRoles, requiredSensitivity);
}