// src/lib/role-display.ts
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    'DIRECTOR': 'Admin',
    'CDMO': 'CDMO',
    'OPERATIONAL': 'Operational',
    'ACCOUNTING': 'Accounting',
    'HR': 'HR',
    'HR_ADMIN': 'HR Admin',
    'QMR': 'QMR',
    'SECTION_HEAD': 'Section Head',
    'STAFF': 'Staff',
    'CREW_PORTAL': 'Crew Portal'
  };
  
  return roleMap[role] || role;
}
