/**
 * HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS) v2
 * PERMISSION & ACCESS CONTROL MATRIX
 * Version 2.0 - November 2025
 *
 * Updated according to MASTER SPEC v2 with final roles and sensitivity matrix
 */

// ==========================================
// USER ROLES DEFINITION (FINAL)
// ==========================================

export enum UserRole {
  DIRECTOR = 'DIRECTOR',        // Top management - full access
  CDMO = 'CDMO',                // Crew Documentation & Mobilization Officer
  OPERATIONAL = 'OPERATIONAL',  // Operational staff - limited access
  ACCOUNTING = 'ACCOUNTING',    // Accounting department
  HR = 'HR',                    // HR department
  HR_ADMIN = 'HR_ADMIN',        // HR administrator
  QMR = 'QMR',                  // Quality management representative
  SECTION_HEAD = 'SECTION_HEAD',// Department section head
  STAFF = 'STAFF',              // General staff
  CREW_PORTAL = 'CREW_PORTAL'   // Crew self-service
}

export enum PermissionLevel {
  NO_ACCESS = 'NO_ACCESS',
  VIEW_ACCESS = 'VIEW_ACCESS',
  EDIT_ACCESS = 'EDIT_ACCESS',
  FULL_ACCESS = 'FULL_ACCESS'
}

export enum ModuleName {
  // Core modules
  dashboard = 'dashboard',
  crew = 'crew',
  principals = 'principals',
  contracts = 'contracts',
  applications = 'applications',
  assignments = 'assignments',
  vessels = 'vessels',
  documents = 'documents',
  medical = 'medical',
  visas = 'visas',
  agencyFees = 'agencyFees',
  accounting = 'accounting',
  wageScales = 'wageScales',
  agencyAgreements = 'agencyAgreements',

  // Compliance modules
  disciplinary = 'disciplinary',
  quality = 'quality',
  nationalHolidays = 'nationalHolidays',
  compliance = 'compliance',

  // Operational modules
  crewing = 'crewing',
  insurance = 'insurance',
  dispatches = 'dispatches',
  pkl = 'pkl'
}

export enum DataSensitivity {
  RED = 'RED',      // Highly Sensitive (medical, full SEA, salary breakdown)
  AMBER = 'AMBER',  // Sensitive (personal data, disciplinary cases)
  GREEN = 'GREEN'   // Internal/Normal (public vessel info, procedures)
}

export interface RolePermissionOverride {
  role: string;
  moduleKey: string;
  level: PermissionLevel | `${PermissionLevel}`;
}

const PERMISSION_ORDER: PermissionLevel[] = [
  PermissionLevel.NO_ACCESS,
  PermissionLevel.VIEW_ACCESS,
  PermissionLevel.EDIT_ACCESS,
  PermissionLevel.FULL_ACCESS
];

function normalizeModuleKey(moduleKey: string): ModuleName | null {
  const normalized = moduleKey as ModuleName;
  if ((Object.values(ModuleName) as string[]).includes(normalized)) {
    return normalized;
  }

  const lowerKey = moduleKey.toLowerCase();
  const matched = (Object.values(ModuleName) as string[]).find(
    (value) => value.toLowerCase() === lowerKey
  );

  return (matched as ModuleName | undefined) ?? null;
}

function normalizePermissionLevel(value: unknown): PermissionLevel | null {
  if (typeof value !== 'string') {
    return null;
  }

  const upper = value.toUpperCase() as PermissionLevel;
  return PERMISSION_ORDER.includes(upper) ? upper : null;
}

function comparePermissionLevels(a: PermissionLevel, b: PermissionLevel): number {
  return PERMISSION_ORDER.indexOf(a) - PERMISSION_ORDER.indexOf(b);
}

function resolveRolePermission(
  role: UserRole,
  module: string,
  overrides?: RolePermissionOverride[] | null
): PermissionLevel {
  const normalizedModule = normalizeModuleKey(module) ?? (module as ModuleName);
  const fallbackLevel =
    PERMISSION_MATRIX[role]?.[normalizedModule as ModuleName] ?? PermissionLevel.NO_ACCESS;

  if (!overrides || overrides.length === 0) {
    return fallbackLevel;
  }

  const lowerModuleKey = module.toLowerCase();
  const overrideEntry = overrides.find(
    (entry) =>
      entry.role.toUpperCase() === role && entry.moduleKey.toLowerCase() === lowerModuleKey
  );

  const overrideLevel = normalizePermissionLevel(overrideEntry?.level);
  return overrideLevel ?? fallbackLevel;
}

