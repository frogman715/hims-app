// src/lib/role-display.ts
const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: 'Director',
  PRINCIPAL: 'Principal',
  CDMO: 'Crewing Document Control',
  OPERATIONAL: 'Operational Control',
  GA_DRIVER: 'General Affairs & Transport',
  ACCOUNTING: 'Accounting',
  HR: 'Human Resources',
  HR_ADMIN: 'HR Administration',
  QMR: 'Quality Management',
  SECTION_HEAD: 'Section Head',
  STAFF: 'Staff',
  CREW_PORTAL: 'Crew Portal',
  CREW: 'Crew Portal',
};

type RoleWorkspaceProfile = {
  label: string;
  focus: string;
  primaryDesk: string;
  actionLabels: string[];
};

const ROLE_WORKSPACE_PROFILES: Record<string, RoleWorkspaceProfile> = {
  DIRECTOR: {
    label: 'Director',
    focus: 'Executive oversight across readiness, contract exposure, escalations, and cross-department approvals.',
    primaryDesk: 'Executive Command Center',
    actionLabels: ['Review executive backlog', 'Approve critical cases', 'Escalate blocked operations'],
  },
  CDMO: {
    label: 'Crewing Document Control',
    focus: 'Document validity, crew record quality, certificate review, and pre-deployment document readiness.',
    primaryDesk: 'Document Control Workspace',
    actionLabels: ['Review expiring documents', 'Verify crew records', 'Release document-ready cases'],
  },
  OPERATIONAL: {
    label: 'Operational Control',
    focus: 'Prepare joining, assignment execution, travel coordination, and onboard movement follow-up.',
    primaryDesk: 'Operations Desk',
    actionLabels: ['Run prepare joining', 'Monitor assignments', 'Resolve mobilization blockers'],
  },
  ACCOUNTING: {
    label: 'Accounting',
    focus: 'Payroll references, wage exposure, settlement tracking, and finance register control.',
    primaryDesk: 'Accounting Workspace',
    actionLabels: ['Review payroll items', 'Track finance exposure', 'Close outstanding records'],
  },
  HR: {
    label: 'Human Resources',
    focus: 'Recruitment, personnel administration, employee records, and office attendance governance.',
    primaryDesk: 'HR Workspace',
    actionLabels: ['Review recruitment pipeline', 'Maintain employee records', 'Track attendance and leave'],
  },
  HR_ADMIN: {
    label: 'HR Administration',
    focus: 'Administrative control for personnel, policy records, office onboarding, and HR documentation.',
    primaryDesk: 'HR Administration Workspace',
    actionLabels: ['Maintain personnel admin', 'Track orientation records', 'Support policy compliance'],
  },
  QMR: {
    label: 'Quality Management',
    focus: 'Audits, CAPA, non-conformities, procedure control, and risk oversight.',
    primaryDesk: 'Quality Workspace',
    actionLabels: ['Run audit follow-up', 'Review non-conformities', 'Monitor risk treatment'],
  },
  GA_DRIVER: {
    label: 'General Affairs & Transport',
    focus: 'Transport planning, pickup execution, movement support, and logistics follow-up.',
    primaryDesk: 'Transport Support Desk',
    actionLabels: ['Coordinate pickups', 'Track crew movements', 'Support assignment logistics'],
  },
  PRINCIPAL: {
    label: 'Principal',
    focus: 'External principal-side review of submissions, approvals, and vessel-linked crew decisions.',
    primaryDesk: 'Principal Portal',
    actionLabels: ['Review submissions', 'Approve or reject cases', 'Monitor vessel-linked requests'],
  },
  SECTION_HEAD: {
    label: 'Section Head',
    focus: 'Department supervision, internal review, and team follow-up across assigned functions.',
    primaryDesk: 'Department Review Desk',
    actionLabels: ['Review team workload', 'Confirm escalations', 'Follow up pending approvals'],
  },
  STAFF: {
    label: 'Staff',
    focus: 'Operational support, task execution, and department-specific data maintenance.',
    primaryDesk: 'Team Workspace',
    actionLabels: ['Complete assigned tasks', 'Update records', 'Escalate blockers early'],
  },
  CREW_PORTAL: {
    label: 'Crew Portal',
    focus: 'Self-service access for personal documents, status tracking, and assigned crew actions.',
    primaryDesk: 'Crew Portal',
    actionLabels: ['Check assigned tasks', 'Review personal documents', 'Track status updates'],
  },
  CREW: {
    label: 'Crew Portal',
    focus: 'Self-service access for personal documents, status tracking, and assigned crew actions.',
    primaryDesk: 'Crew Portal',
    actionLabels: ['Check assigned tasks', 'Review personal documents', 'Track status updates'],
  },
};

export function getRoleDisplayName(role: string, isSystemAdmin?: boolean): string {
  const normalizedRole = role?.toUpperCase?.() ?? '';
  const baseLabel = ROLE_LABELS[normalizedRole] ?? 'User';
  return isSystemAdmin ? `${baseLabel} (System Admin)` : baseLabel;
}

export function getRoleWorkspaceProfile(role: string): RoleWorkspaceProfile {
  const normalizedRole = role?.toUpperCase?.() ?? '';
  return ROLE_WORKSPACE_PROFILES[normalizedRole] ?? {
    label: 'User',
    focus: 'Access your assigned workspace, review pending items, and keep operational records current.',
    primaryDesk: 'Operations Workspace',
    actionLabels: ['Review pending items', 'Update assigned records', 'Escalate blockers'],
  };
}
