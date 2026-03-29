import { APP_ROLES, type AppRole } from "@/lib/roles";

export const HGI_BUSINESS_ROLES = [
  "DIRECTOR",
  "DOCUMENT",
  "OPERATIONAL",
  "ACCOUNTING",
  "DRIVER",
  "PRINCIPAL",
] as const;

export type HgiBusinessRole = (typeof HGI_BUSINESS_ROLES)[number];

export const HGI_BUSINESS_ROLE_APP_ROLE_MAP: Record<HgiBusinessRole, readonly AppRole[]> = {
  DIRECTOR: [APP_ROLES.DIRECTOR],
  DOCUMENT: [APP_ROLES.CDMO],
  OPERATIONAL: [APP_ROLES.OPERATIONAL],
  ACCOUNTING: [APP_ROLES.ACCOUNTING],
  DRIVER: [APP_ROLES.GA_DRIVER],
  PRINCIPAL: [],
};

export const HGI_RBAC_MATRIX: Record<
  HgiBusinessRole,
  {
    summary: string;
    primaryPages: readonly string[];
    primaryModules: readonly string[];
  }
> = {
  DIRECTOR: {
    summary: "Final internal approval, owner escalation oversight, and cross-department visibility.",
    primaryPages: ["/crewing", "/crewing/prepare-joining", "/contracts", "/accounting"],
    primaryModules: ["crewing", "contracts", "accounting", "compliance", "quality"],
  },
  DOCUMENT: {
    summary: "Certificate review, upload control, CV readiness, and submission to director.",
    primaryPages: ["/crewing", "/crewing/seafarers", "/crewing/documents"],
    primaryModules: ["crewing", "crew", "documents"],
  },
  OPERATIONAL: {
    summary: "Post-owner-approval mobilization, prepare joining, and dispatch coordination.",
    primaryPages: ["/crewing/readiness", "/crewing/prepare-joining", "/crewing/assignments", "/contracts"],
    primaryModules: ["crewing", "assignments", "contracts"],
  },
  ACCOUNTING: {
    summary: "Finance-only billing, fee, payroll, and payment follow-up visibility.",
    primaryPages: ["/accounting", "/accounting/billing", "/agency-fees"],
    primaryModules: ["accounting", "contracts"],
  },
  DRIVER: {
    summary: "Transport assignment and crew movement support only.",
    primaryPages: ["/crewing/assignments", "/crewing/crew-list"],
    primaryModules: ["assignments"],
  },
  PRINCIPAL: {
    summary: "Owner-side review limited to principal-scoped submissions only.",
    primaryPages: [],
    primaryModules: [],
  },
};

export const OFFICE_SIDEBAR_BY_APP_ROLE: Record<AppRole, readonly string[]> = {
  [APP_ROLES.DIRECTOR]: [
    "/crewing",
    "/crewing/readiness",
    "/crewing/prepare-joining",
    "/crewing/assignments",
    "/crewing/crew-list",
    "/crewing/seafarers",
    "/crewing/documents",
    "/crewing/principals",
    "/contracts",
    "/accounting",
    "/compliance",
    "/quality/qms-dashboard",
    "/audit",
    "/nonconformity",
    "/admin/users",
    "/admin/system-health",
    "/admin/audit-logs",
  ],
  [APP_ROLES.CDMO]: [
    "/crewing",
    "/crewing/seafarers",
    "/crewing/documents",
    "/compliance",
    "/quality/qms-dashboard",
    "/audit",
    "/nonconformity",
  ],
  [APP_ROLES.OPERATIONAL]: [
    "/crewing",
    "/crewing/readiness",
    "/crewing/prepare-joining",
    "/crewing/assignments",
    "/crewing/crew-list",
    "/crewing/seafarers",
    "/crewing/principals",
    "/contracts",
  ],
  [APP_ROLES.ACCOUNTING]: [
    "/contracts",
    "/accounting",
  ],
  [APP_ROLES.GA_DRIVER]: [
    "/crewing",
    "/crewing/assignments",
    "/crewing/crew-list",
  ],
  [APP_ROLES.HR]: [
    "/crewing",
    "/crewing/readiness",
    "/crewing/seafarers",
    "/hr",
  ],
  [APP_ROLES.HR_ADMIN]: [
    "/crewing",
    "/crewing/readiness",
    "/crewing/seafarers",
    "/crewing/documents",
    "/hr",
    "/compliance",
    "/quality/qms-dashboard",
    "/audit",
    "/nonconformity",
    "/admin/users",
    "/admin/system-health",
    "/admin/audit-logs",
  ],
  [APP_ROLES.QMR]: [
    "/compliance",
    "/quality/qms-dashboard",
    "/audit",
    "/nonconformity",
  ],
  [APP_ROLES.SECTION_HEAD]: [],
  [APP_ROLES.STAFF]: [],
  [APP_ROLES.PRINCIPAL]: [],
  [APP_ROLES.CREW]: [],
  [APP_ROLES.CREW_PORTAL]: [],
};

export function getSidebarAllowedRolesForHref(href: string): AppRole[] | undefined {
  const allowedRoles = (Object.entries(OFFICE_SIDEBAR_BY_APP_ROLE) as Array<[AppRole, readonly string[]]>)
    .filter(([, hrefs]) => hrefs.includes(href))
    .map(([role]) => role);

  return allowedRoles.length > 0 ? allowedRoles : undefined;
}
