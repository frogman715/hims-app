const BUSINESS_ROLE_ALIASES = {
  DOCUMENT: "CDMO",
  DRIVER: "GA_DRIVER",
} as const;

export function normalizeRoleToken(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  return BUSINESS_ROLE_ALIASES[normalized as keyof typeof BUSINESS_ROLE_ALIASES] ?? normalized;
}

export function normalizeRoleTokens(
  ...sources: Array<string | string[] | null | undefined>
): string[] {
  const collected: string[] = [];

  for (const source of sources) {
    if (!source) {
      continue;
    }

    const values = Array.isArray(source) ? source : [source];
    for (const value of values) {
      const normalized = normalizeRoleToken(value);
      if (normalized) {
        collected.push(normalized);
      }
    }
  }

  return Array.from(new Set(collected));
}
