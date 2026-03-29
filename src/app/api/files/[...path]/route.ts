/**
 * File Serving API Route
 * 
 * Securely serves uploaded files from the centralized upload directory.
 * Handles authentication and permission checks before serving files.
 * 
 * URL Pattern: /api/files/{relative-upload-path}
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

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.heic', '.heif']);

function isImageRequest(req: NextRequest, fullPath: string) {
  const accept = req.headers.get('accept') ?? '';
  const destination = req.headers.get('sec-fetch-dest') ?? '';
  const ext = path.extname(fullPath).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) || accept.includes('image/') || destination === 'image';
}

function serveFallbackImage() {
  const fallbackPath = path.join(process.cwd(), 'public', 'logo.png');
  const fallbackBuffer = fs.readFileSync(fallbackPath);
  const fallbackBody = new Uint8Array(fallbackBuffer);

  return new NextResponse(fallbackBody, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': fallbackBuffer.length.toString(),
      'Cache-Control': 'private, max-age=300',
      'X-HIMS-File-Fallback': 'logo',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

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
      const status = "status" in auth ? auth.status : 401;
      return new NextResponse('Unauthorized', { status });
    }

    // Get the requested path
    const resolvedParams = await params;
    if (!resolvedParams.path || resolvedParams.path.length === 0) {
      return new NextResponse('Bad request', { status: 400 });
    }
    const requestedPath = resolvedParams.path.join('/');
    const crewSegment = resolvedParams.path[0] ?? '';
    if (!crewSegment) {
      return new NextResponse('Bad request', { status: 400 });
    }

    // Build absolute path
    const fullPath = getAbsolutePath(requestedPath);

    const session = auth.session;
    const roles = normalizeToUserRoles(session.user.roles ?? session.user.role);
    const isAdmin = isSystemAdmin(session);
    const hasCrewAccess = hasPermission(roles, 'crew', PermissionLevel.VIEW_ACCESS);

    if (!isAdmin && !hasCrewAccess) {
      const isCrewPortalOnly = roles.length === 1 && roles[0] === UserRole.CREW_PORTAL;
      if (isCrewPortalOnly) {
        const sessionEmail = session.user.email ?? null;
        let crew = await prisma.crew.findUnique({
          where: { id: session.user.id },
          select: { id: true, crewCode: true },
        });

        if (!crew && sessionEmail) {
          crew = await prisma.crew.findFirst({
            where: { email: sessionEmail },
            select: { id: true, crewCode: true },
          });
        }

        const matchesCrewFolder =
          crew != null && (crew.id === crewSegment || crew.crewCode === crewSegment);

        if (!matchesCrewFolder) {
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
      if (isImageRequest(req, fullPath)) {
        return serveFallbackImage();
      }
      return NextResponse.json(
        { error: 'File not found', path: requestedPath },
        { status: 404 }
      );
    }

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
    if (isImageRequest(req, fullPath) && !mimeType.startsWith('image/')) {
      console.warn('[FILE_SERVER] Invalid image mime for requested image path:', {
        requestedPath,
        fullPath,
        mimeType,
        user: session.user.email,
      });
      return serveFallbackImage();
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(fullPath);
    } catch (readError) {
      console.error('[FILE_SERVER] Failed to read file:', {
        requestedPath,
        fullPath,
        user: session.user.email,
        error: readError instanceof Error ? readError.message : String(readError),
      });
      if (isImageRequest(req, fullPath)) {
        return serveFallbackImage();
      }
      return NextResponse.json(
        { error: 'Failed to read file', path: requestedPath },
        { status: 500 }
      );
    }

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
    return new NextResponse(new Uint8Array(fileBuffer), {
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
