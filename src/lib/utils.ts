import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility untuk merge Tailwind CSS classes dengan proper conflict resolution
 * Menggunakan clsx untuk conditional classes dan tailwind-merge untuk deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
