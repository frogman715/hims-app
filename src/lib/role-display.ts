// src/lib/role-display.ts
export function getRoleDisplayName(role: string, isSystemAdmin?: boolean): string {
  const normalizedRole = role?.toUpperCase?.() ?? '';

  const roleLabels: Record<string, string> = {
    DIRECTOR: 'Director',
    CDMO: 'Crewing and Manning',
    OPERATIONAL: 'Operational',
    ACCOUNTING: 'Accounting',
    HR: 'Human Resources',
    HR_ADMIN: 'HR Admin',
    QMR: 'Quality Management',
    SECTION_HEAD: 'Section Head',
    STAFF: 'Staff',
    CREW_PORTAL: 'Crew Portal',
    CREW: 'Crew Portal',
  };

  const baseLabel = roleLabels[normalizedRole] ?? 'User';
  return isSystemAdmin ? `${baseLabel} (System Admin)` : baseLabel;
}
