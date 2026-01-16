// src/lib/role-display.ts
export function getRoleDisplayName(role: string, isSystemAdmin?: boolean): string {
  const roleMap: Record<string, string> = {
    'DIRECTOR': 'Admin',
    'CDMO': 'CDMO',
    'OPERATIONAL': 'Operational',
    'ACCOUNTING': 'Accounting',
    'HR': 'HR',
    'CREW_PORTAL': 'Crew Portal',
    'QMR': 'QMR',
    'HR_ADMIN': 'HR Admin',
    'SECTION_HEAD': 'Section Head',
    'STAFF': 'Staff',
  };
  
  const displayName = roleMap[role] || role;
  
  // Add system admin indicator if applicable
  if (isSystemAdmin) {
    return `${displayName} (System Admin)`;
  }
  
  return displayName;
}
