import { Role } from '@prisma/client';

/**
 * Document Control Permissions Matrix
 * Defines who can do what with documents
 */

export const documentPermissions: Record<string, Role[]> = {
  // Can CREATE new documents
  canCreate: [Role.QMR, Role.DIRECTOR],

  // Can EDIT documents (only in DRAFT status)
  canEdit: [Role.QMR, Role.DIRECTOR],

  // Can SUBMIT for approval
  canSubmit: [Role.QMR],

  // Can APPROVE documents (Approval Level depends on role)
  canApprove: [Role.QMR, Role.DIRECTOR],

  // Can DISTRIBUTE documents
  canDistribute: [Role.QMR, Role.DIRECTOR],

  // Can VIEW documents
  canView: [
    Role.DIRECTOR,
    Role.CDMO,
    Role.QMR,
    Role.HR_ADMIN,
    Role.SECTION_HEAD,
    Role.STAFF,
  ],

  // Can DELETE documents (only in DRAFT status)
  canDelete: [Role.DIRECTOR],
};

export const approvalLevelByRole = {
  [Role.QMR]: 1, // First approval level
  [Role.DIRECTOR]: 2, // Final approval level
};

export const approvalFlow = [
  { level: 1, role: Role.QMR, title: 'Quality Management Representative' },
  { level: 2, role: Role.DIRECTOR, title: 'Director' },
];

/**
 * Check if user has permission to perform action
 */
export function hasDocumentPermission(
  userRole: Role,
  action: keyof typeof documentPermissions
): boolean {
  const allowedRoles = documentPermissions[action];
  return allowedRoles.includes(userRole);
}

/**
 * Get next approval level
 */
export function getNextApprovalLevel(currentLevel: number): number | null {
  const nextFlow = approvalFlow.find((f) => f.level === currentLevel + 1);
  return nextFlow ? nextFlow.level : null;
}

/**
 * Get approval details by level
 */
export function getApprovalLevelDetails(
  level: number
): (typeof approvalFlow)[0] | undefined {
  return approvalFlow.find((f) => f.level === level);
}

/**
 * Get role's approval level
 */
export function getRoleApprovalLevel(role: Role): number {
  return approvalLevelByRole[role as keyof typeof approvalLevelByRole] || 0;
}
