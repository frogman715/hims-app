// src/lib/role-display.ts
export function getRoleDisplayName(role: string, isSystemAdmin?: boolean): string {
  // Only show System Admin indicator if applicable
  if (isSystemAdmin) {
    return '(System Admin)';
  }
  
  // Don't show role name, just return empty
  return '';
}
