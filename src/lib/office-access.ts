import { UserRole } from "@/lib/permissions";
import { hasExplicitRoleAccess } from "@/lib/authorization";
import { normalizeRoleTokens } from "@/lib/role-normalization";

export type OfficeRole =
  | UserRole.DIRECTOR
  | UserRole.PRINCIPAL
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

const ACCOUNTING_DOMAIN_ROLES: OfficeRole[] = [UserRole.DIRECTOR, UserRole.ACCOUNTING];
const HR_DOMAIN_ROLES: OfficeRole[] = [UserRole.DIRECTOR, UserRole.HR, UserRole.HR_ADMIN];
const QUALITY_DOMAIN_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.CDMO,
  UserRole.HR_ADMIN,
  UserRole.QMR,
];
const CREWING_CORE_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.CDMO,
  UserRole.OPERATIONAL,
  UserRole.HR,
  UserRole.HR_ADMIN,
];
const HGI_APPLICATION_FLOW_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.CDMO,
  UserRole.OPERATIONAL,
];
const HGI_REVIEW_FLOW_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.CDMO,
];
const CREWING_TRANSPORT_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.OPERATIONAL,
  UserRole.GA_DRIVER,
];
const CONTRACT_DOMAIN_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.OPERATIONAL,
  UserRole.ACCOUNTING,
];
const PRINCIPAL_DOMAIN_ROLES: OfficeRole[] = [
  UserRole.DIRECTOR,
  UserRole.CDMO,
  UserRole.OPERATIONAL,
];

