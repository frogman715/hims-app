import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, hasPermission, PermissionLevel } from '@/lib/permissions';

export { PermissionLevel };

interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  name?: string;
}

// Middleware untuk mengecek permission
export function withPermission(
  requiredPermission: PermissionLevel,
  module: string
) {
  return async function permissionMiddleware(request: NextRequest) {
    try {
      // Get token from request
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const user = token.user as AuthenticatedUser;

      if (!user || !user.roles || user.roles.length === 0) {
        return NextResponse.json(
          { error: 'Invalid user session' },
          { status: 401 }
        );
      }

      // Check permission - pass all user roles
      const hasAccess = hasPermission(user.roles as UserRole[], module, requiredPermission);

      if (!hasAccess) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            required: `${requiredPermission} access to ${module}`,
            userRole: user.roles[0]
          },
          { status: 403 }
        );
      }

      // Permission granted, continue to API
      return NextResponse.next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      );
    }
  };
}

// Specific middleware untuk module tertentu
export const requireFullAccess = (module: string) =>
  withPermission(PermissionLevel.FULL_ACCESS, module);

export const requireEditAccess = (module: string) =>
  withPermission(PermissionLevel.EDIT_ACCESS, module);

export const requireViewAccess = (module: string) =>
  withPermission(PermissionLevel.VIEW_ACCESS, module);

// Utility function untuk API routes
export async function checkUserPermission(
  request: NextRequest,
  module: string,
  requiredPermission: PermissionLevel
): Promise<{ allowed: boolean; user?: AuthenticatedUser; error?: string }> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      return { allowed: false, error: 'Authentication required' };
    }

    const user = token.user as AuthenticatedUser;

    if (!user || !user.roles || user.roles.length === 0) {
      return { allowed: false, error: 'Invalid user session' };
    }

    // Check permission using all user roles
    const hasAccess = hasPermission(user.roles as UserRole[], module, requiredPermission);

    return {
      allowed: hasAccess,
      user,
      error: hasAccess ? undefined : 'Insufficient permissions'
    };
  } catch {
    return { allowed: false, error: 'Permission check failed' };
  }
}

// Permission guard untuk API routes
export function createPermissionGuard(module: string, requiredPermission: PermissionLevel) {
  return async function(request: NextRequest): Promise<NextResponse | null> {
    const { allowed, error: permissionError } = await checkUserPermission(request, module, requiredPermission);

    if (!allowed) {
      return NextResponse.json(
        { error: permissionError || 'Access denied' },
        { status: 403 }
      );
    }

    return null; // Permission granted
  };
}

interface SessionUser {
  id: string;
  email: string;
  roles: string[];
  name?: string;
}

interface Session {
  user?: SessionUser;
}

// Simplified guard functions for API routes
export function checkPermission(session: Session | null, module: string, requiredLevel: PermissionLevel): boolean {
  if (!session?.user?.roles || session.user.roles.length === 0) return false;

  // Check permission using all user roles
  return hasPermission(session.user.roles as UserRole[], module, requiredLevel);
}

// Module-specific guard functions
export function principalsGuard(session: Session | null): boolean {
  return checkPermission(session, 'principals', PermissionLevel.VIEW_ACCESS);
}

export function contractsGuard(session: Session | null): boolean {
  return checkPermission(session, 'contracts', PermissionLevel.VIEW_ACCESS);
}

export function crewGuard(session: Session | null): boolean {
  return checkPermission(session, 'crew', PermissionLevel.VIEW_ACCESS);
}

export function disciplinaryGuard(session: Session | null): boolean {
  return checkPermission(session, 'disciplinary', PermissionLevel.VIEW_ACCESS);
}

export function accountingGuard(session: Session | null): boolean {
  return checkPermission(session, 'accounting', PermissionLevel.VIEW_ACCESS);
}

export function agencyFeesGuard(session: Session | null): boolean {
  return checkPermission(session, 'agencyFees', PermissionLevel.VIEW_ACCESS);
}

export function applicationsGuard(session: Session | null): boolean {
  return checkPermission(session, 'applications', PermissionLevel.VIEW_ACCESS);
}

export function assignmentsGuard(session: Session | null): boolean {
  return checkPermission(session, 'assignments', PermissionLevel.VIEW_ACCESS);
}

export function vesselsGuard(session: Session | null): boolean {
  return checkPermission(session, 'vessels', PermissionLevel.VIEW_ACCESS);
}
