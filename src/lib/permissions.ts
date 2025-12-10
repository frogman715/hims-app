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
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function hasPermission(
  userRoles: UserRole | UserRole[],
  module: string,
  requiredLevel: PermissionLevel
): boolean {
  // Convert single role to array for consistent handling
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

  // Check if any of the user's roles has the required permission
  return roles.some(role => {
    const userPermissions = PERMISSION_MATRIX[role];
    if (!userPermissions) return false;

    const userLevel = userPermissions[module as ModuleName];
    if (!userLevel) return false;

    // Permission hierarchy: NO_ACCESS < VIEW_ACCESS < EDIT_ACCESS < FULL_ACCESS
    const hierarchy = ['NO_ACCESS', 'VIEW_ACCESS', 'EDIT_ACCESS', 'FULL_ACCESS'];
    const userIndex = hierarchy.indexOf(userLevel);
    const requiredIndex = hierarchy.indexOf(requiredLevel);

    return userIndex >= requiredIndex;
  });
}

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
  requiredLevel: PermissionLevel = PermissionLevel.VIEW_ACCESS
): boolean {
  // Check module permission
  if (!hasPermission(userRole, module, requiredLevel)) {
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

export function getAccessibleModules(userRole: UserRole): ModuleName[] {
  const modules: ModuleName[] = [];
  const permissions = PERMISSION_MATRIX[userRole];

  for (const [module, level] of Object.entries(permissions)) {
    if (level !== PermissionLevel.NO_ACCESS) {
      modules.push(module as ModuleName);
    }
  }

  return modules;
}

export function getModulePermission(
  userRole: UserRole,
  module: ModuleName
): PermissionLevel {
  return PERMISSION_MATRIX[userRole]?.[module] || PermissionLevel.NO_ACCESS;
}