const PAGE_RULES: RouteRule[] = [
  { pattern: /^\/dashboard(?:\/|$)/, allow: ALL_OFFICE_ROLES },
  { pattern: /^\/principal(?:\/|$)/, allow: [UserRole.PRINCIPAL] },

  { pattern: /^\/accounting(?:\/|$)/, allow: ACCOUNTING_DOMAIN_ROLES },
  { pattern: /^\/agency-fees(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },

  { pattern: /^\/admin\/users(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/admin\/audit-logs(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/admin\/system-health(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/compliance(?:\/|$)/, allow: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/quality(?:\/|$)/, allow: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/audit(?:\/|$)/, allow: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/nonconformity(?:\/|$)/, allow: QUALITY_DOMAIN_ROLES },

  { pattern: /^\/hr(?:\/|$)/, allow: HR_DOMAIN_ROLES },

  { pattern: /^\/crewing\/applications\/new(?:\/|$)/, allow: [UserRole.CDMO] },
  { pattern: /^\/crewing\/seafarers\/new(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/?$/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/biodata(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/documents(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/medical(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/seafarers\/[^/]+\/trainings(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/documents\/new(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/documents\/[^/]+\/edit(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/documents\/[^/]+\/view(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/documents(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/applications(?:\/|$)/, allow: HGI_REVIEW_FLOW_ROLES },
  { pattern: /^\/crewing\/workflow(?:\/|$)/, allow: HGI_APPLICATION_FLOW_ROLES },
  { pattern: /^\/crewing\/seafarers(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/document-receipts(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/form-reference(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/principals(?:\/|$)/, allow: PRINCIPAL_DOMAIN_ROLES },
  { pattern: /^\/crewing\/reports(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/checklist(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/forms(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/crew-tasks(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/sign-off(?:\/|$)/, allow: CONTRACT_DOMAIN_ROLES },

  { pattern: /^\/crewing\/prepare-joining(?:\/|$)/, allow: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/crewing\/readiness(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/readiness-board(?:\/|$)/, allow: CREWING_CORE_ROLES },
  { pattern: /^\/crewing\/crew-list(?:\/|$)/, allow: CREWING_TRANSPORT_ROLES },
  { pattern: /^\/crewing\/assignments(?:\/|$)/, allow: CREWING_TRANSPORT_ROLES },

  { pattern: /^\/crewing\/?$/, allow: [...CREWING_CORE_ROLES, UserRole.GA_DRIVER] },
  { pattern: /^\/contracts(?:\/|$)/, allow: CONTRACT_DOMAIN_ROLES },
];

const API_RULES: ApiRule[] = [
  { pattern: /^\/api\/dashboard\/stats(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [] },
  { pattern: /^\/api\/principal(?:\/|$)/, read: [UserRole.PRINCIPAL], write: [UserRole.PRINCIPAL] },
  { pattern: /^\/api\/accounting(?:\/|$)/, read: ACCOUNTING_DOMAIN_ROLES, write: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },
  { pattern: /^\/api\/agency-fees(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.ACCOUNTING], write: [UserRole.DIRECTOR, UserRole.ACCOUNTING] },

  { pattern: /^\/api\/admin\/users(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.HR_ADMIN], write: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/api\/admin\/audit-logs(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.HR_ADMIN], write: [] },
  { pattern: /^\/api\/admin\/system-health(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.HR_ADMIN], write: [UserRole.DIRECTOR, UserRole.HR_ADMIN] },
  { pattern: /^\/api\/compliance(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/external-compliance(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/quality(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/audit(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/audits(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/nonconformity(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },

  { pattern: /^\/api\/recruitments(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.HR, UserRole.HR_ADMIN], write: [UserRole.CDMO, UserRole.HR, UserRole.HR_ADMIN] },

  { pattern: /^\/api\/applications(?:\/|$)/, read: HGI_REVIEW_FLOW_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/interviews(?:\/|$)/, read: HGI_REVIEW_FLOW_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/principals(?:\/|$)/, read: [...PRINCIPAL_DOMAIN_ROLES, UserRole.GA_DRIVER], write: [UserRole.DIRECTOR, UserRole.CDMO] },
  { pattern: /^\/api\/seafarers\/search(?:\/|$)/, read: CREWING_CORE_ROLES, write: [] },
  { pattern: /^\/api\/seafarers\/[^/]+\/biodata(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/seafarers\/[^/]+\/documents(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/seafarers(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/document-receipts(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/documents(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/applications\/[^/]+\/cv-ready(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO], write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/workflow\/stats(?:\/|$)/, read: HGI_APPLICATION_FLOW_ROLES, write: [] },
  { pattern: /^\/api\/crewing\/data-quality(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/overview(?:\/|$)/, read: CREWING_CORE_ROLES, write: [] },
  { pattern: /^\/api\/crewing\/reports\/summary(?:\/|$)/, read: CREWING_CORE_ROLES, write: [] },
  { pattern: /^\/api\/checklist(?:\/|$)/, read: CREWING_CORE_ROLES, write: [] },
  { pattern: /^\/api\/crew-tasks(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/crewing\/sign-off(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL, UserRole.ACCOUNTING], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/crewing\/seafarers\/[^/]+\/cv(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.OPERATIONAL], write: [] },
  { pattern: /^\/api\/crewing\/seafarers(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/form-reference(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/procedures(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/crewing\/checklists(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.CDMO] },
  { pattern: /^\/api\/form-templates(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/form-submissions(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },

  { pattern: /^\/api\/prepare-joining(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.OPERATIONAL] },
  { pattern: /^\/api\/quality\/qmr\/stats(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: [] },
  { pattern: /^\/api\/quality\/qmr\/tasks(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/qms\/analytics(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: [] },
  { pattern: /^\/api\/qms\/audit-trail(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/qms\/documents(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/qms\/nonconformities(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/qms\/metrics(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/qms\/reports(?:\/|$)/, read: QUALITY_DOMAIN_ROLES, write: QUALITY_DOMAIN_ROLES },
  { pattern: /^\/api\/hgf\/forms(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/hgf\/submissions(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/hgf\/documents\/upload(?:\/|$)/, read: [UserRole.DIRECTOR, UserRole.OPERATIONAL], write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
  { pattern: /^\/api\/forms\/ac-01(?:\/|$)/, read: PRINCIPAL_DOMAIN_ROLES, write: [] },
  { pattern: /^\/api\/forms\/cr-02(?:\/|$)/, read: CREWING_CORE_ROLES, write: [UserRole.DIRECTOR, UserRole.CDMO, UserRole.ACCOUNTING] },
  { pattern: /^\/api\/forms\/letter-guarantee(?:\/|$)/, read: ALL_OFFICE_ROLES, write: [UserRole.OPERATIONAL] },
  { pattern: /^\/api\/assignments(?:\/|$)/, read: CREWING_TRANSPORT_ROLES, write: [UserRole.DIRECTOR, UserRole.GA_DRIVER] },
  { pattern: /^\/api\/contracts(?:\/|$)/, read: CONTRACT_DOMAIN_ROLES, write: [UserRole.DIRECTOR, UserRole.OPERATIONAL] },
];

const OFFICE_SECTION_PREFIXES = [
  "/dashboard",
  "/principal",
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
  "/api/principal",
  "/api/accounting",
  "/api/agency-fees",
  "/api/admin",
  "/api/applications",
  "/api/interviews",
  "/api/principals",
  "/api/seafarers",
  "/api/documents",
  "/api/prepare-joining",
  "/api/forms/ac-01",
  "/api/forms/cr-02",
  "/api/contracts",
  "/api/crewing",
  "/api/forms/letter-guarantee",
  "/api/insurance",
  "/api/compliance",
  "/api/audit",
  "/api/audits",
  "/api/nonconformity",
  "/api/qms",
  "/api/hgf",
  "/api/quality",
];

function normalizeRoles(roles: string[] | null | undefined): OfficeRole[] {
  if (!roles) return [];

  return normalizeRoleTokens(roles)
    .filter((role): role is OfficeRole =>
      [
        UserRole.DIRECTOR,
        UserRole.PRINCIPAL,
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
