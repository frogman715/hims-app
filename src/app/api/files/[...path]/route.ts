/**
 * File Serving API Route
 * 
 * Securely serves uploaded files from the centralized upload directory.
 * Handles authentication and permission checks before serving files.
 * 
 * URL Pattern: /api/files/{crewId}_{slug}/{filename}
 * Example: /api/files/cm123abc_JOHN_DOE_MASTER/20251230_cm123abc_photo.jpg
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserApi } from '@/lib/authz';
import fs from 'fs';
import path from 'path';
import { getAbsolutePath, isPathSafe } from '@/lib/upload-path';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit-log';
import { hasPermission, PermissionLevel, UserRole } from '@/lib/permissions';
import { isSystemAdmin, normalizeToUserRoles } from '@/lib/type-guards';

/**
 * GET handler for serving files
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const auth = await requireUserApi();
    if (!auth.ok) {
      return new NextResponse('Unauthorized', { status: auth.status });
    }

    // Get the requested path
    const resolvedParams = await params;
    if (!resolvedParams.path || resolvedParams.path.length === 0) {
      return new NextResponse('Bad request', { status: 400 });
    }
    const requestedPath = resolvedParams.path.join('/');
    const crewSegment = resolvedParams.path[0] ?? '';
    const crewId = crewSegment.split('_')[0];
    if (!crewId) {
      return new NextResponse('Bad request', { status: 400 });
    }

    // Build absolute path
    const fullPath = getAbsolutePath(requestedPath);

    const session = auth.session;
    const roles = normalizeToUserRoles(session.user.roles);
    const isAdmin = isSystemAdmin(session);
    const hasCrewAccess = hasPermission(roles, 'crew', PermissionLevel.VIEW_ACCESS);

    if (!isAdmin && !hasCrewAccess) {
      const isCrewPortalOnly = roles.length === 1 && roles[0] === UserRole.CREW_PORTAL;
      if (isCrewPortalOnly) {
        const sessionEmail = session.user.email ?? null;
        let crew = await prisma.crew.findUnique({
          where: { id: session.user.id },
          select: { id: true },
        });

        if (!crew && sessionEmail) {
          crew = await prisma.crew.findFirst({
            where: { email: sessionEmail },
            select: { id: true },
          });
        }

        if (!crew || crew.id !== crewId) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      } else {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    // Validate path to prevent directory traversal attacks
    if (!isPathSafe(fullPath)) {
      console.error('[FILE_SERVER] Path traversal attempt:', {
        requestedPath,
        fullPath,
        user: session.user.email,
      });
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn('[FILE_SERVER] File not found:', {
        requestedPath,
        fullPath,
        user: session.user.email,
      });
      return new NextResponse('Not found', { status: 404 });
    }

    // Read file
    const fileBuffer = fs.readFileSync(fullPath);

    // Determine MIME type from extension
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Log access for audit purposes
    console.info('[FILE_SERVER] File accessed:', {
      path: requestedPath,
      user: session.user.email,
      userRole: session.user.role,
      size: fileBuffer.length,
      timestamp: new Date().toISOString(),
    });
    try {
      await recordAuditLog({
        actorUserId: session.user.id,
        action: 'FILE_ACCESSED',
        entityType: 'UPLOAD_FILE',
        entityId: requestedPath,
        metadata: {
          path: requestedPath,
          size: fileBuffer.length,
          ip:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            req.headers.get('cf-connecting-ip') ||
            'unknown',
        },
      });
    } catch (error) {
      console.error('[FILE_SERVER] Audit log failed:', error);
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[FILE_SERVER] Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
