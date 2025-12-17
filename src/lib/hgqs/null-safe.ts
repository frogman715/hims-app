/**
 * HGQS helper utilities for handling optional relations and nullable fields.
 * These helpers keep Prisma create/update payloads clean by avoiding redundant
 * ternaries across the HR & quality modules.
 */

const BLANK_VALUE = /^\s*$/;

type ConnectShape = { connect: { id: string } };
type DisconnectShape = { disconnect: { id: string } };

export function nullIfEmpty(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return BLANK_VALUE.test(value) ? null : value;
}

export function connectIfPresent(id?: string | null): ConnectShape | undefined {
  const normalized = nullIfEmpty(id);
  return normalized ? { connect: { id: normalized } } : undefined;
}

export function disconnectIfPresent(id?: string | null): DisconnectShape | undefined {
  const normalized = nullIfEmpty(id);
  return normalized ? { disconnect: { id: normalized } } : undefined;
}

export function nullableDate(value?: string | Date | null): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function ensureArray<T>(value?: T | T[] | null): T[] {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined && item !== null) as T[];
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
}

export function coalesceRelationId(value?: string | null): string | null {
  return nullIfEmpty(value);
}

export function nullableSet<T>(value: T | null | undefined): T | null {
  return value === undefined ? null : value;
}