/**
 * Gets the effective permission level for a user across multiple roles.
 * 
 * When a user has multiple roles, this function determines the highest
 * permission level they have for a given module. This ensures users can
 * access all functionality they're entitled to through any of their roles.
 * 
 * @param userRoles - Single role or array of roles for the user
 * @param module - The module name to check
 * @param overrides - Optional database-stored permission overrides
 * @returns The highest permission level the user has for the module
 * 
 * @example
 * ```typescript
 * // User with HR and ACCOUNTING roles
 * getEffectivePermissionLevel([UserRole.HR, UserRole.ACCOUNTING], 'contracts', null)
 * // Returns FULL_ACCESS (from ACCOUNTING) even though HR only has VIEW_ACCESS
 * ```
 */

export function getEffectivePermissionLevel(
  userRoles: UserRole | UserRole[],
  module: string,
  overrides?: RolePermissionOverride[] | null
): PermissionLevel {
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

  let highest = PermissionLevel.NO_ACCESS;

  for (const role of roles) {
    const candidate = resolveRolePermission(role, module, overrides);
    if (comparePermissionLevels(candidate, highest) > 0) {
      highest = candidate;
    }
  }

  return highest;
}

// ==========================================
// PERMISSION MATRIX (FINAL)
// ==========================================

export const PERMISSION_MATRIX: Record<UserRole, Record<ModuleName, PermissionLevel>> = {
  [UserRole.DIRECTOR]: {
    // Full access to everything
    dashboard: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.FULL_ACCESS,
    principals: PermissionLevel.FULL_ACCESS,
    contracts: PermissionLevel.FULL_ACCESS,
    applications: PermissionLevel.FULL_ACCESS,
    assignments: PermissionLevel.FULL_ACCESS,
    vessels: PermissionLevel.FULL_ACCESS,
    documents: PermissionLevel.FULL_ACCESS,
    medical: PermissionLevel.FULL_ACCESS,
    visas: PermissionLevel.FULL_ACCESS,
    agencyFees: PermissionLevel.FULL_ACCESS,
    accounting: PermissionLevel.FULL_ACCESS,
    wageScales: PermissionLevel.FULL_ACCESS,
    agencyAgreements: PermissionLevel.FULL_ACCESS,
    disciplinary: PermissionLevel.FULL_ACCESS,
    quality: PermissionLevel.FULL_ACCESS,
    nationalHolidays: PermissionLevel.FULL_ACCESS,
    compliance: PermissionLevel.FULL_ACCESS,
    crewing: PermissionLevel.FULL_ACCESS,
    insurance: PermissionLevel.FULL_ACCESS,
    dispatches: PermissionLevel.FULL_ACCESS,
    pkl: PermissionLevel.FULL_ACCESS
  },

  [UserRole.CDMO]: {
    // Full crew management, documents, contracts, agency agreements
    dashboard: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.FULL_ACCESS,
    principals: PermissionLevel.FULL_ACCESS,
    contracts: PermissionLevel.FULL_ACCESS,
    applications: PermissionLevel.FULL_ACCESS,
    assignments: PermissionLevel.FULL_ACCESS,
    vessels: PermissionLevel.VIEW_ACCESS,
    documents: PermissionLevel.FULL_ACCESS,
    medical: PermissionLevel.EDIT_ACCESS,
    visas: PermissionLevel.FULL_ACCESS,
    agencyFees: PermissionLevel.FULL_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.VIEW_ACCESS,
    agencyAgreements: PermissionLevel.FULL_ACCESS,
    disciplinary: PermissionLevel.EDIT_ACCESS,
    quality: PermissionLevel.VIEW_ACCESS,
    nationalHolidays: PermissionLevel.VIEW_ACCESS,
    compliance: PermissionLevel.FULL_ACCESS,
    crewing: PermissionLevel.FULL_ACCESS,
    insurance: PermissionLevel.EDIT_ACCESS,
    dispatches: PermissionLevel.FULL_ACCESS,
    pkl: PermissionLevel.FULL_ACCESS
  },

  [UserRole.QMR]: {
    dashboard: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.VIEW_ACCESS,
    principals: PermissionLevel.VIEW_ACCESS,
    contracts: PermissionLevel.VIEW_ACCESS,
    applications: PermissionLevel.VIEW_ACCESS,
    assignments: PermissionLevel.VIEW_ACCESS,
    vessels: PermissionLevel.VIEW_ACCESS,
    documents: PermissionLevel.EDIT_ACCESS,
    medical: PermissionLevel.VIEW_ACCESS,
    visas: PermissionLevel.VIEW_ACCESS,
    agencyFees: PermissionLevel.NO_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.VIEW_ACCESS,
    agencyAgreements: PermissionLevel.VIEW_ACCESS,
    disciplinary: PermissionLevel.EDIT_ACCESS,
    quality: PermissionLevel.FULL_ACCESS,
    nationalHolidays: PermissionLevel.VIEW_ACCESS,
    compliance: PermissionLevel.FULL_ACCESS,
    crewing: PermissionLevel.VIEW_ACCESS,
    insurance: PermissionLevel.VIEW_ACCESS,
    dispatches: PermissionLevel.VIEW_ACCESS,
    pkl: PermissionLevel.VIEW_ACCESS
  },

  [UserRole.HR_ADMIN]: {
    dashboard: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.FULL_ACCESS,
    principals: PermissionLevel.VIEW_ACCESS,
    contracts: PermissionLevel.EDIT_ACCESS,
    applications: PermissionLevel.FULL_ACCESS,
    assignments: PermissionLevel.FULL_ACCESS,
    vessels: PermissionLevel.VIEW_ACCESS,
    documents: PermissionLevel.FULL_ACCESS,
    medical: PermissionLevel.FULL_ACCESS,
    visas: PermissionLevel.EDIT_ACCESS,
    agencyFees: PermissionLevel.NO_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.VIEW_ACCESS,
    agencyAgreements: PermissionLevel.VIEW_ACCESS,
    disciplinary: PermissionLevel.FULL_ACCESS,
    quality: PermissionLevel.EDIT_ACCESS,
    nationalHolidays: PermissionLevel.FULL_ACCESS,
    compliance: PermissionLevel.EDIT_ACCESS,
    crewing: PermissionLevel.FULL_ACCESS,
    insurance: PermissionLevel.EDIT_ACCESS,
    dispatches: PermissionLevel.VIEW_ACCESS,
    pkl: PermissionLevel.FULL_ACCESS
  },

  [UserRole.OPERATIONAL]: {
    // Fleet operations, dispatches, basic crew info
    dashboard: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.VIEW_ACCESS,
    principals: PermissionLevel.VIEW_ACCESS,
    contracts: PermissionLevel.VIEW_ACCESS,
    applications: PermissionLevel.VIEW_ACCESS,
    assignments: PermissionLevel.VIEW_ACCESS,
    vessels: PermissionLevel.FULL_ACCESS,
    documents: PermissionLevel.EDIT_ACCESS,
    medical: PermissionLevel.NO_ACCESS,
    visas: PermissionLevel.EDIT_ACCESS,
    agencyFees: PermissionLevel.NO_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.NO_ACCESS,
    agencyAgreements: PermissionLevel.VIEW_ACCESS,
    disciplinary: PermissionLevel.VIEW_ACCESS,
    quality: PermissionLevel.EDIT_ACCESS,
    nationalHolidays: PermissionLevel.VIEW_ACCESS,
    compliance: PermissionLevel.VIEW_ACCESS,
    crewing: PermissionLevel.EDIT_ACCESS,
    insurance: PermissionLevel.VIEW_ACCESS,
    dispatches: PermissionLevel.FULL_ACCESS,
    pkl: PermissionLevel.EDIT_ACCESS
  },

  [UserRole.ACCOUNTING]: {
    // Financial modules, wage scales, agency fees - enhanced contract access
    dashboard: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.VIEW_ACCESS,
    principals: PermissionLevel.VIEW_ACCESS,
    contracts: PermissionLevel.FULL_ACCESS,
    applications: PermissionLevel.NO_ACCESS,
    assignments: PermissionLevel.NO_ACCESS,
    vessels: PermissionLevel.VIEW_ACCESS,
    documents: PermissionLevel.VIEW_ACCESS,
    medical: PermissionLevel.NO_ACCESS,
    visas: PermissionLevel.NO_ACCESS,
    agencyFees: PermissionLevel.FULL_ACCESS,
    accounting: PermissionLevel.FULL_ACCESS,
    wageScales: PermissionLevel.FULL_ACCESS,
    agencyAgreements: PermissionLevel.EDIT_ACCESS,
    disciplinary: PermissionLevel.NO_ACCESS,
    quality: PermissionLevel.NO_ACCESS,
    nationalHolidays: PermissionLevel.VIEW_ACCESS,
    compliance: PermissionLevel.NO_ACCESS,
    crewing: PermissionLevel.VIEW_ACCESS,
    insurance: PermissionLevel.VIEW_ACCESS,
    dispatches: PermissionLevel.VIEW_ACCESS,
    pkl: PermissionLevel.VIEW_ACCESS
  },

  [UserRole.SECTION_HEAD]: {
    dashboard: PermissionLevel.VIEW_ACCESS,
    crew: PermissionLevel.VIEW_ACCESS,
    principals: PermissionLevel.NO_ACCESS,
    contracts: PermissionLevel.NO_ACCESS,
    applications: PermissionLevel.NO_ACCESS,
    assignments: PermissionLevel.VIEW_ACCESS,
    vessels: PermissionLevel.VIEW_ACCESS,
    documents: PermissionLevel.VIEW_ACCESS,
    medical: PermissionLevel.NO_ACCESS,
    visas: PermissionLevel.NO_ACCESS,
    agencyFees: PermissionLevel.NO_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.NO_ACCESS,
    agencyAgreements: PermissionLevel.NO_ACCESS,
    disciplinary: PermissionLevel.VIEW_ACCESS,
    quality: PermissionLevel.EDIT_ACCESS,
    nationalHolidays: PermissionLevel.VIEW_ACCESS,
    compliance: PermissionLevel.EDIT_ACCESS,
    crewing: PermissionLevel.VIEW_ACCESS,
    insurance: PermissionLevel.NO_ACCESS,
    dispatches: PermissionLevel.VIEW_ACCESS,
    pkl: PermissionLevel.VIEW_ACCESS
  },

  [UserRole.STAFF]: {
    dashboard: PermissionLevel.VIEW_ACCESS,
    crew: PermissionLevel.VIEW_ACCESS,
    principals: PermissionLevel.NO_ACCESS,
    contracts: PermissionLevel.NO_ACCESS,
    applications: PermissionLevel.NO_ACCESS,
    assignments: PermissionLevel.NO_ACCESS,
    vessels: PermissionLevel.NO_ACCESS,
    documents: PermissionLevel.VIEW_ACCESS,
    medical: PermissionLevel.NO_ACCESS,
    visas: PermissionLevel.NO_ACCESS,
    agencyFees: PermissionLevel.NO_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.NO_ACCESS,
    agencyAgreements: PermissionLevel.NO_ACCESS,
    disciplinary: PermissionLevel.NO_ACCESS,
    quality: PermissionLevel.VIEW_ACCESS,
    nationalHolidays: PermissionLevel.VIEW_ACCESS,
    compliance: PermissionLevel.VIEW_ACCESS,
    crewing: PermissionLevel.NO_ACCESS,
    insurance: PermissionLevel.NO_ACCESS,
    dispatches: PermissionLevel.NO_ACCESS,
    pkl: PermissionLevel.NO_ACCESS
  },

  [UserRole.HR]: {
    // HR functions, disciplinary, quality, training
    dashboard: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.EDIT_ACCESS,
    principals: PermissionLevel.VIEW_ACCESS,
    contracts: PermissionLevel.VIEW_ACCESS,
    applications: PermissionLevel.EDIT_ACCESS,
    assignments: PermissionLevel.EDIT_ACCESS,
    vessels: PermissionLevel.VIEW_ACCESS,
    documents: PermissionLevel.EDIT_ACCESS,
    medical: PermissionLevel.FULL_ACCESS,
    visas: PermissionLevel.EDIT_ACCESS,
    agencyFees: PermissionLevel.NO_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.VIEW_ACCESS,
    agencyAgreements: PermissionLevel.VIEW_ACCESS,
    disciplinary: PermissionLevel.FULL_ACCESS,
    quality: PermissionLevel.FULL_ACCESS,
    nationalHolidays: PermissionLevel.FULL_ACCESS,
    compliance: PermissionLevel.EDIT_ACCESS,
    crewing: PermissionLevel.EDIT_ACCESS,
    insurance: PermissionLevel.EDIT_ACCESS,
    dispatches: PermissionLevel.VIEW_ACCESS,
    pkl: PermissionLevel.EDIT_ACCESS
  },

  [UserRole.CREW_PORTAL]: {
    // Limited self-service access
    dashboard: PermissionLevel.VIEW_ACCESS,
    crew: PermissionLevel.VIEW_ACCESS,
    principals: PermissionLevel.NO_ACCESS,
    contracts: PermissionLevel.NO_ACCESS,
    applications: PermissionLevel.NO_ACCESS,
    assignments: PermissionLevel.NO_ACCESS,
    vessels: PermissionLevel.VIEW_ACCESS,
    documents: PermissionLevel.VIEW_ACCESS,
    medical: PermissionLevel.VIEW_ACCESS,
    visas: PermissionLevel.VIEW_ACCESS,
    agencyFees: PermissionLevel.NO_ACCESS,
    accounting: PermissionLevel.NO_ACCESS,
    wageScales: PermissionLevel.NO_ACCESS,
    agencyAgreements: PermissionLevel.NO_ACCESS,
    disciplinary: PermissionLevel.NO_ACCESS,
    quality: PermissionLevel.NO_ACCESS,
    nationalHolidays: PermissionLevel.VIEW_ACCESS,
    compliance: PermissionLevel.VIEW_ACCESS,
    crewing: PermissionLevel.VIEW_ACCESS,
    insurance: PermissionLevel.VIEW_ACCESS,
    dispatches: PermissionLevel.NO_ACCESS,
    pkl: PermissionLevel.VIEW_ACCESS
  }
};

