import { UserRole } from "@/lib/permissions";
import { hasExplicitRoleAccess } from "@/lib/authorization";

export type OfficeRole =
  | UserRole.DIRECTOR
  | UserRole.CDMO
  | UserRole.OPERATIONAL
  | UserRole.GA_DRIVER
  | UserRole.ACCOUNTING
  | UserRole.HR
  | UserRole.HR_ADMIN
  | UserRole.QMR;

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
  UserRole.GA_DRIVER,
  UserRole.ACCOUNTING,
  UserRole.HR,
  UserRole.HR_ADMIN,
  UserRole.QMR,
];

const PAGE_RULES: RouteRule[] = [
  { pattern: /^\/dashboard(?:\/|$)/, allow: ALL_OFFICE_ROLES },

  { pattern: /^\/accounting(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/agency-fees(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },

  { pattern: /^\/admin\/users(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/admin\/audit-logs(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/compliance(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL, UserRole.HR, UserRole.HR_ADMIN, UserRole.QMR] },
  { pattern: /^\/quality(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/audit(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/nonconformity(?:\/|$)/, allow: ALL_OFFICE_ROLES },

  { pattern: /^\/hr(?:\/|$)/, allow: ALL_OFFICE_ROLES },

  { pattern: /^\/crewing\/applications\/new(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/seafarers\/new(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/?$/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/biodata(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/documents(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/medical(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/trainings(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/documents\/new(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/documents\/[^/]+\/edit(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/documents\/[^/]+\/view(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/documents(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/applications(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/workflow(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/seafarers(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/document-receipts(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/form-reference(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/principals(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/reports(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/checklist(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/crew-tasks(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/sign-off(?:\/|$)/, allow: ALL_OFFICE_ROLES },

  { pattern: /^\/crewing\/prepare-joining(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/readiness(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/readiness-board(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/crew-list(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/crewing\/assignments(?:\/|$)/, allow: ALL_OFFICE_ROLES },

  { pattern: /^\/crewing\/?$/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/contracts(?:\/|$)/, allow: ALL_OFFICE_ROLES },
];

const API_RULES: ApiRule[] = [
  { pattern: /^\/api\/dashboard\/stats(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/accounting(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },
  { pattern: /^\/api\/agency-fees(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.ACCOUNTING], write: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },

  { pattern: /^\/api\/admin\/users(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.HR_ADMIN], write: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/api\/admin\/audit-logs(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.HR_ADMIN], write: [] },
  { pattern: /^\/api\/compliance(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL, UserRole.HR, UserRole.HR_ADMIN, UserRole.QMR], write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR, UserRole.HR_ADMIN, UserRole.QMR] },
  { pattern: /^\/api\/external-compliance(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL, UserRole.HR_ADMIN, UserRole.QMR], write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN, UserRole.QMR] },
  { pattern: /^\/api\/quality(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN, UserRole.QMR] },
  { pattern: /^\/api\/audit(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN, UserRole.QMR] },
  { pattern: /^\/api\/audits(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN, UserRole.QMR] },
  { pattern: /^\/api\/nonconformity(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR_ADMIN, UserRole.QMR] },

  { pattern: /^\/api\/recruitments(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR, UserRole.HR_ADMIN], write: [UserRole.CDMO, UserRole.HR, UserRole.HR_ADMIN] },

  { pattern: /^\/api\/applications(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/interviews(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/principals(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/api\/seafarers\/search(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/seafarers\/[^/]+\/biodata(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/seafarers\/[^/]+\/documents(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/seafarers(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/document-receipts(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/documents(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/workflow\/stats(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/crewing\/data-quality(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/overview(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/crewing\/reports\/summary(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/checklist(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/crew-tasks(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/crewing\/sign-off(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL, UserRole.ACCOUNTING], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/crewing\/seafarers\/[^/]+\/cv(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [] },
  { pattern: /^\/api\/crewing\/seafarers(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/form-reference(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/procedures(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/checklists(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },

  { pattern: /^\/api\/prepare-joining(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.OPERATIONAL] },
  { pattern: /^\/api\/forms\/letter-guarantee(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.OPERATIONAL] },
  { pattern: /^\/api\/assignments(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.GA_DRIVER] },
  { pattern: /^\/api\/contracts(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
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
  "/api/principals",
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
        UserRole.GA_DRIVER,
        UserRole.ACCOUNTING,
        UserRole.HR,
        UserRole.HR_ADMIN,
        UserRole.QMR,
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

    return hasExplicitRoleAccess(
      { roles: normalizedRoles, isSystemAdmin: systemAdmin },
      allowedRoles
    );
  }

  const rule = matchesRule(pathname, PAGE_RULES);

  if (!rule) {
    return !isOfficeProtectedPath(pathname);
  }

  return hasExplicitRoleAccess(
    { roles: normalizedRoles, isSystemAdmin: systemAdmin },
    rule.allow
  );
}
