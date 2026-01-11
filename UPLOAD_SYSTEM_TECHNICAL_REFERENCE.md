# 📁 HIMS Upload System - Technical Reference

## Overview

The HIMS upload system has been refactored to use a centralized, organized file storage structure that is independent of the application's public directory. This provides better security, easier backups, and cleaner organization.

## Architecture

### Directory Structure

```
/home/hanmarine/seafarers_files/          # Base upload directory
├── {crewId}_{slug}/                      # Per-crew directory
│   ├── 20251230_{crewId}_photo.jpg      # Photo files
│   ├── 20251230_{crewId}_coc_{doc}.pdf  # Certificate of Competency
│   ├── 20251230_{crewId}_passport_{doc}.pdf
│   ├── 20251230_{crewId}_medical_{doc}.pdf
│   └── ...
└── ...
```

### File Naming Convention

All uploaded files follow this pattern:

```
{YYYYMMDD}_{crewId}_{fileType}_{identifier}.{ext}

Examples:
- 20251230_cm123abc_photo.jpg
- 20251230_cm123abc_coc_620027165in20225.pdf
- 20251230_cm456def_passport_a1234567.pdf
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPLOAD_BASE_DIR` | Base directory for all uploads | `/home/hanmarine/seafarers_files` | No |
| `UPLOAD_MAX_SIZE_MB` | Maximum file size in MB | `20` | No |

## API Endpoints

### Upload Endpoints

#### 1. Upload Seafarer Photo

```http
POST /api/crewing/seafarers/{id}/photo

Content-Type: multipart/form-data

Body:
  file: File (image/jpeg, image/png)
  
Response:
  {
    "photoUrl": "/api/files/{crewId}_{slug}/{filename}",
    "message": "Photo uploaded successfully"
  }
```

#### 2. Upload Document

```http
POST /api/documents

Content-Type: multipart/form-data

Body:
  seafarerId: string
  docType: string (COC, PASSPORT, MEDICAL, etc.)
  docNumber: string
  issueDate: string (YYYY-MM-DD)
  expiryDate: string (YYYY-MM-DD)
  remarks: string (optional)
  file: File (pdf, jpg, png, doc, docx)

Response:
  {
    "id": "doc123",
    "fileUrl": "/api/files/{crewId}_{slug}/{filename}",
    ...
  }
```

#### 3. Upload HGF Document

```http
POST /api/hgf/documents/upload

Content-Type: multipart/form-data

Body:
  submissionId: string
  documentType: string
  documentCode: string (optional)
  file: File

Response:
  {
    "data": {...},
    "message": "Document uploaded successfully"
  }
```

#### 4. Mobile Crew Upload

```http
POST /api/mobile/crew/upload

Content-Type: multipart/form-data

Body:
  file: File
  type: string (document type)

Response:
  {
    "ok": true,
    "documentId": "doc123"
  }
```

### File Access Endpoint

#### Serve Files (Authenticated)

```http
GET /api/files/{crewId}_{slug}/{filename}

Headers:
  Cookie: next-auth.session-token=...

Response:
  File binary with appropriate Content-Type header
```

**Security Features:**
- Requires authentication (NextAuth session)
- Path traversal protection
- File existence validation
- Audit logging of all file access

## Core Utilities

### `src/lib/upload-path.ts`

Central utility module for upload path management.

#### Functions

##### `getUploadBaseDir(): string`

Returns the base upload directory from environment or default.

```typescript
const baseDir = getUploadBaseDir();
// Returns: "/home/hanmarine/seafarers_files"
```

##### `getMaxFileSize(): number`

Returns maximum allowed file size in bytes.

```typescript
const maxSize = getMaxFileSize();
// Returns: 20971520 (20MB)
```

##### `ensureCrewUploadDir(crewId, slug): string`

Creates and returns the crew-specific upload directory.

```typescript
const dir = ensureCrewUploadDir("cm123abc", "JOHN_DOE_MASTER");
// Returns: "/home/hanmarine/seafarers_files/cm123abc_JOHN_DOE_MASTER"
// Creates directory if it doesn't exist
```

##### `buildCrewFilePath(crewId, slug, filename): string`

Builds complete file path for a crew member's file.

```typescript
const path = buildCrewFilePath("cm123abc", "JOHN_DOE", "photo.jpg");
// Returns: "/home/hanmarine/seafarers_files/cm123abc_JOHN_DOE/photo.jpg"
```

##### `getRelativePath(absolutePath): string`

Converts absolute path to relative path for database storage.

```typescript
const rel = getRelativePath("/home/hanmarine/seafarers_files/cm123_JOHN/file.pdf");
// Returns: "cm123_JOHN/file.pdf"
```

##### `getAbsolutePath(relativePath): string`

Converts relative path to absolute path.

```typescript
const abs = getAbsolutePath("cm123_JOHN/file.pdf");
// Returns: "/home/hanmarine/seafarers_files/cm123_JOHN/file.pdf"
```

##### `generateSafeFilename(crewId, fileType, originalFilename): string`

Generates sanitized filename with timestamp.

```typescript
const name = generateSafeFilename("cm123", "photo", "my photo.jpg");
// Returns: "20251230_cm123_photo.jpg"
```