// ==========================================
// SENSITIVITY ACCESS MATRIX
// ==========================================

export const SENSITIVITY_ACCESS_MATRIX: Record<UserRole, Record<DataSensitivity, boolean>> = {
  [UserRole.DIRECTOR]: {
    [DataSensitivity.RED]: true,    // Can access all RED data
    [DataSensitivity.AMBER]: true,  // Can access all AMBER data
    [DataSensitivity.GREEN]: true   // Can access GREEN data
  },

  [UserRole.CDMO]: {
    [DataSensitivity.RED]: true,    // Can access RED data for assigned crew
    [DataSensitivity.AMBER]: true,  // Can access AMBER data for assigned crew
    [DataSensitivity.GREEN]: true   // Can access GREEN data
  },

  [UserRole.OPERATIONAL]: {
    [DataSensitivity.RED]: false,   // No access to RED data
    [DataSensitivity.AMBER]: true,  // Can access AMBER data for operations
    [DataSensitivity.GREEN]: true   // Can access GREEN data
  },

  [UserRole.ACCOUNTING]: {
    [DataSensitivity.RED]: false,   // No access to RED data
    [DataSensitivity.AMBER]: true,  // Can access financial AMBER data
    [DataSensitivity.GREEN]: true   // Can access GREEN data
  },

  [UserRole.HR]: {
    [DataSensitivity.RED]: true,    // Can access medical RED data
    [DataSensitivity.AMBER]: true,  // Can access disciplinary AMBER data
    [DataSensitivity.GREEN]: true   // Can access GREEN data
  },

  [UserRole.CREW_PORTAL]: {
    [DataSensitivity.RED]: true,    // Can access own RED data only
    [DataSensitivity.AMBER]: true,  // Can access own AMBER data only
    [DataSensitivity.GREEN]: true   // Can access GREEN data
  },

  [UserRole.QMR]: {
    [DataSensitivity.RED]: true,
    [DataSensitivity.AMBER]: true,
    [DataSensitivity.GREEN]: true
  },

  [UserRole.HR_ADMIN]: {
    [DataSensitivity.RED]: true,
    [DataSensitivity.AMBER]: true,
    [DataSensitivity.GREEN]: true
  },

  [UserRole.SECTION_HEAD]: {
    [DataSensitivity.RED]: false,
    [DataSensitivity.AMBER]: true,
    [DataSensitivity.GREEN]: true
  },

  [UserRole.STAFF]: {
    [DataSensitivity.RED]: false,
    [DataSensitivity.AMBER]: false,
    [DataSensitivity.GREEN]: true
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Checks if a user (with given roles) has the required permission level for a module.
 * 
 * This is the main permission check function used throughout the application.
 * It supports both single roles and multiple roles, taking the highest permission
 * level when multiple roles are present.
 * 
 * @param userRoles - Single role or array of roles for the user
 * @param module - The module name to check permissions for (e.g., 'crew', 'contracts')
 * @param requiredLevel - The minimum permission level required (NO_ACCESS, VIEW_ACCESS, EDIT_ACCESS, FULL_ACCESS)
 * @param overrides - Optional role-specific permission overrides from database
 * @returns true if user has sufficient permission, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if DIRECTOR has VIEW access to crew module
 * hasPermission([UserRole.DIRECTOR], 'crew', PermissionLevel.VIEW_ACCESS) // true
 * 
 * // Check if CREW_PORTAL has FULL access to accounting
 * hasPermission([UserRole.CREW_PORTAL], 'accounting', PermissionLevel.FULL_ACCESS) // false
 * 
 * // Check with multiple roles (takes highest permission)
 * hasPermission([UserRole.HR, UserRole.ACCOUNTING], 'contracts', PermissionLevel.EDIT_ACCESS) // true
 * ```
 */
export function hasPermission(
  userRoles: UserRole | UserRole[],
  module: string,
  requiredLevel: PermissionLevel,
  overrides?: RolePermissionOverride[] | null
): boolean {
  const effectiveLevel = getEffectivePermissionLevel(userRoles, module, overrides);
  return comparePermissionLevels(effectiveLevel, requiredLevel) >= 0;
}

/**
 * Checks if a user has access to data with a specific sensitivity level.
 * 
 * Data sensitivity levels (RED, AMBER, GREEN) control access to sensitive information
 * like medical records, salaries, and personal data.
 * 
 * @param userRoles - Single role or array of roles for the user
 * @param sensitivity - The data sensitivity level (RED, AMBER, or GREEN)
 * @returns true if user can access data at this sensitivity level
 * 
 * @example
 * ```typescript
 * // Check if HR can access RED (medical) data
 * hasSensitivityAccess([UserRole.HR], DataSensitivity.RED) // true
 * 
 * // Check if OPERATIONAL can access RED data
 * hasSensitivityAccess([UserRole.OPERATIONAL], DataSensitivity.RED) // false
 * ```
 */

export function hasSensitivityAccess(
  userRoles: UserRole | UserRole[],
  sensitivity: DataSensitivity
): boolean {
  // Convert single role to array for consistent handling
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

  // Check if any of the user's roles has access to the sensitivity level
  return roles.some(role => {
    return SENSITIVITY_ACCESS_MATRIX[role]?.[sensitivity] ?? false;
  });
}

export function canAccessData(
  userRole: UserRole,
  module: ModuleName,
  sensitivity: DataSensitivity,
  requiredLevel: PermissionLevel = PermissionLevel.VIEW_ACCESS,
  overrides?: RolePermissionOverride[] | null
): boolean {
  // Check module permission
  if (!hasPermission(userRole, module, requiredLevel, overrides)) {
    return false;
  }

  // Check sensitivity access
  if (!hasSensitivityAccess(userRole, sensitivity)) {
    return false;
  }

  return true;
}

// ==========================================
// BUSINESS RULES VALIDATION
// ==========================================

export function validateCrewPortalAccess(
  userRole: UserRole,
  requestedUserId?: string,
  sessionUserId?: string
): boolean {
  // Crew portal users can only access their own data
  if (userRole === UserRole.CREW_PORTAL) {
    return requestedUserId === sessionUserId;
  }

  // Other roles have broader access based on permissions
  return true;
}

export function getAccessibleModules(
  userRole: UserRole,
  overrides?: RolePermissionOverride[] | null
): ModuleName[] {
  const modules: ModuleName[] = [];
  const permissions = PERMISSION_MATRIX[userRole];

  for (const moduleKey of Object.keys(permissions) as ModuleName[]) {
    const effective = getEffectivePermissionLevel(userRole, moduleKey, overrides);
    if (effective !== PermissionLevel.NO_ACCESS) {
      modules.push(moduleKey);
    }
  }

  return modules;
}

export function getModulePermission(
  userRole: UserRole,
  module: ModuleName,
  overrides?: RolePermissionOverride[] | null
): PermissionLevel {
  return getEffectivePermissionLevel(userRole, module, overrides);
}
