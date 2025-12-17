export type AppRole =
  | "DIRECTOR"
  | "CDMO"
  | "OPERATIONAL"
  | "ACCOUNTING"
  | "HR"
  | "HR_ADMIN"
  | "QMR"
  | "SECTION_HEAD"
  | "STAFF"
  | "CREW"
  | "CREW_PORTAL";

export const APP_ROLES = {
  DIRECTOR: "DIRECTOR",
  CDMO: "CDMO",
  OPERATIONAL: "OPERATIONAL",
  ACCOUNTING: "ACCOUNTING",
  HR: "HR",
  HR_ADMIN: "HR_ADMIN",
  QMR: "QMR",
  SECTION_HEAD: "SECTION_HEAD",
  STAFF: "STAFF",
  CREW: "CREW",
  CREW_PORTAL: "CREW_PORTAL",
} as const;

export const OFFICE_ROLES = [
  APP_ROLES.DIRECTOR,
  APP_ROLES.CDMO,
  APP_ROLES.OPERATIONAL,
  APP_ROLES.ACCOUNTING,
  APP_ROLES.HR,
  APP_ROLES.HR_ADMIN,
  APP_ROLES.QMR,
  APP_ROLES.SECTION_HEAD,
  APP_ROLES.STAFF,
] as const satisfies readonly AppRole[];

export const CREW_ROLES = [APP_ROLES.CREW, APP_ROLES.CREW_PORTAL] as const satisfies readonly AppRole[];

export const ALL_APP_ROLES = [...OFFICE_ROLES, ...CREW_ROLES] as const satisfies readonly AppRole[];

export const CREW_ROLE_SET = new Set<AppRole>(CREW_ROLES);
export const OFFICE_ROLE_SET = new Set<AppRole>(OFFICE_ROLES);