##### `isPathSafe(filePath): boolean`

Validates path to prevent directory traversal attacks.

```typescript
if (!isPathSafe(userProvidedPath)) {
  throw new Error("Invalid path");
}
```

##### `deleteFileSafe(filePath): boolean`

Safely deletes a file with validation.

```typescript
const deleted = deleteFileSafe(filePath);
// Returns true if successful or file doesn't exist
```

## Implementation Examples

### Example 1: Simple Photo Upload

```typescript
import { buildCrewFilePath, getRelativePath } from '@/lib/upload-path';
import { writeFile } from 'fs/promises';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const crewId = formData.get('crewId') as string;
  
  // Get crew info for slug
  const crew = await prisma.crew.findUnique({
    where: { id: crewId },
    select: { fullName: true }
  });
  
  const crewSlug = crew.fullName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  
  // Build file path
  const filename = `${Date.now()}_${crewId}_photo.jpg`;
  const filepath = buildCrewFilePath(crewId, crewSlug, filename);
  
  // Save file
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));
  
  // Store relative path in DB
  const relativePath = getRelativePath(filepath);
  const fileUrl = `/api/files/${relativePath}`;
  
  await prisma.crew.update({
    where: { id: crewId },
    data: { photoUrl: fileUrl }
  });
  
  return NextResponse.json({ fileUrl });
}
```

### Example 2: Document Upload with Validation

```typescript
import { 
  buildCrewFilePath, 
  getRelativePath, 
  getMaxFileSize 
} from '@/lib/upload-path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // Validate size
  const maxSize = getMaxFileSize();
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File too large' },
      { status: 413 }
    );
  }
  
  // Validate type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type' },
      { status: 400 }
    );
  }
  
  // Process upload...
}
```

## Backup & Maintenance

### Automated Backup

The system includes an automated backup script that runs daily via cron:

```bash
# Cron job (runs at 2 AM daily)
0 2 * * * /home/hanmarine/projects/hims-app/backup-uploads.sh
```

**Backup Script Features:**
- Compressed tar.gz archive
- 30-day retention policy
- Integrity verification
- Detailed logging to `/var/log/hims-backup.log`

### Manual Backup

```bash
cd /home/hanmarine/seafarers_files
tar -czf ~/backups/manual_backup_$(date +%Y%m%d).tar.gz .
```

### Restore from Backup

```bash
cd /home/hanmarine/seafarers_files
tar -xzf ~/backups/seafarers_files_backup_20251230_020000.tar.gz
```

## Migration from Old System

To migrate from the old `public/uploads` structure to the new system:

```bash
cd /home/hanmarine/projects/hims-app

# Dry run (preview only)
./scripts/migrate-old-uploads.sh

# Actual migration
DRY_RUN=false ./scripts/migrate-old-uploads.sh
```

## Security Considerations

1. **Authentication Required**: All file access requires valid NextAuth session
2. **Path Traversal Protection**: All paths validated before file operations
3. **File Type Whitelist**: Only allowed MIME types accepted
4. **Size Limits**: Configurable max file size (default 20MB)
5. **Directory Isolation**: Files stored outside public directory
6. **Audit Logging**: All file access logged with user info
7. **Sanitized Filenames**: Special characters removed from filenames

## Performance Optimization

1. **Direct File Serving**: Files served via Node.js route (not static)
2. **Cache Headers**: 1-hour cache for authenticated users
3. **Organized Structure**: Per-crew directories for faster access
4. **Compression**: Files can be served with gzip if needed

## Troubleshooting

### Issue: Permission Denied

```bash
# Fix permissions
sudo chown -R hanmarine:hanmarine /home/hanmarine/seafarers_files
chmod -R 755 /home/hanmarine/seafarers_files
```

### Issue: File Not Found After Upload

```bash
# Check environment variable
pm2 env hims-app | grep UPLOAD

# Check if directory exists
ls -la /home/hanmarine/seafarers_files

# Check application logs
pm2 logs hims-app | grep UPLOAD
```

### Issue: Disk Space

```bash
# Check disk usage
df -h /home/hanmarine

# Check upload folder size
du -sh /home/hanmarine/seafarers_files

# Find largest files
find /home/hanmarine/seafarers_files -type f -exec du -h {} + | sort -rh | head -20
```

## Development vs Production

### Development (.env.local)

```bash
UPLOAD_BASE_DIR=/path/to/your/dev/uploads
UPLOAD_MAX_SIZE_MB=20
```

### Production (.env.production)

```bash
UPLOAD_BASE_DIR=/home/hanmarine/seafarers_files
UPLOAD_MAX_SIZE_MB=20
```

## Related Documentation

- [Deployment Guide](./DEPLOYMENT_UPLOAD_GUIDE.md) - Step-by-step deployment instructions
- [Upload System Guide (Indonesian)](./UPLOAD_SYSTEM_GUIDE_ID.md) - Original upload documentation
- [API Security Reference](./API_SECURITY_QUICK_REFERENCE.md) - Security best practices
- [Permission Matrix](./PERMISSION_MATRIX.md) - Role-based access control

---

**Last Updated:** 2025-01-11  
**Version:** 2.0  
**Maintainer:** HIMS Development Team
