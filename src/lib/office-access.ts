import { UserRole } from "@/lib/permissions";

export type OfficeRole =
  | UserRole.DIRECTOR
  | UserRole.CDMO
  | UserRole.OPERATIONAL
  | UserRole.ACCOUNTING
  | UserRole.HR_ADMIN;

type RouteRule = {
  pattern: RegExp;
  allow: OfficeRole[];
};

type ApiRule = {
  pattern: RegExp;
  read: OfficeRole[];
  write?: OfficeRole[];
};

const ALL_OFFICE_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.CDMO,
  UserRole.OPERATIONAL,
  UserRole.ACCOUNTING,
  UserRole.HR_ADMIN,
];

const PAGE_RULES: RouteRule[] = [
  { pattern: /^\/dashboard(?:\/|$)/, allow: ALL_OFFICE_ROLES },

  { pattern: /^\/accounting(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },
  { pattern: /^\/agency-fees(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },

  { pattern: /^\/admin\/users(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/admin\/audit-logs(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/compliance(?:\/|$)/, allow: ALL_OFFICE_ROLES },

  { pattern: /^\/hr\/recruitment(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN] },

  { pattern: /^\/crewing\/applications\/new(?:\/|$)/, allow: [UserRole.CDMO] },
  { pattern: /^\/crewing\/seafarers\/new(?:\/|$)/, allow: [UserRole.CDMO] },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/?$/, allow: [UserRole.CDMO] },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/biodata(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/documents(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/medical(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/trainings(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/crewing\/documents\/new(?:\/|$)/, allow: [UserRole.CDMO] },
  { pattern: /^\/crewing\/documents\/[^/]+\/edit(?:\/|$)/, allow: [UserRole.CDMO] },
  { pattern: /^\/crewing\/documents\/[^/]+\/view(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/documents(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/applications(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/workflow(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/crewing\/seafarers(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/crewing\/document-receipts(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/crewing\/form-reference(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/crewing\/reports(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },

  { pattern: /^\/crewing\/prepare-joining(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/readiness(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/readiness-board(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/crew-list(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },

  { pattern: /^\/crewing\/?$/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL] },
  { pattern: /^\/contracts(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO] },
];

const API_RULES: ApiRule[] = [
  { pattern: /^\/api\/dashboard\/stats(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/accounting(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.ACCOUNTING], write: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },
  { pattern: /^\/api\/agency-fees(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.ACCOUNTING], write: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },

  { pattern: /^\/api\/admin\/users(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.HR_ADMIN], write: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/api\/admin\/audit-logs(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.HR_ADMIN], write: [] },
  { pattern: /^\/api\/compliance(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN] },

  { pattern: /^\/api\/recruitments(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN], write: [UserRole.CDMO, UserRole.HR_ADMIN] },

  { pattern: /^\/api\/applications(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [UserRole.CDMO] },
  { pattern: /^\/api\/interviews(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/seafarers\/search(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [] },
  { pattern: /^\/api\/seafarers\/[^/]+\/biodata(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [UserRole.CDMO] },
  { pattern: /^\/api\/seafarers\/[^/]+\/documents(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/seafarers(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/document-receipts(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/documents(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/workflow\/stats(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [] },
  { pattern: /^\/api\/crewing\/data-quality(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/overview(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [] },
  { pattern: /^\/api\/crewing\/reports\/summary(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [] },
  { pattern: /^\/api\/crewing\/seafarers\/[^/]+\/cv(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [] },
  { pattern: /^\/api\/crewing\/seafarers(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/form-reference(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/procedures(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/checklists(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },

  { pattern: /^\/api\/prepare-joining(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.OPERATIONAL] },
  { pattern: /^\/api\/forms\/letter-guarantee(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.OPERATIONAL] },

  { pattern: /^\/api\/contracts(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
];

const OFFICE_SECTION_PREFIXES = [
  "/dashboard",
  "/crewing",
  "/accounting",
  "/agency-fees",
  "/admin",
  "/contracts",
  "/quality",
  "/audit",
  "/nonconformity",
  "/hgqs",
  "/documents",
  "/hr",
  "/disciplinary",
  "/compliance",
  "/insurance",
  "/api/dashboard",
  "/api/accounting",
  "/api/agency-fees",
  "/api/admin",
  "/api/applications",
  "/api/interviews",
  "/api/seafarers",
  "/api/documents",
  "/api/prepare-joining",
  "/api/contracts",
  "/api/crewing",
  "/api/forms/letter-guarantee",
  "/api/insurance",
  "/api/compliance",
  "/api/audit",
  "/api/audits",
  "/api/nonconformity",
];

function normalizeRoles(roles: string[] | null | undefined): OfficeRole[] {
  if (!roles) return [];

  return roles
    .map((role) => role.toUpperCase())
    .filter((role): role is OfficeRole =>
      [
        UserRole.DIRECTOR,
        UserRole.CDMO,
        UserRole.OPERATIONAL,
        UserRole.ACCOUNTING,
        UserRole.HR_ADMIN,
      ].includes(role as OfficeRole)
    );
}

export function getPrimaryOfficeRole(
  roles: string[] | null | undefined,
  explicitRole?: string | null
): OfficeRole[] {
  const normalizedRoles = normalizeRoles(roles);
  if (normalizedRoles.length > 0) {
    return normalizedRoles;
  }

  return normalizeRoles(explicitRole ? [explicitRole] : []);
}

function matchesRule<T extends { pattern: RegExp }>(pathname: string, rules: T[]): T | null {
  for (const rule of rules) {
    if (rule.pattern.test(pathname)) {
      return rule;
    }
  }

  return null;
}

export function isOfficeProtectedPath(pathname: string): boolean {
  return OFFICE_SECTION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function canAccessOfficePath(
  pathname: string,
  roles: string[] | null | undefined,
  systemAdmin = false,
  method?: string
): boolean {
  if (systemAdmin) {
    return true;
  }

  const normalizedRoles = normalizeRoles(roles);
  if (normalizedRoles.length === 0) {
    return false;
  }

  if (pathname.startsWith("/api/")) {
    const rule = matchesRule(pathname, API_RULES);
    if (!rule) {
      return !isOfficeProtectedPath(pathname);
    }

    const normalizedMethod = (method ?? "GET").toUpperCase();
    const allowedRoles =
      normalizedMethod === "GET" || normalizedMethod === "HEAD" || normalizedMethod === "OPTIONS"
        ? rule.read
        : rule.write ?? [];

    return normalizedRoles.some((role) => allowedRoles.includes(role));
  }

  const rule = matchesRule(pathname, PAGE_RULES);

  if (!rule) {
    return !isOfficeProtectedPath(pathname);
  }

  return normalizedRoles.some((role) => rule.allow.includes(role));
}
