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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { getAbsolutePath, isPathSafe } from '@/lib/upload-path';

/**
 * GET handler for serving files
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the requested path
    const resolvedParams = await params;
    const requestedPath = resolvedParams.path.join('/');

    // Build absolute path
    const fullPath = getAbsolutePath(requestedPath);

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
