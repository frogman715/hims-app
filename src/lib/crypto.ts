import crypto from 'crypto';
import { env } from '@/lib/env';

// AES-256-GCM encryption/decryption helper
// Uses environment variable HIMS_CRYPTO_KEY for the encryption key

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = env.HIMS_CRYPTO_KEY;
  if (!env.hasCryptoKey || !key) {
    console.error('[crypto] invalid HIMS_CRYPTO_KEY', {
      present: Boolean(key),
      length: typeof key === 'string' ? key.length : 0,
    });
    throw new Error('Encryption key misconfigured');
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

  const decryptedBuffers = [decipher.update(encrypted), decipher.final()];
  return Buffer.concat(decryptedBuffers).toString('utf8');
}

import { hasSensitivityAccess, DataSensitivity, UserRole } from '@/lib/permissions';

function normalizeRole(value: string | UserRole): UserRole | null {
  const candidate = value.toString().trim().toUpperCase();
  return (Object.values(UserRole) as string[]).includes(candidate)
    ? (candidate as UserRole)
    : null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canAccessRedData(userRoles: (string | UserRole)[], _dataType: 'medical' | 'salary' | 'identity'): boolean {
  const requiredSensitivity = DataSensitivity.RED;
  const normalizedRoles = userRoles
    .map((role) => normalizeRole(role))
    .filter((role): role is UserRole => role !== null);

  return hasSensitivityAccess(normalizedRoles, requiredSensitivity);
}