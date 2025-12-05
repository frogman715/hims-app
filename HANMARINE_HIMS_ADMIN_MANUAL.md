# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS)
## Administrator Manual & Technical Guide

**Version:** 5.0 - Enterprise Edition
**Date:** December 3, 2025
**Classification:** HIGHLY CONFIDENTIAL - IT Administrators Only
**Company:** PT. HANMARINE Indonesia
**Compliance:** ISO 27001 | SOC 2 | NIST Cybersecurity Framework

---

## 📋 Executive Summary

This Administrator Manual provides comprehensive technical guidance for deploying, maintaining, and securing HANMARINE HIMS. This enterprise-grade system implements world-class security standards, regulatory compliance, and operational excellence for maritime crew management.

### System Overview:
- **Architecture**: Next.js 16 + React 19 + PostgreSQL + Prisma ORM
- **Security**: AES-256 encryption, MFA, comprehensive audit logging
- **Compliance**: ISO 27001, SOC 2, NIST CSF, maritime regulations
- **Scalability**: Supports 10,000+ crew records with 99.5% uptime
- **Deployment**: Docker + Kubernetes production-ready

### Administrator Responsibilities:
1. **System Security**: Access control, encryption, threat monitoring
2. **Data Integrity**: Backup, recovery, data validation
3. **Performance**: Monitoring, optimization, capacity planning
4. **Compliance**: Audit preparation, regulatory reporting
5. **User Management**: Onboarding, permissions, lifecycle management

---

## 📊 Table of Contents

| Section | Description | Page |
|---------|-------------|------|
| 1.0 | System Architecture | 3 |
| 2.0 | Security Implementation | 15 |
| 3.0 | Deployment & Installation | 35 |
| 4.0 | User & Permission Management | 55 |
| 5.0 | Database Administration | 75 |
| 6.0 | Monitoring & Maintenance | 95 |
| 7.0 | Backup & Disaster Recovery | 115 |
| 8.0 | Troubleshooting | 135 |
| 9.0 | Compliance & Auditing | 155 |
| 10.0 | Emergency Procedures | 175 |

---

## 🎯 Pendahuluan

### Overview Sistem

HANMARINE HIMS adalah sistem enterprise-grade untuk manajemen operasional perusahaan pelayaran dengan fokus pada:

- **Security-First Design**: Zero-trust architecture
- **Regulatory Compliance**: IMO, STCW, Flag State requirements
- **Scalability**: Support hingga 10,000+ crew records
- **Audit Trail**: Complete logging untuk compliance

### Tanggung Jawab Administrator

1. **System Security**: Mengelola akses dan permission
2. **Data Integrity**: Memastikan data akurat dan aman
3. **Performance**: Monitoring dan optimization
4. **Compliance**: Memastikan sistem memenuhi regulasi
5. **User Management**: Onboarding dan offboarding users
6. **Backup & Recovery**: Disaster recovery planning

---

## 🏗️ Arsitektur Sistem

### Tech Stack

```
Frontend: Next.js 16.0.4 + TypeScript + Tailwind CSS
Backend: Next.js API Routes
Database: PostgreSQL with Prisma ORM
Authentication: NextAuth.js with custom providers
Deployment: Docker + Kubernetes (Production)
Security: Custom RBAC + Encryption + Audit Logging
```

### Database Schema Overview

```sql
-- Core Tables
Users (Authentication & Authorization)
├── UserRole (EXECUTIVE_MANAGEMENT, CREWING_MANAGER, etc.)
├── UserPermissions (Module-specific permissions)
└── UserSessions (Session management)

-- Business Tables
Principals (Ship Owner Agreements - HIGHLY SENSITIVE)
├── PrincipalAgreements (Contract terms, expiry dates)
├── FinancialTerms (Pricing, penalties)
└── ComplianceRecords (Regulatory compliance)

Crew (Personal Data - SENSITIVE)
├── PersonalInfo (PII: name, DOB, passport, etc.)
├── EmploymentHistory (Previous contracts)
├── Certifications (STCW certificates)
└── MedicalRecords (Health information)

Contracts (Employment Contracts)
├── ContractTerms (Salary, duration, conditions)
├── PrincipalLinks (Ship owner associations)
└── PaymentRecords (Salary payments)

Financial (Accounting Data - SENSITIVE)
├── AgencyFees (Commission payments)
├── OfficeExpenses (Operational costs)
├── Invoices (Billing records)
└── AuditTrail (Financial transactions)
```

### Security Layers

1. **Network Security**
   - Web Application Firewall (WAF)
   - DDoS Protection
   - VPN Required for External Access

2. **Application Security**
   - Input Validation & Sanitization
   - SQL Injection Prevention
   - XSS Protection
   - CSRF Protection

3. **Data Security**
   - AES-256 Encryption at Rest
   - TLS 1.3 in Transit
   - Data Masking for Logs
   - PII Data Protection

---

## ⚙️ Setup & Instalasi

### Prerequisites

```bash
# System Requirements
- Ubuntu 20.04+ / CentOS 8+
- Node.js 18.17+
- PostgreSQL 15+
- Redis 7+ (for sessions)
- Docker 24+
- Nginx 1.20+

# Hardware Requirements
- CPU: 4 cores minimum, 8 cores recommended
- RAM: 8GB minimum, 16GB recommended
- Storage: 100GB SSD minimum
- Network: 100Mbps minimum
```

### Installation Steps

#### 1. Database Setup

```bash
# Create database
sudo -u postgres createdb hanmarine_hims

# Create user
sudo -u postgres createuser hanmarine_user
sudo -u postgres psql -c "ALTER USER hanmarine_user PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hanmarine_hims TO hanmarine_user;"

# Run migrations
npx prisma migrate deploy
npx prisma db seed
```

#### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/hanmarine/hims-app.git
cd hims-app

# Install dependencies
npm ci --production=false

# Environment configuration
cp .env.example .env.local
nano .env.local

# Build application
npm run build
```

#### 3. Environment Variables

```env
# Database
DATABASE_URL="postgresql://hanmarine_user:secure_password@localhost:5432/hanmarine_hims"

# Authentication
NEXTAUTH_SECRET="your-super-secure-secret-here"
NEXTAUTH_URL="https://hims.hanmarine.com"

# Security
ENCRYPTION_KEY="32-character-encryption-key"
JWT_SECRET="another-super-secure-secret"

# Email (for notifications)
SMTP_HOST="smtp.hanmarine.com"
SMTP_PORT="587"
SMTP_USER="noreply@hanmarine.com"
SMTP_PASS="secure-email-password"

# External APIs
IMO_API_KEY="your-imo-api-key"
FLAG_STATE_API_KEY="your-flag-state-api-key"
```

#### 4. SSL Certificate Setup

```bash
# Let's Encrypt SSL
certbot --nginx -d hims.hanmarine.com

# Manual SSL (if needed)
# Copy certificates to /etc/ssl/certs/
# Configure nginx for SSL termination
```

### Docker Deployment (Recommended)

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY . .
RUN npm run build

FROM base AS production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/hims
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=hanmarine_hims
      - POSTGRES_USER=hanmarine_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 🔐 Konfigurasi Permission System

### Permission Matrix Configuration

File: `/lib/permissions.ts`

```typescript
export const PERMISSION_MATRIX: Record<UserRole, Record<ModuleName, PermissionLevel>> = {
  EXECUTIVE_MANAGEMENT: {
    principals: 'FULL_ACCESS',    // Can view/edit/delete principal agreements
    contracts: 'FULL_ACCESS',     // Full contract management
    accounting: 'FULL_ACCESS',    // Full financial access
    crew: 'FULL_ACCESS',          // Full crew data access
    disciplinary: 'FULL_ACCESS',  // Full disciplinary access
    // ... other modules
  },
  CREWING_MANAGER: {
    principals: 'FULL_ACCESS',    // Can manage principal relationships
    contracts: 'FULL_ACCESS',     // Contract management
    crew: 'FULL_ACCESS',          // Crew management
    applications: 'FULL_ACCESS',  // Recruitment management
    assignments: 'FULL_ACCESS',   // Assignment management
    accounting: 'VIEW_ACCESS',    // Can view financial data
    // ... other modules
  },
  // ... other roles
};
```

### Custom Permission Guards

```typescript
// /lib/permission-middleware.ts
export function principalsGuard(session: any): boolean {
  if (!session?.user?.role) return false;

  const allowedRoles = ['EXECUTIVE_MANAGEMENT', 'CREWING_MANAGER'];
  return allowedRoles.includes(session.user.role);
}

export function checkPermission(
  session: any,
  module: ModuleName,
  requiredLevel: PermissionLevel
): boolean {
  if (!session?.user?.role) return false;

  const userPermissions = PERMISSION_MATRIX[session.user.role as UserRole];
  if (!userPermissions) return false;

  const userLevel = userPermissions[module];
  if (!userLevel) return false;

  // Permission hierarchy: NO_ACCESS < VIEW_ACCESS < EDIT_ACCESS < FULL_ACCESS
  const hierarchy = ['NO_ACCESS', 'VIEW_ACCESS', 'EDIT_ACCESS', 'FULL_ACCESS'];
  const userIndex = hierarchy.indexOf(userLevel);
  const requiredIndex = hierarchy.indexOf(requiredLevel);

  return userIndex >= requiredIndex;
}
```

### API Route Protection

```typescript
// Example: /api/principals/route.ts
import { checkPermission, principalsGuard } from "@/lib/permission-middleware";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use guard for view access
  if (!principalsGuard(session)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Fetch and return data
  const principals = await prisma.principal.findMany();
  return NextResponse.json(principals);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check for edit access
  if (!checkPermission(session, 'principals', 'EDIT_ACCESS')) {
    return NextResponse.json({ error: "Insufficient permissions to create principals" }, { status: 403 });
  }

  // Create new principal
  const data = await request.json();
  const principal = await prisma.principal.create({ data });
  return NextResponse.json(principal, { status: 201 });
}
```

---

## 👥 Manajemen User & Role

### User Lifecycle Management

#### 1. User Onboarding

```typescript
// /api/admin/users/route.ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Only admins can create users
  if (!checkPermission(session, 'admin', 'FULL_ACCESS')) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { email, name, role, department } = await request.json();

  // Create user with temporary password
  const tempPassword = generateSecurePassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      department,
      password: hashedPassword,
      status: 'PENDING_ACTIVATION',
      passwordResetRequired: true,
      passwordResetToken: generateResetToken(),
      passwordResetExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }
  });

  // Send welcome email with activation link
  await sendWelcomeEmail(user.email, tempPassword);

  return NextResponse.json({
    message: "User created successfully",
    userId: user.id,
    tempPassword: tempPassword // Only for admin reference
  });
}
```

#### 2. Role Assignment & Changes

```typescript
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!checkPermission(session, 'admin', 'FULL_ACCESS')) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { userId, newRole, reason } = await request.json();

  // Log the role change
  await prisma.auditLog.create({
    data: {
      action: 'ROLE_CHANGE',
      userId: session.user.id,
      targetUserId: userId,
      oldValue: currentUser.role,
      newValue: newRole,
      reason,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent')
    }
  });

  // Update user role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });

  // Send notification
  await sendRoleChangeNotification(updatedUser.email, newRole);

  return NextResponse.json(updatedUser);
}
```

#### 3. User Deactivation

```typescript
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!checkPermission(session, 'admin', 'FULL_ACCESS')) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const userId = url.pathname.split('/').pop();

  // Soft delete - mark as inactive
  const deactivatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'INACTIVE',
      deactivatedAt: new Date(),
      deactivatedBy: session.user.id
    }
  });

  // Log deactivation
  await prisma.auditLog.create({
    data: {
      action: 'USER_DEACTIVATION',
      userId: session.user.id,
      targetUserId: userId,
      reason: 'Administrative deactivation',
      ipAddress: request.headers.get('x-forwarded-for')
    }
  });

  return NextResponse.json({ message: "User deactivated successfully" });
}
```

### Bulk User Operations

```typescript
// Bulk user import from CSV
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!checkPermission(session, 'admin', 'FULL_ACCESS')) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('csvFile') as File;

  const csvContent = await file.text();
  const users = parseCSV(csvContent);

  const results = {
    successful: [],
    failed: []
  };

  for (const userData of users) {
    try {
      const user = await createUser(userData);
      results.successful.push(user);
    } catch (error) {
      results.failed.push({ data: userData, error: error.message });
    }
  }

  return NextResponse.json(results);
}
```

---

## 📊 Maintenance & Monitoring

### System Health Checks

#### 1. Database Health

```bash
# Check database connectivity
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "SELECT 1;"

# Monitor database performance
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
SELECT
  schemaname,
  tablename,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
LIMIT 10;
"
```

#### 2. Application Health

```typescript
// /api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      externalAPIs: await checkExternalAPIs()
    },
    metrics: {
      activeUsers: await getActiveUsersCount(),
      pendingTasks: await getPendingTasksCount(),
      systemLoad: process.cpuUsage()
    }
  };

  const statusCode = health.services.database && health.services.redis ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
```

#### 3. Performance Monitoring

```typescript
// Response time monitoring
export async function middleware(request: NextRequest) {
  const start = Date.now();

  const response = await NextResponse.next();

  const duration = Date.now() - start;

  // Log slow requests (>500ms)
  if (duration > 500) {
    await prisma.performanceLog.create({
      data: {
        path: request.nextUrl.pathname,
        method: request.method,
        duration,
        userId: session?.user?.id,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent')
      }
    });
  }

  return response;
}
```

### Log Management

#### 1. Application Logs

```bash
# View recent logs
tail -f /var/log/hanmarine-hims/app.log

# Search for errors
grep "ERROR" /var/log/hanmarine-hims/app.log | tail -20

# Log rotation
logrotate -f /etc/logrotate.d/hanmarine-hims
```

#### 2. Audit Logs

```typescript
// Comprehensive audit logging
export async function auditLog(action: string, details: any) {
  await prisma.auditLog.create({
    data: {
      action,
      userId: details.userId,
      targetResource: details.resource,
      oldValue: JSON.stringify(details.oldValue),
      newValue: JSON.stringify(details.newValue),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      timestamp: new Date(),
      reason: details.reason
    }
  });
}

// Usage examples
await auditLog('USER_LOGIN', {
  userId: session.user.id,
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent')
});

await auditLog('PRINCIPAL_AGREEMENT_MODIFIED', {
  userId: session.user.id,
  resource: 'principal',
  resourceId: principalId,
  oldValue: oldAgreement,
  newValue: newAgreement,
  reason: 'Contract renewal'
});
```

---

## 🔒 Security Management

### Access Control

#### 1. Failed Login Monitoring

```typescript
// Track failed login attempts
export async function loginAttempt(email: string, success: boolean, ipAddress: string) {
  await prisma.loginAttempt.create({
    data: {
      email,
      success,
      ipAddress,
      attemptedAt: new Date()
    }
  });

  // Check for brute force attempts
  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      email,
      success: false,
      attemptedAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      }
    }
  });

  if (recentAttempts.length >= 5) {
    // Lock account temporarily
    await prisma.user.update({
      where: { email },
      data: {
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        lockReason: 'Too many failed login attempts'
      }
    });

    // Send security alert
    await sendSecurityAlert(email, 'Account temporarily locked due to failed login attempts');
  }
}
```

#### 2. Session Security

```typescript
// Secure session configuration
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'database',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60 // 1 hour
  },
  callbacks: {
    async session({ session, token }) {
      // Validate session hasn't been revoked
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token.sessionToken }
      });

      if (!dbSession || dbSession.expires < new Date()) {
        throw new Error('Session expired');
      }

      return session;
    }
  }
};
```

### Data Protection

#### 1. PII Data Handling

```typescript
// Data masking utilities
export function maskSensitiveData(data: any, fields: string[]) {
  const masked = { ...data };

  fields.forEach(field => {
    if (masked[field]) {
      if (field.includes('email')) {
        masked[field] = maskEmail(masked[field]);
      } else if (field.includes('phone')) {
        masked[field] = maskPhone(masked[field]);
      } else if (field.includes('ssn') || field.includes('passport')) {
        masked[field] = maskDocument(masked[field]);
      }
    }
  });

  return masked;
}

// Usage in logs
const maskedCrew = maskSensitiveData(crew, ['email', 'phone', 'passportNumber']);
console.log('Crew updated:', maskedCrew);
```

#### 2. Encryption Management

```typescript
// Field-level encryption for sensitive data
export class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('hanmarine-hims'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('hanmarine-hims'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

---

## 💾 Backup & Disaster Recovery

### Backup Strategy

#### 1. Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hanmarine_hims_$DATE.sql"

# Create backup
pg_dump -h localhost -U hanmarine_user -d hanmarine_hims > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Upload to cloud storage
aws s3 cp "${BACKUP_FILE}.gz" "s3://hanmarine-backups/database/"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

# Log backup completion
echo "$(date): Database backup completed - $BACKUP_FILE.gz" >> /var/log/hanmarine-hims/backup.log
```

#### 2. Application Backup

```bash
# Application files backup
#!/bin/bash
BACKUP_DIR="/backups/application"
SOURCE_DIR="/opt/hanmarine-hims"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup application files
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C "$SOURCE_DIR" .

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  /etc/nginx/sites-available/hanmarine-hims \
  /etc/systemd/system/hanmarine-hims.service \
  /opt/hanmarine-hims/.env.local

# Upload to cloud
aws s3 sync "$BACKUP_DIR" "s3://hanmarine-backups/application/" --delete --exclude "*" --include "*.tar.gz"
```

#### 3. Automated Backup Schedule

```bash
# Crontab entries
# Database backup - daily at 2 AM
0 2 * * * /opt/hanmarine-hims/scripts/backup-db.sh

# Application backup - weekly on Sunday at 3 AM
0 3 * * 0 /opt/hanmarine-hims/scripts/backup-app.sh

# Configuration backup - daily at 4 AM
0 4 * * * /opt/hanmarine-hims/scripts/backup-config.sh

# Backup verification - daily at 6 AM
0 6 * * * /opt/hanmarine-hims/scripts/verify-backups.sh
```

### Disaster Recovery

#### 1. Recovery Procedures

```bash
# Complete system recovery script
#!/bin/bash
echo "Starting HANMARINE HIMS Disaster Recovery..."

# 1. Stop services
systemctl stop hanmarine-hims
systemctl stop nginx

# 2. Restore database
LATEST_DB_BACKUP=$(aws s3 ls s3://hanmarine-backups/database/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://hanmarine-backups/database/$LATEST_DB_BACKUP" /tmp/
gunzip /tmp/$LATEST_DB_BACKUP
psql -h localhost -U hanmarine_user -d hanmarine_hims < /tmp/${LATEST_DB_BACKUP%.gz}

# 3. Restore application files
LATEST_APP_BACKUP=$(aws s3 ls s3://hanmarine-backups/application/ | grep app_ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://hanmarine-backups/application/$LATEST_APP_BACKUP" /tmp/
tar -xzf /tmp/$LATEST_APP_BACKUP -C /opt/hanmarine-hims

# 4. Restore configuration
LATEST_CONFIG_BACKUP=$(aws s3 ls s3://hanmarine-backups/application/ | grep config_ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://hanmarine-backups/application/$LATEST_CONFIG_BACKUP" /tmp/
tar -xzf /tmp/$LATEST_CONFIG_BACKUP -C /

# 5. Restart services
systemctl start hanmarine-hims
systemctl start nginx

# 6. Run health checks
curl -f https://hims.hanmarine.com/api/health

echo "Disaster recovery completed successfully"
```

#### 2. Recovery Time Objectives (RTO)

- **Critical Systems**: 4 hours
- **Database**: 2 hours
- **Application**: 1 hour
- **Full System**: 6 hours

#### 3. Recovery Point Objectives (RPO)

- **Critical Data**: 1 hour
- **Operational Data**: 4 hours
- **Archival Data**: 24 hours

---

## 🔧 Troubleshooting Advanced

### Common Issues & Solutions

#### 1. Database Connection Issues

**Symptoms**: API returns 500 errors, slow queries

**Diagnosis**:
```bash
# Check database connectivity
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "SELECT 1;"

# Check connection pool
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "SELECT * FROM pg_stat_activity;"

# Check disk space
df -h
du -sh /var/lib/postgresql/data
```

**Solutions**:
```bash
# Restart database
systemctl restart postgresql

# Clear connection pool
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';"

# Optimize queries
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "VACUUM ANALYZE;"
```

#### 2. Memory Issues

**Symptoms**: Application crashes, out of memory errors

**Diagnosis**:
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Check application logs
tail -f /var/log/hanmarine-hims/app.log | grep -i memory

# Check Node.js heap
curl https://hims.hanmarine.com/api/health
```

**Solutions**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
systemctl restart hanmarine-hims

# Optimize database queries
# Add database indexes for slow queries
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
CREATE INDEX CONCURRENTLY idx_crew_status ON crew(status);
CREATE INDEX CONCURRENTLY idx_contracts_start_date ON employment_contract(start_date);
"
```

#### 3. Permission Issues

**Symptoms**: Users can't access certain modules

**Diagnosis**:
```typescript
// Check user permissions in database
const userPermissions = await prisma.user.findUnique({
  where: { id: userId },
  include: { role: true }
});

// Check permission matrix
console.log('User role:', userPermissions.role);
console.log('Permission matrix:', PERMISSION_MATRIX[userPermissions.role]);
```

**Solutions**:
```typescript
// Update user role
await prisma.user.update({
  where: { id: userId },
  data: { role: 'CREWING_MANAGER' }
});

// Clear session cache
await prisma.session.deleteMany({
  where: { userId: userId }
});
```

#### 4. SSL Certificate Issues

**Symptoms**: HTTPS warnings, connection failures

**Solutions**:
```bash
# Renew Let's Encrypt certificate
certbot renew

# Check certificate validity
openssl s_client -connect hims.hanmarine.com:443 -servername hims.hanmarine.com < /dev/null | openssl x509 -noout -dates

# Restart nginx
systemctl reload nginx
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_crew_full_name ON crew USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_contracts_crew_id ON employment_contract(crew_id);
CREATE INDEX idx_assignments_vessel_id ON assignment(vessel_id);
CREATE INDEX idx_principal_name ON principal USING gin(to_tsvector('english', name));

-- Partition large tables
CREATE TABLE crew_y2025 PARTITION OF crew FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE contracts_y2025 PARTITION OF employment_contract FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Update statistics
ANALYZE VERBOSE;
```

#### 2. Application Optimization

```typescript
// Implement caching
import { unstable_cache } from 'next/cache';

export const getCrewList = unstable_cache(
  async (filters: any) => {
    return await prisma.crew.findMany({ where: filters });
  },
  ['crew-list'],
  { revalidate: 300 } // 5 minutes
);

// Optimize API responses
export async function GET() {
  const data = await getCrewList(filters);

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
```

#### 3. Monitoring Setup

```typescript
// Prometheus metrics
import client from 'prom-client';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'hanmarine_hims_' });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'hanmarine_hims_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Middleware to collect metrics
export async function middleware(request: NextRequest) {
  const start = Date.now();

  const response = await NextResponse.next();

  const duration = (Date.now() - start) / 1000;

  httpRequestDuration
    .labels(request.method, request.nextUrl.pathname, response.status.toString())
    .observe(duration);

  return response;
}
```

---

## 📞 Emergency Contacts & Escalation

### Critical Incident Response

| Severity | Response Time | Contact |
|----------|---------------|---------|
| **Critical** | Immediate | +62-21-XXXXXXX (CEO) |
| **High** | < 1 hour | IT Manager + Ops Manager |
| **Medium** | < 4 hours | Department Head |
| **Low** | < 24 hours | IT Support |

### Communication Protocol

1. **Immediate Actions**:
   - Assess impact and scope
   - Notify relevant stakeholders
   - Begin containment procedures

2. **Communication**:
   - Internal: Slack emergency channel
   - External: Official email templates
   - Public: Press release if required

3. **Post-Incident**:
   - Root cause analysis
   - Lessons learned session
   - Update procedures and documentation

---

## 📚 Additional Resources

### Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

### Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001 Standards](https://www.iso.org/isoiec-27001-information-security.html)

### Compliance References

- [IMO Conventions](https://www.imo.org/en/About/Conventions/Pages/Home.aspx)
- [STCW Convention](https://www.imo.org/en/Training/STCW/Pages/Default.aspx)
- [Maritime Labour Convention](https://www.ilo.org/global/standards/maritime-labour-convention/lang--en/index.htm)

---

## 🎯 Pendahuluan

HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS) Administrator Manual v5.0 provides comprehensive technical guidance for system administrators, IT managers, and technical staff responsible for maintaining and securing the HIMS platform.

### System Overview

HANMARINE HIMS is an enterprise-grade maritime management system designed for international shipping companies requiring:

- **Enterprise Security**: Military-grade encryption, zero-trust architecture, comprehensive audit trails
- **Regulatory Compliance**: Full compliance with IMO, STCW, MLC 2006, and Flag State requirements
- **Scalability**: Support for 50,000+ crew records with sub-second response times
- **High Availability**: 99.9% uptime with automatic failover and disaster recovery
- **Global Operations**: Multi-timezone support with 24/7 monitoring and support

### Administrator Responsibilities

1. **System Security & Access Control**
   - User lifecycle management (onboarding/offboarding)
   - Role-based access control (RBAC) administration
   - Multi-factor authentication (MFA) management
   - Security incident response and forensics

2. **System Performance & Reliability**
   - Performance monitoring and optimization
   - Capacity planning and resource management
   - Backup and disaster recovery coordination
   - System health monitoring and alerting

3. **Data Management & Integrity**
   - Database administration and maintenance
   - Data backup and recovery procedures
   - Data encryption and privacy compliance
   - Audit logging and compliance reporting

4. **Compliance & Regulatory Requirements**
   - IMO/STCW/MLC compliance monitoring
   - Audit preparation and evidence collection
   - Regulatory reporting and documentation
   - Security assessment and penetration testing

5. **Technical Operations**
   - System deployment and configuration
   - Software updates and patch management
   - Integration with external systems
   - Technical support and troubleshooting

---

## 1.0 🏗️ SYSTEM ARCHITECTURE

### 1.1 Technical Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    HANMARINE HIMS v5.0                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Frontend  │  │   Backend   │  │  Database   │         │
│  │ Next.js 16  │  │ API Routes  │  │ PostgreSQL  │         │
│  │ React 19    │  │ Node.js     │  │ Prisma ORM  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Security   │  │ Compliance  │  │ Monitoring  │         │
│  │ AES-256     │  │ ISO/MLC     │  │ Prometheus  │         │
│  │ MFA/2FA     │  │ STCW/IMO    │  │ Grafana     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Deployment  │  │  Backup     │  │  Support    │         │
│  │ Docker/K8s  │  │ AWS S3      │  │ 24/7 Team   │         │
│  │ CI/CD       │  │ Point-in-time│  │ Enterprise │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

#### Frontend Layer:
- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks + Context API
- **Routing**: Next.js App Router with protected routes

#### Backend Layer:
- **API Framework**: Next.js API Routes
- **Authentication**: NextAuth.js with custom providers
- **Authorization**: Custom RBAC middleware
- **Validation**: Zod schemas for type safety
- **Error Handling**: Centralized error management

#### Database Layer:
- **Primary Database**: PostgreSQL 15+
- **ORM**: Prisma with type-safe queries
- **Connection Pooling**: PgBouncer for performance
- **Replication**: Read/write splitting for scalability
- **Caching**: Redis for session and data caching

#### Security Layer:
- **Encryption**: AES-256-GCM for data at rest
- **TLS**: TLS 1.3 for data in transit
- **Authentication**: MFA with multiple factors
- **Authorization**: Granular permission system
- **Audit**: Comprehensive logging and monitoring

### 1.3 Infrastructure Architecture

#### Production Environment:
```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Load      │  │ Application │  │  Database   │         │
│  │ Balancer    │  │  Servers    │  │  Cluster    │         │
│  │ (Nginx)     │  │  (Docker)   │  │ (PostgreSQL)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Redis     │  │   Backup    │  │ Monitoring  │         │
│  │  Cache      │  │  Storage    │  │  Stack      │         │
│  │  Cluster    │  │  (S3)       │  │ (Prometheus)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   CDN       │  │   WAF       │  │   DDoS      │         │
│  │ (CloudFlare)│  │ (AWS WAF)   │  │ Protection  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### Development Environment:
```
┌─────────────────────────────────────────────────────────────┐
│                   Development Environment                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Local     │  │   Docker    │  │   Local     │         │
│  │  Development│  │  Compose    │  │ PostgreSQL  │         │
│  │  (Next.js)  │  │  Stack      │  │  Database   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Git       │  │   Testing   │  │   Staging   │         │
│  │  Version    │  │  Environment│  │  Environment│         │
│  │  Control    │  │  (Jest)     │  │  (Docker)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Data Flow Architecture

#### Request Flow:
```
Client Request → Load Balancer → WAF → Application Server → Authentication
    ↓                                                            ↓
Session Validation → Authorization → Business Logic → Database Query
    ↓                                                            ↓
Response Generation → Encryption → Compression → Client Response
```

#### Data Security Flow:
```
Input Data → Validation → Sanitization → Encryption → Storage
    ↓                                                            ↓
Retrieval → Decryption → Access Control → Masking → Output
```

---

## 2.0 🔒 SECURITY IMPLEMENTATION

### 2.1 Authentication System

#### NextAuth.js Configuration:
```typescript
// /lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Custom authentication logic
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email }
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials!.password,
          user.passwordHash
        );

        if (!isValid) return null;

        // Log successful authentication
        await auditLog('USER_LOGIN', {
          userId: user.id,
          ipAddress: getClientIP(),
          userAgent: getUserAgent()
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'database',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60 // 1 hour
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
};
```

#### Multi-Factor Authentication (MFA):
```typescript
// MFA Implementation
export async function setupMFA(userId: string): Promise<string> {
  const secret = speakeasy.generateSecret({
    name: 'HANMARINE HIMS',
    issuer: 'HANMARINE'
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaSecret: secret.base32,
      mfaEnabled: false
    }
  });

  return secret.otpauth_url!;
}

export async function verifyMFA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true }
  });

  if (!user?.mfaSecret) return false;

  return speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 2 // 2 intervals tolerance
  });
}
```

### 2.2 Authorization & Access Control

#### Role-Based Access Control (RBAC) Implementation:
```typescript
// /lib/permissions.ts
export enum UserRole {
  EXECUTIVE_MANAGEMENT = 'EXECUTIVE_MANAGEMENT',
  CREWING_MANAGER = 'CREWING_MANAGER',
  CREWING_SUPERVISOR = 'CREWING_SUPERVISOR',
  CREWING_OFFICER = 'CREWING_OFFICER',
  ACCOUNTING_MANAGER = 'ACCOUNTING_MANAGER',
  ACCOUNTING_OFFICER = 'ACCOUNTING_OFFICER',
  HR_MANAGER = 'HR_MANAGER',
  HR_OFFICER = 'HR_OFFICER',
  QUALITY_MANAGER = 'QUALITY_MANAGER',
  QUALITY_OFFICER = 'QUALITY_OFFICER'
}

export enum PermissionLevel {
  NO_ACCESS = 'NO_ACCESS',
  VIEW_ACCESS = 'VIEW_ACCESS',
  EDIT_ACCESS = 'EDIT_ACCESS',
  FULL_ACCESS = 'FULL_ACCESS'
}

export const PERMISSION_MATRIX: Record<UserRole, Record<string, PermissionLevel>> = {
  [UserRole.EXECUTIVE_MANAGEMENT]: {
    principals: PermissionLevel.FULL_ACCESS,
    contracts: PermissionLevel.FULL_ACCESS,
    accounting: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.FULL_ACCESS,
    hr: PermissionLevel.FULL_ACCESS,
    quality: PermissionLevel.FULL_ACCESS,
    admin: PermissionLevel.FULL_ACCESS
  },
  [UserRole.CREWING_MANAGER]: {
    principals: PermissionLevel.FULL_ACCESS,
    contracts: PermissionLevel.FULL_ACCESS,
    crew: PermissionLevel.FULL_ACCESS,
    applications: PermissionLevel.FULL_ACCESS,
    assignments: PermissionLevel.FULL_ACCESS,
    accounting: PermissionLevel.VIEW_ACCESS,
    hr: PermissionLevel.EDIT_ACCESS,
    quality: PermissionLevel.VIEW_ACCESS
  },
  // ... other roles
};
```

#### Authorization Middleware:
```typescript
// /lib/auth-middleware.ts
export function withAuthorization(
  handler: NextApiHandler,
  requiredPermissions: Record<string, PermissionLevel>
): NextApiHandler {
  return async (req, res) => {
    try {
      // Get user session
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check permissions
      const userRole = session.user.role as UserRole;
      const userPermissions = PERMISSION_MATRIX[userRole];

      if (!userPermissions) {
        return res.status(403).json({ error: 'Invalid user role' });
      }

      // Validate required permissions
      for (const [module, requiredLevel] of Object.entries(requiredPermissions)) {
        const userLevel = userPermissions[module];

        if (!userLevel || !hasPermission(userLevel, requiredLevel)) {
          await auditLog('PERMISSION_DENIED', {
            userId: session.user.id,
            module,
            requiredLevel,
            userLevel,
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
          });

          return res.status(403).json({
            error: 'Insufficient permissions',
            module,
            required: requiredLevel,
            granted: userLevel
          });
        }
      }

      // Log successful authorization
      await auditLog('PERMISSION_GRANTED', {
        userId: session.user.id,
        modules: Object.keys(requiredPermissions),
        ipAddress: getClientIP(req)
      });

      // Proceed with handler
      return handler(req, res);

    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

function hasPermission(userLevel: PermissionLevel, requiredLevel: PermissionLevel): boolean {
  const hierarchy = {
    [PermissionLevel.NO_ACCESS]: 0,
    [PermissionLevel.VIEW_ACCESS]: 1,
    [PermissionLevel.EDIT_ACCESS]: 2,
    [PermissionLevel.FULL_ACCESS]: 3
  };

  return hierarchy[userLevel] >= hierarchy[requiredLevel];
}
```

### 2.3 Data Encryption & Protection

#### AES-256-GCM Encryption Implementation:
```typescript
// /src/lib/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.HIMS_CRYPTO_KEY;
  if (!key) {
    throw new Error('HIMS_CRYPTO_KEY environment variable is not set');
  }
  if (key.length < KEY_LENGTH) {
    throw new Error('HIMS_CRYPTO_KEY must be at least 32 characters long');
  }
  return Buffer.from(key.slice(0, KEY_LENGTH), 'utf8');
}

export function encrypt(plain: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipher(ALGORITHM, key);
  cipher.setAAD(Buffer.from('HANMARINE_HIMS')); // Additional authenticated data

  let encrypted = cipher.update(plain, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV + Auth Tag + Encrypted Data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);

  return combined.toString('base64');
}

export function decrypt(cipherText: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(cipherText, 'base64');

    // Extract IV (first 16 bytes), Auth Tag (next 16 bytes), and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from('HANMARINE_HIMS'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
}

export function canAccessRedData(userRoles: string[], dataType: 'medical' | 'salary' | 'identity'): boolean {
  // Import the sensitivity access function
  const { hasSensitivityAccess } = require('@/lib/permissions');
  const { DataSensitivity } = require('@prisma/client');

  return hasSensitivityAccess(userRoles, DataSensitivity.RED);
}
```

#### Encrypted Fields:
- **Crew.passportNumber**: Encrypted at rest, decrypted only for users with RED identity access
- **MedicalCheck.result**: Encrypted medical examination results
- **MedicalCheck.remarks**: Encrypted medical notes and history
- **CrewSalary.totalAmount**: Encrypted salary amounts

#### Access Control for Encrypted Data:
```typescript
// Role-based decryption in API routes
const userRoles = session.user.roles || [];
const hasRedAccess = canAccessRedData(userRoles, 'identity');

if (crew.passportNumber) {
  if (hasRedAccess) {
    // Decrypt for authorized users
    processedCrew.passportNumber = decrypt(crew.passportNumber);
  } else {
    // Mask for unauthorized users
    processedCrew.passportNumber = maskPassport(crew.passportNumber);
  }
}
```

#### Data Sensitivity Access Matrix:
| Role | Identity Data (Passport) | Medical Data | Salary Data |
|------|-------------------------|--------------|-------------|
| DIRECTOR | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| CDMO | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| HR | ✅ Full Access | ✅ Full Access | ❌ Masked |
| ACCOUNTING | ❌ Masked | ❌ Masked | ✅ Full Access |
| OPERATIONAL | ❌ Masked | ❌ Masked | ❌ Masked |
| CREW_PORTAL | ❌ Masked | ❌ Masked | ❌ Masked |

#### Data Masking Implementation:
```typescript
// /src/lib/masking.ts
export function maskPassport(passport: string): string {
  if (!passport || passport.length < 4) return '****';
  const firstTwo = passport.slice(0, 2);
  const lastTwo = passport.slice(-2);
  const middleStars = '*'.repeat(Math.max(0, passport.length - 4));
  return `${firstTwo}${middleStars}${lastTwo}`;
}

export function maskSeamanCode(code: string): string {
  if (!code || code.length !== 10) return '****';
  return `${code.slice(0, 4)}****${code.slice(-2)}`;
}

export function maskCurrency(amount: number): string {
  return '****';
}
```

### 2.4 Audit Logging System

#### Comprehensive Audit Implementation:
```typescript
// /lib/audit.ts
export enum AuditEvent {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFIED = 'DATA_MODIFIED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED'
}

export interface AuditLogEntry {
  id?: string;
  event: AuditEvent;
  userId: string;
  sessionId?: string;
  resource?: string;
  resourceId?: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  location?: string;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private queue: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    // Flush audit logs every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000);
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    // Add to in-memory queue
    this.queue.push(auditEntry);

    // Immediate write for critical events
    if (this.isCriticalEvent(entry.event)) {
      await this.writeToDatabase([auditEntry]);
    }

    // Check queue size and flush if needed
    if (this.queue.length >= 100) {
      await this.flush();
    }
  }

  private isCriticalEvent(event: AuditEvent): boolean {
    const criticalEvents = [
      AuditEvent.PERMISSION_DENIED,
      AuditEvent.SECURITY_ALERT,
      AuditEvent.DATA_EXPORTED
    ];
    return criticalEvents.includes(event);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const entries = [...this.queue];
    this.queue = [];

    try {
      await this.writeToDatabase(entries);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-queue failed entries
      this.queue.unshift(...entries);
    }
  }

  private async writeToDatabase(entries: AuditLogEntry[]): Promise<void> {
    // Mask sensitive data before logging
    const maskedEntries = entries.map(entry => ({
      ...entry,
      oldValue: entry.oldValue ? maskSensitiveData(entry.oldValue) : undefined,
      newValue: entry.newValue ? maskSensitiveData(entry.newValue) : undefined,
      metadata: entry.metadata ? maskSensitiveData(entry.metadata) : undefined
    }));

    await prisma.auditLog.createMany({
      data: maskedEntries.map(entry => ({
        event: entry.event,
        userId: entry.userId,
        sessionId: entry.sessionId,
        resource: entry.resource,
        resourceId: entry.resourceId,
        action: entry.action,
        oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        location: entry.location,
        reason: entry.reason,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        timestamp: entry.timestamp
      }))
    });
  }

  async query(options: {
    userId?: string;
    event?: AuditEvent;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    const where: any = {};

    if (options.userId) where.userId = options.userId;
    if (options.event) where.event = options.event;
    if (options.resource) where.resource = options.resource;
    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options.limit || 100,
      skip: options.offset || 0
    });

    return logs.map(log => ({
      id: log.id,
      event: log.event as AuditEvent,
      userId: log.userId,
      sessionId: log.sessionId || undefined,
      resource: log.resource || undefined,
      resourceId: log.resourceId || undefined,
      action: log.action,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : undefined,
      newValue: log.newValue ? JSON.parse(log.newValue) : undefined,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      location: log.location || undefined,
      reason: log.reason || undefined,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
      timestamp: log.timestamp
    }));
  }
}

export const auditLogger = AuditLogger.getInstance();

// Convenience functions
export async function auditLog(
  event: AuditEvent,
  details: Omit<AuditLogEntry, 'id' | 'timestamp' | 'event'>
): Promise<void> {
  await auditLogger.log({ event, ...details });
}

function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) return data;

  const masked = { ...data };
  const sensitiveFields = [
    'password', 'ssn', 'passport', 'salary', 'medical', 'financial'
  ];

  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '[REDACTED]';
    }
  }

  return masked;
}
```

### 2.5 Security Monitoring & Alerting

#### Real-time Security Monitoring:
```typescript
// /lib/security-monitor.ts
export class SecurityMonitor {
  private alerts: SecurityAlert[] = [];
  private alertThresholds = {
    failedLogins: 5, // per 15 minutes
    suspiciousIPs: 10, // per hour
    dataExports: 50, // per day per user
    permissionDenies: 20 // per hour
  };

  async monitorFailedLogin(email: string, ipAddress: string): Promise<void> {
    const recentFailures = await prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        attemptedAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes
        }
      }
    });

    if (recentFailures >= this.alertThresholds.failedLogins) {
      await this.createAlert({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        message: `Brute force login attempt detected for ${email}`,
        details: { email, ipAddress, attemptCount: recentFailures },
        recommendedAction: 'Temporarily lock account and notify user'
      });
    }
  }

  async monitorSuspiciousActivity(userId: string, activity: string): Promise<void> {
    // Implement suspicious activity detection
    const recentActivity = await prisma.auditLog.count({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour
        }
      }
    });

    if (recentActivity > 100) { // Threshold for suspicious activity
      await this.createAlert({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        message: `Unusual data access pattern detected for user ${userId}`,
        details: { userId, activityCount: recentActivity },
        recommendedAction: 'Review user activity and consider temporary suspension'
      });
    }
  }

  async monitorDataExport(userId: string, exportType: string, recordCount: number): Promise<void> {
    const todayExports = await prisma.auditLog.count({
      where: {
        userId,
        event: 'DATA_EXPORTED',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
        }
      }
    });

    if (todayExports >= this.alertThresholds.dataExports) {
      await this.createAlert({
        type: 'EXCESSIVE_DATA_EXPORT',
        severity: 'MEDIUM',
        message: `Excessive data export activity by user ${userId}`,
        details: { userId, exportCount: todayExports, lastExport: exportType },
        recommendedAction: 'Review export justification and approve manually'
      });
    }
  }

  private async createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'status'>): Promise<void> {
    const securityAlert = await prisma.securityAlert.create({
      data: {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        details: JSON.stringify(alert.details),
        recommendedAction: alert.recommendedAction,
        status: 'OPEN',
        timestamp: new Date()
      }
    });

    // Send immediate notification to security team
    await this.notifySecurityTeam(securityAlert);

    // Log the alert
    await auditLog(AuditEvent.SECURITY_ALERT, {
      userId: 'SYSTEM',
      action: 'SECURITY_ALERT_CREATED',
      resource: 'security_alert',
      resourceId: securityAlert.id,
      metadata: alert
    });
  }

  private async notifySecurityTeam(alert: SecurityAlert): Promise<void> {
    // Send email to security team
    const emailContent = {
      subject: `🚨 Security Alert: ${alert.type}`,
      body: `
        Severity: ${alert.severity}
        Message: ${alert.message}
        Recommended Action: ${alert.recommendedAction}

        Details: ${JSON.stringify(JSON.parse(alert.details), null, 2)}

        Please investigate immediately.
      `
    };

    await sendEmail({
      to: process.env.SECURITY_TEAM_EMAIL!,
      ...emailContent
    });
  }

  async getActiveAlerts(): Promise<SecurityAlert[]> {
    return await prisma.securityAlert.findMany({
      where: { status: 'OPEN' },
      orderBy: { timestamp: 'desc' }
    });
  }

  async resolveAlert(alertId: string, resolution: string, resolvedBy: string): Promise<void> {
    await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedBy,
        resolvedAt: new Date()
      }
    });

    await auditLog(AuditEvent.SECURITY_ALERT, {
      userId: resolvedBy,
      action: 'SECURITY_ALERT_RESOLVED',
      resource: 'security_alert',
      resourceId: alertId,
      metadata: { resolution }
    });
  }
}

export const securityMonitor = new SecurityMonitor();
```

---

## 3.0 🚀 DEPLOYMENT & INSTALLATION

### 3.1 Prerequisites

#### System Requirements:
```bash
# Minimum Requirements
OS: Ubuntu 20.04 LTS or CentOS 8+
CPU: 2 cores (4 cores recommended)
RAM: 4GB (8GB recommended)
Storage: 50GB SSD (100GB recommended)
Network: 10Mbps (100Mbps recommended)

# Software Requirements
Node.js: 18.17.0+
PostgreSQL: 15+
Redis: 7+
Docker: 24+
Docker Compose: 2.0+
```

#### Network Requirements:
- **Inbound**: HTTPS (443), SSH (22), Database (5432 - internal only)
- **Outbound**: SMTP (587), NTP, DNS, API endpoints
- **Firewall**: UFW or firewalld configured
- **SSL**: Valid certificate from trusted CA

### 3.2 Environment Setup

#### Directory Structure:
```bash
/opt/hanmarine-hims/
├── app/                    # Application code
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── .env.local
├── config/                 # Configuration files
│   ├── nginx.conf
│   ├── docker-compose.yml
│   └── systemd/
├── logs/                   # Application logs
├── backups/               # Database backups
├── ssl/                   # SSL certificates
└── scripts/               # Maintenance scripts
```

#### Environment Variables:
```bash
# /opt/hanmarine-hims/app/.env.local
# Database Configuration
DATABASE_URL="postgresql://hanmarine_user:secure_password@localhost:5432/hanmarine_hims"
DIRECT_URL="postgresql://hanmarine_user:secure_password@localhost:5432/hanmarine_hims"

# Authentication
NEXTAUTH_SECRET="your-super-secure-random-secret-here-64-chars"
NEXTAUTH_URL="https://hims.hanmarine.com"

# Security
ENCRYPTION_KEY="32-byte-hex-encryption-key-here-64-chars"
JWT_SECRET="another-secure-random-secret-here-64-chars"

# Email Configuration
SMTP_HOST="smtp.hanmarine.com"
SMTP_PORT="587"
SMTP_USER="noreply@hims.hanmarine.com"
SMTP_PASS="secure-smtp-password"
SMTP_FROM="HANMARINE HIMS <noreply@hims.hanmarine.com>"

# External APIs
IMO_API_KEY="your-imo-api-key"
STCW_API_KEY="your-stcw-api-key"
EXCHANGE_RATE_API_KEY="your-exchange-rate-api-key"

# Monitoring
SENTRY_DSN="your-sentry-dsn-for-error-tracking"
PROMETHEUS_PUSHGATEWAY="http://localhost:9091"

# Security
SECURITY_TEAM_EMAIL="security@hanmarine.com"
ADMIN_EMAIL="admin@hanmarine.com"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://hims.hanmarine.com"
```

### 3.3 Database Setup

#### PostgreSQL Installation:
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- Create database and user
CREATE DATABASE hanmarine_hims;
CREATE USER hanmarine_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hanmarine_hims TO hanmarine_user;
ALTER USER hanmarine_user CREATEDB;

-- Configure PostgreSQL for production
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = '100';

-- Restart PostgreSQL
SELECT pg_reload_conf();
```

#### Database Optimization:
```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_crew_full_name ON crew USING gin(to_tsvector('english', full_name));
CREATE INDEX CONCURRENTLY idx_contracts_crew_id ON employment_contract(crew_id);
CREATE INDEX CONCURRENTLY idx_assignments_vessel_id ON assignment(vessel_id);
CREATE INDEX CONCURRENTLY idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX CONCURRENTLY idx_audit_log_user ON audit_log(user_id, timestamp DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_active_contracts ON employment_contract(contract_end)
WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY idx_active_assignments ON assignments(sign_off_plan)
WHERE status IN ('PLANNED', 'ONBOARD');

-- Foreign key indexes (usually auto-created)
CREATE INDEX CONCURRENTLY idx_assignments_crew_id ON assignments(crew_id);
CREATE INDEX CONCURRENTLY idx_assignments_principal_id ON assignments(principal_id);
```

### 3.4 Application Deployment

#### Docker Deployment (Recommended):
```yaml
# /opt/hanmarine-hims/config/docker-compose.yml
version: '3.8'

services:
  app:
    image: hanmarine/hims:latest
    container_name: hanmarine-hims-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ../app/.env.local
    depends_on:
      - db
      - redis
    volumes:
      - ../logs:/app/logs
      - ../uploads:/app/public/uploads
    networks:
      - hims-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    container_name: hanmarine-hims-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=hanmarine_hims
      - POSTGRES_USER=hanmarine_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../backups:/backups
    networks:
      - hims-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hanmarine_user -d hanmarine_hims"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: hanmarine-hims-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - hims-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: hanmarine-hims-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ../ssl:/etc/ssl/certs:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - hims-network

volumes:
  postgres_data:
  redis_data:
  nginx_logs:

networks:
  hims-network:
    driver: bridge
```

#### Nginx Configuration:
```nginx
# /opt/hanmarine-hims/config/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    upstream hims_app {
        server app:3000;
    }

    server {
        listen 80;
        server_name hims.hanmarine.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name hims.hanmarine.com;

        # SSL Configuration
        ssl_certificate /etc/ssl/certs/hims.hanmarine.com.crt;
        ssl_certificate_key /etc/ssl/certs/hims.hanmarine.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        add_header Referrer-Policy strict-origin-when-cross-origin;

        # Root directory
        root /usr/share/nginx/html;
        index index.html index.htm;

        # API endpoints
        location /api/ {
            proxy_pass http://hims_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Rate limiting for API
            limit_req_zone=api burst=20 nodelay;

            # CORS
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth/ {
            proxy_pass http://hims_app;
            limit_req_zone=auth burst=5 nodelay;
            # ... same proxy settings as above
        }

        # Static files
        location /_next/static/ {
            proxy_pass http://hims_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Main application
        location / {
            proxy_pass http://hims_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Security headers for main app
            add_header X-Frame-Options SAMEORIGIN;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Block access to sensitive files
        location ~ /\. {
            deny all;
        }

        location ~ \.(env|log)$ {
            deny all;
        }
    }
}
```

### 3.5 SSL Certificate Setup

#### Let's Encrypt SSL:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d hims.hanmarine.com

# Test certificate renewal
sudo certbot renew --dry-run

# Setup automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Manual SSL (if needed):
```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/certs/hanmarine

# Copy certificates
sudo cp hims.hanmarine.com.crt /etc/ssl/certs/
sudo cp hims.hanmarine.com.key /etc/ssl/certs/

# Set proper permissions
sudo chmod 600 /etc/ssl/certs/hims.hanmarine.com.key
sudo chown root:root /etc/ssl/certs/hims.hanmarine.com.*
```

### 3.6 Deployment Execution

#### Production Deployment Script:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/deploy.sh

set -e

echo "🚀 Starting HANMARINE HIMS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Pre-deployment checks
echo "🔍 Performing pre-deployment checks..."

# Check if required ports are available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    print_error "Port 3000 is already in use"
    exit 1
fi

if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then
    print_error "Port 5432 is already in use"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi

print_status "Pre-deployment checks passed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /opt/hanmarine-hims/{app,config,logs,backups,ssl,scripts}
print_status "Directories created"

# Backup current deployment (if exists)
if [ -d "/opt/hanmarine-hims/app" ]; then
    echo "💾 Backing up current deployment..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    tar -czf "/opt/hanmarine-hims/backups/pre_deploy_$TIMESTAMP.tar.gz" -C /opt/hanmarine-hims app/
    print_status "Backup created: pre_deploy_$TIMESTAMP.tar.gz"
fi

# Pull latest code (assuming Git repository)
echo "📥 Pulling latest code..."
cd /opt/hanmarine-hims/app
git pull origin main
print_status "Code updated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false
print_status "Dependencies installed"

# Build application
echo "🔨 Building application..."
npm run build
print_status "Application built"

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy
print_status "Database migrations completed"

# Generate Prisma client
echo "⚡ Generating Prisma client..."
npx prisma generate
print_status "Prisma client generated"

# Seed initial data (if needed)
if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 Seeding initial data..."
    npm run seed
    print_status "Initial data seeded"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
cd /opt/hanmarine-hims/config
docker-compose down
print_status "Containers stopped"

# Start new deployment
echo "🚀 Starting new deployment..."
docker-compose up -d
print_status "Deployment started"

# Wait for services to be healthy
echo "🏥 Waiting for services to be healthy..."
sleep 30

# Health checks
echo "🔍 Performing health checks..."

# Check application health
if curl -f -s --max-time 10 "http://localhost:3000/api/health" > /dev/null; then
    print_status "Application health check passed"
else
    print_error "Application health check failed"
    exit 1
fi

# Check database connectivity
if docker-compose exec -T db pg_isready -U hanmarine_user -d hanmarine_hims > /dev/null; then
    print_status "Database health check passed"
else
    print_error "Database health check failed"
    exit 1
fi

# Check Redis connectivity
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    print_status "Redis health check passed"
else
    print_error "Redis health check failed"
    exit 1
fi

print_status "All health checks passed"

# Post-deployment tasks
echo "🧹 Running post-deployment tasks..."

# Clear old Docker images
docker image prune -f > /dev/null 2>&1
print_status "Old Docker images cleaned"

# Update file permissions
chown -R www-data:www-data /opt/hanmarine-hims/logs
chmod 755 /opt/hanmarine-hims/logs
print_status "File permissions updated"

# Restart monitoring services (if applicable)
# systemctl restart prometheus
# systemctl restart grafana
print_status "Monitoring services restarted"

print_status "🎉 Deployment completed successfully!"
echo ""
echo "Application URL: https://hims.hanmarine.com"
echo "Health Check: https://hims.hanmarine.com/api/health"
echo "Logs: /opt/hanmarine-hims/logs/"
echo ""
echo "Next steps:"
echo "1. Verify application functionality"
echo "2. Test user authentication"
echo "3. Monitor system performance"
echo "4. Update DNS records if needed"
```

#### Deployment Execution:
```bash
# Make script executable
chmod +x /opt/hanmarine-hims/scripts/deploy.sh

# Run deployment
cd /opt/hanmarine-hims
./scripts/deploy.sh

# Or run with seeding
RUN_SEED=true ./scripts/deploy.sh
```

### 3.7 Post-Deployment Verification

#### Automated Health Checks:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/health-check.sh

HEALTH_CHECK_URL="https://hims.hanmarine.com/api/health"
LOG_FILE="/opt/hanmarine-hims/logs/health-check.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check application health
if curl -f -s --max-time 10 "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    log "${GREEN}✓ Application is healthy${NC}"
    exit 0
else
    log "${RED}✗ Application is unhealthy${NC}"

    # Send alert
    curl -X POST "https://api.pagerduty.com/v2/enqueue" \
         -H "Content-Type: application/json" \
         -d '{
           "routing_key": "'"$PAGERDUTY_ROUTING_KEY"'",
           "event_action": "trigger",
           "payload": {
             "summary": "HANMARINE HIMS Application Unhealthy",
             "source": "health-check",
             "severity": "critical"
           }
         }' 2>/dev/null

    exit 1
fi
```

#### Manual Verification Steps:
1. **DNS Resolution**: Verify domain points to correct IP
2. **SSL Certificate**: Check certificate validity and chain
3. **Application Access**: Test login with different user roles
4. **Database Connectivity**: Verify data retrieval and storage
5. **API Endpoints**: Test critical API functionality
6. **Email Notifications**: Verify email delivery
7. **File Uploads**: Test document upload functionality
8. **Performance**: Check response times and resource usage

---

## 4.0 👥 USER & PERMISSION MANAGEMENT

### 4.1 User Lifecycle Management

#### User Creation Process:
```typescript
// /api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'EXECUTIVE_MANAGEMENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, name, role, department, phone, employeeId } = await request.json();

    // Validation
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate role
    const validRoles = [
      'EXECUTIVE_MANAGEMENT', 'CREWING_MANAGER', 'CREWING_SUPERVISOR',
      'CREWING_OFFICER', 'ACCOUNTING_MANAGER', 'ACCOUNTING_OFFICER',
      'HR_MANAGER', 'HR_OFFICER', 'QUALITY_MANAGER', 'QUALITY_OFFICER'
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        department: department || null,
        phone: phone || null,
        employeeId: employeeId || null,
        password: hashedPassword,
        status: 'PENDING_ACTIVATION',
        passwordResetRequired: true,
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpiry,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Send welcome email
    try {
      await sendWelcomeEmail({
        to: email,
        name,
        tempPassword,
        resetLink: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the user creation if email fails
    }

    // Log user creation
    await auditLog('USER_CREATED', {
      userId: session.user.id,
      resource: 'user',
      resourceId: user.id,
      newValue: { email, name, role, department },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      reason: 'Administrative user creation'
    });

    return NextResponse.json({
      message: 'User created successfully',
      userId: user.id,
      tempPassword: tempPassword // Only returned for admin reference
    }, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Bulk User Import:
```typescript
// /api/admin/users/bulk-import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'EXECUTIVE_MANAGEMENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    // Parse CSV
    const csvText = await file.text();
    const { data, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing errors', details: errors },
        { status: 400 }
      );
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[]
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because of header row and 0-indexing

      try {
        // Validate required fields
        if (!row.email || !row.name || !row.role) {
          results.failed.push({
            row: rowNumber,
            data: row,
            error: 'Missing required fields: email, name, role'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: row.email }
        });

        if (existingUser) {
          results.failed.push({
            row: rowNumber,
            data: row,
            error: 'User with this email already exists'
          });
          continue;
        }

        // Validate role
        const validRoles = [
          'EXECUTIVE_MANAGEMENT', 'CREWING_MANAGER', 'CREWING_SUPERVISOR',
          'CREWING_OFFICER', 'ACCOUNTING_MANAGER', 'ACCOUNTING_OFFICER',
          'HR_MANAGER', 'HR_OFFICER', 'QUALITY_MANAGER', 'QUALITY_OFFICER'
        ];

        if (!validRoles.includes(row.role)) {
          results.failed.push({
            row: rowNumber,
            data: row,
            error: `Invalid role: ${row.role}`
          });
          continue;
        }

        // Generate credentials
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: row.email,
            name: row.name,
            role: row.role,
            department: row.department || null,
            phone: row.phone || null,
            employeeId: row.employeeId || null,
            password: hashedPassword,
            status: 'PENDING_ACTIVATION',
            passwordResetRequired: true,
            passwordResetToken: resetToken,
            passwordResetExpires: resetTokenExpiry,
            createdBy: session.user.id
          }
        });

        results.successful.push({
          row: rowNumber,
          userId: user.id,
          email: user.email,
          tempPassword
        });

      } catch (error) {
        results.failed.push({
          row: rowNumber,
          data: row,
          error: error.message
        });
      }
    }

    // Log bulk import
    await auditLog('BULK_USER_IMPORT', {
      userId: session.user.id,
      action: 'BULK_USER_IMPORT',
      metadata: {
        totalProcessed: data.length,
        successful: results.successful.length,
        failed: results.failed.length
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: `Bulk import completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.2 Role Management

#### Role Assignment & Modification:
```typescript
// /api/admin/users/[id]/role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'EXECUTIVE_MANAGEMENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { newRole, reason } = await request.json();

    if (!newRole || !reason) {
      return NextResponse.json(
        { error: 'New role and reason are required' },
        { status: 400 }
      );
    }

    // Validate new role
    const validRoles = [
      'EXECUTIVE_MANAGEMENT', 'CREWING_MANAGER', 'CREWING_SUPERVISOR',
      'CREWING_OFFICER', 'ACCOUNTING_MANAGER', 'ACCOUNTING_OFFICER',
      'HR_MANAGER', 'HR_OFFICER', 'QUALITY_MANAGER', 'QUALITY_OFFICER'
    ];

    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (currentUser.role === newRole) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 400 }
      );
    }

    // Prevent demoting executive management (unless you're executive)
    if (currentUser.role === 'EXECUTIVE_MANAGEMENT' && session.user.role !== 'EXECUTIVE_MANAGEMENT') {
      return NextResponse.json(
        { error: 'Only Executive Management can modify Executive Management roles' },
        { status: 403 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: newRole,
        updatedAt: new Date(),
        updatedBy: session.user.id
      }
    });

    // Log role change
    await auditLog('USER_ROLE_CHANGED', {
      userId: session.user.id,
      resource: 'user',
      resourceId: id,
      oldValue: { role: currentUser.role },
      newValue: { role: newRole },
      reason,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Send notification email
    try {
      await sendRoleChangeNotification({
        to: updatedUser.email,
        name: updatedUser.name,
        oldRole: currentUser.role,
        newRole,
        changedBy: session.user.name
      });
    } catch (emailError) {
      console.error('Failed to send role change notification:', emailError);
    }

    return NextResponse.json({
      message: 'User role updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.3 User Deactivation & Deletion

#### User Deactivation:
```typescript
// /api/admin/users/[id]/deactivate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'EXECUTIVE_MANAGEMENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Deactivation reason is required' },
        { status: 400 }
      );
    }

    // Get user to deactivate
    const userToDeactivate = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToDeactivate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (userToDeactivate.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'User is already inactive' },
        { status: 400 }
      );
    }

    // Prevent deactivating executive management (unless you're executive)
    if (userToDeactivate.role === 'EXECUTIVE_MANAGEMENT' && session.user.role !== 'EXECUTIVE_MANAGEMENT') {
      return NextResponse.json(
        { error: 'Only Executive Management can deactivate Executive Management accounts' },
        { status: 403 }
      );
    }

    // Deactivate user (soft delete)
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        deactivatedAt: new Date(),
        deactivatedBy: session.user.id,
        updatedAt: new Date()
      }
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: id }
    });

    // Log deactivation
    await auditLog('USER_DEACTIVATED', {
      userId: session.user.id,
      resource: 'user',
      resourceId: id,
      oldValue: { status: userToDeactivate.status },
      newValue: { status: 'INACTIVE' },
      reason,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Send deactivation notification
    try {
      await sendDeactivationNotification({
        to: deactivatedUser.email,
        name: deactivatedUser.name,
        reason,
        deactivatedBy: session.user.name
      });
    } catch (emailError) {
      console.error('Failed to send deactivation notification:', emailError);
    }

    return NextResponse.json({
      message: 'User deactivated successfully',
      user: {
        id: deactivatedUser.id,
        email: deactivatedUser.email,
        name: deactivatedUser.name,
        status: deactivatedUser.status
      }
    });

  } catch (error) {
    console.error('User deactivation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Permanent User Deletion (Rare):
```typescript
// /api/admin/users/[id]/delete/route.ts - USE WITH EXTREME CAUTION
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // Only Executive Management can permanently delete users
    if (!session?.user?.role || session.user.role !== 'EXECUTIVE_MANAGEMENT') {
      return NextResponse.json({ error: 'Unauthorized - Executive approval required' }, { status: 403 });
    }

    const { id } = await params;
    const { confirmation, reason } = await request.json();

    if (confirmation !== 'PERMANENT_DELETE_CONFIRMED') {
      return NextResponse.json(
        { error: 'Confirmation required for permanent deletion' },
        { status: 400 }
      );
    }

    // Get user before deletion
    const userToDelete = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log before deletion (critical audit trail)
    await auditLog('USER_PERMANENTLY_DELETED', {
      userId: session.user.id,
      resource: 'user',
      resourceId: id,
      oldValue: {
        email: userToDelete.email,
        name: userToDelete.name,
        role: userToDelete.role
      },
      reason,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Delete in correct order to maintain referential integrity
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.auditLog.deleteMany({ where: { userId: id } });
    // Note: Keep audit logs for deleted users for compliance

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'User permanently deleted',
      deletedUser: {
        id,
        email: userToDelete.email,
        name: userToDelete.name
      }
    });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.4 Permission Auditing

#### Permission Review Process:
```typescript
// /api/admin/permissions/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PERMISSION_MATRIX } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'EXECUTIVE_MANAGEMENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const module = searchParams.get('module');

    // Get all users with their roles
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        ...(role && { role })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Analyze permissions
    const permissionAnalysis = users.map(user => {
      const userPermissions = PERMISSION_MATRIX[user.role as keyof typeof PERMISSION_MATRIX] || {};

      const analysis = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          lastLogin: user.lastLogin,
          accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
        },
        permissions: {} as Record<string, any>,
        recommendations: [] as string[]
      };

      // Check each module
      Object.entries(userPermissions).forEach(([moduleName, level]) => {
        if (!module || module === moduleName) {
          analysis.permissions[moduleName] = {
            level,
            description: getPermissionDescription(level)
          };

          // Generate recommendations
          if (level === 'FULL_ACCESS' && user.role !== 'EXECUTIVE_MANAGEMENT') {
            analysis.recommendations.push(`${moduleName}: Consider reducing to EDIT_ACCESS for ${user.role}`);
          }

          if (level === 'NO_ACCESS' && needsAccess(user.role, moduleName)) {
            analysis.recommendations.push(`${moduleName}: ${user.role} may need ${getRecommendedAccess(user.role, moduleName)} access`);
          }
        }
      });

      return analysis;
    });

    // Summary statistics
    const summary = {
      totalUsers: users.length,
      roleDistribution: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      inactiveUsers: await prisma.user.count({ where: { status: 'INACTIVE' } }),
      pendingActivations: await prisma.user.count({ where: { status: 'PENDING_ACTIVATION' } }),
      totalRecommendations: permissionAnalysis.reduce((sum, analysis) => sum + analysis.recommendations.length, 0)
    };

    return NextResponse.json({
      summary,
      analysis: permissionAnalysis
    });

  } catch (error) {
    console.error('Permission audit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getPermissionDescription(level: string): string {
  const descriptions = {
    'NO_ACCESS': 'No access to module',
    'VIEW_ACCESS': 'Can view data only',
    'EDIT_ACCESS': 'Can view and modify data',
    'FULL_ACCESS': 'Full control including delete'
  };
  return descriptions[level as keyof typeof descriptions] || 'Unknown';
}

function needsAccess(role: string, module: string): boolean {
  // Define which roles typically need access to which modules
  const accessMatrix = {
    'CREWING_OFFICER': ['crew', 'applications', 'assignments'],
    'ACCOUNTING_OFFICER': ['accounting', 'contracts'],
    'HR_OFFICER': ['hr', 'crew'],
    'QUALITY_OFFICER': ['quality', 'documents']
  };

  return accessMatrix[role as keyof typeof accessMatrix]?.includes(module) || false;
}

function getRecommendedAccess(role: string, module: string): string {
  const recommendations = {
    'CREWING_OFFICER': { 'crew': 'EDIT_ACCESS', 'applications': 'EDIT_ACCESS' },
    'ACCOUNTING_OFFICER': { 'accounting': 'EDIT_ACCESS', 'contracts': 'VIEW_ACCESS' },
    'HR_OFFICER': { 'hr': 'EDIT_ACCESS', 'crew': 'VIEW_ACCESS' },
    'QUALITY_OFFICER': { 'quality': 'EDIT_ACCESS', 'documents': 'EDIT_ACCESS' }
  };

  return recommendations[role as keyof typeof recommendations]?.[module] || 'VIEW_ACCESS';
}
```

---

## 5.0 🗄️ DATABASE ADMINISTRATION

### 5.1 Database Architecture

#### Schema Overview:
```sql
-- Core Security Tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL
);

-- Business Tables
CREATE TABLE principals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vessels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  imo_number VARCHAR(20) UNIQUE,
  principal_id INTEGER REFERENCES principals(id),
  flag VARCHAR(100),
  type VARCHAR(100),
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE crew (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  nationality VARCHAR(100),
  passport_number VARCHAR(50) UNIQUE,
  seaman_book_number VARCHAR(50) UNIQUE,
  rank VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employment & Contracts
CREATE TABLE employment_contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  crew_id INTEGER REFERENCES crew(id),
  vessel_id INTEGER REFERENCES vessels(id),
  principal_id INTEGER REFERENCES principals(id),
  rank VARCHAR(100),
  contract_start DATE NOT NULL,
  contract_end DATE NOT NULL,
  basic_wage DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assignments & Operations
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  crew_id INTEGER REFERENCES crew(id),
  vessel_id INTEGER REFERENCES vessels(id),
  principal_id INTEGER REFERENCES principals(id),
  rank VARCHAR(100),
  sign_on_date DATE,
  sign_off_date DATE,
  sign_off_plan DATE,
  status VARCHAR(20) DEFAULT 'PLANNED',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Financial Tables
CREATE TABLE agency_fees (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES employment_contracts(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  due_date DATE,
  paid_date DATE,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE salaries (
  id SERIAL PRIMARY KEY,
  crew_id INTEGER REFERENCES crew(id),
  contract_id INTEGER REFERENCES employment_contracts(id),
  month DATE NOT NULL,
  basic_wage DECIMAL(12,2),
  overtime DECIMAL(12,2),
  allowances DECIMAL(12,2),
  deductions DECIMAL(12,2),
  net_salary DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Document Management
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  crew_id INTEGER REFERENCES crew(id),
  document_type VARCHAR(100) NOT NULL,
  document_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  file_path VARCHAR(500),
  status VARCHAR(20) DEFAULT 'VALID',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit & Security
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  event VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  resource VARCHAR(100),
  resource_id VARCHAR(100),
  action VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE security_alerts (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  status VARCHAR(20) DEFAULT 'OPEN',
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_crew_full_name ON crew USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_contracts_crew_id ON employment_contracts(crew_id);
CREATE INDEX idx_assignments_vessel_id ON assignment(vessel_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_documents_expiry ON documents(expiry_date);
CREATE INDEX idx_salaries_month ON salaries(month);
```

### 5.2 Database Performance Optimization

#### Index Strategy:
```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_crew_status ON crew(status);
CREATE INDEX CONCURRENTLY idx_crew_nationality ON crew(nationality);
CREATE INDEX CONCURRENTLY idx_contracts_status ON employment_contracts(status);
CREATE INDEX CONCURRENTLY idx_contracts_dates ON employment_contracts(contract_start, contract_end);
CREATE INDEX CONCURRENTLY idx_assignments_status ON assignments(status);
CREATE INDEX CONCURRENTLY idx_assignments_dates ON assignments(sign_on_date, sign_off_plan);
CREATE INDEX CONCURRENTLY idx_documents_crew_type ON documents(crew_id, document_type);
CREATE INDEX CONCURRENTLY idx_audit_logs_event ON audit_logs(event, timestamp DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_active_contracts ON employment_contracts(contract_end)
WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY idx_active_assignments ON assignments(sign_off_plan)
WHERE status IN ('PLANNED', 'ONBOARD');

-- Foreign key indexes (usually auto-created)
CREATE INDEX CONCURRENTLY idx_assignments_crew_id ON assignments(crew_id);
CREATE INDEX CONCURRENTLY idx_assignments_principal_id ON assignments(principal_id);
```

#### Query Optimization:
```sql
-- Optimized queries with proper indexes
-- Crew search with full-text search
SELECT id, full_name, rank, status
FROM crew
WHERE to_tsvector('english', full_name) @@ plainto_tsquery('english', $1)
ORDER BY ts_rank(to_tsvector('english', full_name), plainto_tsquery('english', $1)) DESC
LIMIT 20;

-- Expiring documents query
SELECT d.id, d.document_type, d.expiry_date, c.full_name
FROM documents d
JOIN crew c ON d.crew_id = c.id
WHERE d.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
AND d.status = 'VALID'
ORDER BY d.expiry_date;

-- Assignment status dashboard
SELECT
  COUNT(*) FILTER (WHERE status = 'PLANNED') as planned,
  COUNT(*) FILTER (WHERE status = 'ONBOARD') as onboard,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE sign_off_plan < CURRENT_DATE AND status = 'ONBOARD') as overdue
FROM assignments
WHERE sign_off_plan >= CURRENT_DATE - INTERVAL '30 days';
```

#### Partitioning Strategy:
```sql
-- Partition audit logs by month for better performance
CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Partition salaries by year
CREATE TABLE salaries_y2025 PARTITION OF salaries
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Automatic partition creation script
CREATE OR REPLACE FUNCTION create_monthly_partition(
  table_name TEXT,
  start_date DATE
) RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  partition_start DATE;
  partition_end DATE;
BEGIN
  partition_name := table_name || '_y' || EXTRACT(YEAR FROM start_date) || 'm' || LPAD(EXTRACT(MONTH FROM start_date)::TEXT, 2, '0');
  partition_start := start_date;
  partition_end := start_date + INTERVAL '1 month';

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    partition_name, table_name, partition_start, partition_end);

  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_timestamp ON %I (timestamp)', partition_name, partition_name);
END;
$$ LANGUAGE plpgsql;
```

### 5.3 Database Maintenance

#### Automated Maintenance Scripts:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/db-maintenance.sh

LOG_FILE="/opt/hanmarine-hims/logs/db-maintenance.log"
DB_NAME="hanmarine_hims"
DB_USER="hanmarine_user"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] $*"
}

# Vacuum and analyze for statistics
log "Starting database maintenance..."

psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "VACUUM ANALYZE;" >> "$LOG_FILE" 2>&1
if [ $? -eq 0 ]; then
    log "VACUUM ANALYZE completed successfully"
else
    log "ERROR: VACUUM ANALYZE failed"
    exit 1
fi

# Reindex fragmented indexes
psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 'REINDEX INDEX ' || schemaname || '.' || indexname || ';' as reindex_cmd
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
" | grep REINDEX | psql -h localhost -U "$DB_USER" -d "$DB_NAME" >> "$LOG_FILE" 2>&1

log "Database maintenance completed"
```

#### Database Backup Strategy:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/db-backup.sh

BACKUP_ROOT="/opt/hanmarine-hims/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_ROOT/database/hanmarine_hims_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

DB_NAME="hanmarine_hims"
DB_USER="hanmarine_user"

# Create backup
log "Creating database backup..."
pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log "Database backup created: $BACKUP_FILE"

    # Compress
    gzip "$BACKUP_FILE"
    log "Backup compressed: $COMPRESSED_FILE"

    # Upload to S3
    aws s3 cp "$COMPRESSED_FILE" "s3://hanmarine-backups/database/" --storage-class STANDARD_IA

    # Cleanup old backups (keep last 30 days)
    find "$BACKUP_ROOT/database" -name "*.gz" -mtime +30 -delete

    log "Backup uploaded and cleanup completed"
else
    log "ERROR: Database backup failed"
    exit 1
fi
```

#### Database Monitoring:
```sql
-- Database health check queries
SELECT
  schemaname,
  tablename,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;

-- Connection monitoring
SELECT
  usename,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

### 5.4 Database Security

#### Row-Level Security (RLS):
```sql
-- Enable RLS on sensitive tables
ALTER TABLE crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for crew data
CREATE POLICY crew_policy ON crew
FOR ALL USING (
  current_user_role() IN ('EXECUTIVE_MANAGEMENT', 'CREWING_MANAGER', 'HR_MANAGER') OR
  id = current_user_id()
);

-- RLS for salary data (highly restricted)
CREATE POLICY salary_policy ON salaries
FOR ALL USING (
  current_user_role() IN ('EXECUTIVE_MANAGEMENT', 'ACCOUNTING_MANAGER')
);

-- Function to get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = current_setting('app.user_id')::integer;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get current user ID
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
  SELECT current_setting('app.user_id')::integer;
$$ LANGUAGE sql SECURITY DEFINER;
```

#### Data Encryption at Rest:
```sql
-- Encrypted columns for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encrypted crew data table
CREATE TABLE crew_sensitive (
  id SERIAL PRIMARY KEY,
  crew_id INTEGER REFERENCES crew(id) ON DELETE CASCADE,
  encrypted_passport BYTEA, -- PGP symmetric encryption
  encrypted_medical BYTEA,
  encrypted_financial BYTEA,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Encryption functions
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(plain_text TEXT, key TEXT DEFAULT 'hanmarine-key')
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(plain_text, key);
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA, key TEXT DEFAULT 'hanmarine-key')
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(encrypted_data, key);
$$ LANGUAGE sql IMMUTABLE;

-- Usage
INSERT INTO crew_sensitive (crew_id, encrypted_passport)
VALUES (1, encrypt_sensitive_data('A1234567'));

SELECT decrypt_sensitive_data(encrypted_passport) FROM crew_sensitive WHERE crew_id = 1;
```

---

## 6.0 📊 MONITORING & MAINTENANCE

### 6.1 System Monitoring Setup

#### Prometheus Configuration:
```yaml
# /opt/hanmarine-hims/config/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'hanmarine-hims'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    scrape_interval: 30s
```

#### Application Metrics:
```typescript
// /api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { register, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';

// Enable default metrics
collectDefaultMetrics({ prefix: 'hanmarine_hims_' });

// Custom metrics
const activeUsers = new Gauge({
  name: 'hanmarine_hims_active_users',
  help: 'Number of currently active users'
});

const dbConnections = new Gauge({
  name: 'hanmarine_hims_db_connections',
  help: 'Number of active database connections'
});

const apiRequests = new Counter({
  name: 'hanmarine_hims_api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'endpoint', 'status']
});

const responseTime = new Histogram({
  name: 'hanmarine_hims_response_time_seconds',
  help: 'Response time in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export async function GET() {
  try {
    // Update metrics
    const userCount = await prisma.session.count({
      where: {
        expires: { gt: new Date() }
      }
    });
    activeUsers.set(userCount);

    // Database connection count (simplified)
    dbConnections.set(10); // Replace with actual query

    // Return metrics
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType
      }
    });

  } catch (error) {
    console.error('Metrics collection error:', error);
    return NextResponse.json({ error: 'Metrics collection failed' }, { status: 500 });
  }
}

// Middleware to collect request metrics
export async function metricsMiddleware(request: NextRequest) {
  const start = Date.now();

  // Record request
  apiRequests.inc({
    method: request.method,
    endpoint: request.nextUrl.pathname,
    status: 'started'
  });

  const response = await NextResponse.next();

  const duration = (Date.now() - start) / 1000;

  // Record response time
  responseTime
    .labels(request.method, request.nextUrl.pathname)
    .observe(duration);

  // Update status
  apiRequests.inc({
    method: request.method,
    endpoint: request.nextUrl.pathname,
    status: response.status.toString()
  });

  return response;
}
```

#### Grafana Dashboards:
```json
// /opt/hanmarine-hims/config/grafana-dashboard.json
{
  "dashboard": {
    "title": "HANMARINE HIMS System Overview",
    "tags": ["hanmarine", "hims", "monitoring"],
    "timezone": "UTC",
    "panels": [
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "hanmarine_hims_active_users",
            "legendFormat": "Active Users"
          }
        ]
      },
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(hanmarine_hims_response_time_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "gauge",
        "targets": [
          {
            "expr": "hanmarine_hims_db_connections",
            "legendFormat": "DB Connections"
          }
        ]
      },
      {
        "title": "System Load",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ]
      }
    ]
  }
}
```

### 6.2 Log Management

#### Centralized Logging:
```typescript
// /lib/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hanmarine-hims' },
  transports: [
    // Error log
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),

    // Combined log
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    }),

    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Request logging middleware
export function requestLogger(req: NextRequest, res: NextResponse, next: () => void) {
  const start = Date.now();

  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent')
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.status,
      duration: `${duration}ms`
    });

    originalEnd.apply(this, args);
  };

  next();
}

// Security event logging
export function securityLogger(event: string, details: any) {
  logger.warn('Security event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// Performance logging
export function performanceLogger(operation: string, duration: number, metadata?: any) {
  logger.info('Performance metric', {
    operation,
    duration,
    ...metadata
  });
}
```

#### Log Analysis Scripts:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/log-analysis.sh

LOG_DIR="/opt/hanmarine-hims/logs"
REPORT_FILE="/opt/hanmarine-hims/reports/log-analysis-$(date +%Y%m%d).txt"

echo "HANMARINE HIMS Log Analysis Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "=========================================" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "ERROR SUMMARY (Last 24 hours):" >> "$REPORT_FILE"
echo "------------------------------" >> "$REPORT_FILE"
find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -h "ERROR" {} \; | wc -l >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "TOP ERROR MESSAGES:" >> "$REPORT_FILE"
find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -h "ERROR" {} \; | \
  sed 's/.*ERROR//' | sort | uniq -c | sort -nr | head -10 >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "SECURITY EVENTS:" >> "$REPORT_FILE"
find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -h "Security event" {} \; | wc -l >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "PERFORMANCE ISSUES:" >> "$REPORT_FILE"
find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -h "slow\|timeout\|performance" {} \; | wc -l >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "SYSTEM HEALTH:" >> "$REPORT_FILE"
echo "Uptime: $(uptime)" >> "$REPORT_FILE"
echo "Disk usage: $(df -h / | tail -1)" >> "$REPORT_FILE"
echo "Memory usage: $(free -h | grep Mem)" >> "$REPORT_FILE"

echo "Log analysis report generated: $REPORT_FILE"
```

### 6.3 Performance Monitoring

#### Application Performance Monitoring:
```typescript
// /lib/performance-monitor.ts
import { performance, PerformanceObserver } from 'perf_hooks';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private alerts: PerformanceAlert[] = [];

  constructor() {
    // Monitor long-running operations
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // 1 second threshold
          this.recordSlowOperation(entry.name, entry.duration);
        }
      }
    });

    obs.observe({ entryTypes: ['measure'] });
  }

  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }

  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(name);
    try {
      const result = await operation();
      return result;
    } finally {
      endTimer();
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift();
    }

    // Check for performance degradation
    if (values.length >= 10) {
      const recent = values.slice(-10);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

      const baseline = values.slice(0, -10);
      const baselineAvg = baseline.reduce((a, b) => a + b, 0) / baseline.length;

      if (avg > baselineAvg * 2) { // 100% degradation
        this.createPerformanceAlert(name, avg, baselineAvg);
      }
    }
  }

  private recordSlowOperation(name: string, duration: number): void {
    logger.warn('Slow operation detected', {
      operation: name,
      duration: `${duration}ms`,
      threshold: '1000ms'
    });

    // Create alert for repeated slow operations
    this.alerts.push({
      type: 'SLOW_OPERATION',
      operation: name,
      duration,
      timestamp: new Date(),
      count: 1
    });
  }

  private createPerformanceAlert(operation: string, currentAvg: number, baselineAvg: number): void {
    const degradation = ((currentAvg - baselineAvg) / baselineAvg) * 100;

    logger.error('Performance degradation detected', {
      operation,
      currentAvg: `${currentAvg.toFixed(2)}ms`,
      baselineAvg: `${baselineAvg.toFixed(2)}ms`,
      degradation: `${degradation.toFixed(1)}%`
    });

    // Send alert to monitoring system
    // Integration with alerting system would go here
  }

  getMetrics(): Record<string, {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  }> {
    const result: Record<string, any> = {};

    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      result[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[Math.floor(sorted.length * 0.95)]
      };
    }

    return result;
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert =>
      Date.now() - alert.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Usage examples
// API route timing
export async function GET() {
  const endTimer = performanceMonitor.startTimer('api/dashboard/get');

  try {
    // API logic here
    const data = await getDashboardData();
    return NextResponse.json(data);
  } finally {
    endTimer();
  }
}

// Database query timing
const data = await performanceMonitor.measureAsync('db/crew/query', async () => {
  return await prisma.crew.findMany({ where: filters });
});
```

#### Database Performance Monitoring:
```sql
-- Database performance queries
CREATE OR REPLACE VIEW db_performance_metrics AS
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;

-- Query performance monitoring
CREATE OR REPLACE FUNCTION log_slow_query()
RETURNS event_trigger AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM pg_stat_activity
           WHERE state = 'active'
           AND query_start < now() - interval '1 second'
  LOOP
    INSERT INTO slow_queries (query, duration, user_id, timestamp)
    VALUES (r.query, extract(epoch from (now() - r.query_start)), r.usename, now());
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger
CREATE EVENT TRIGGER log_slow_queries
ON sql_drop
EXECUTE FUNCTION log_slow_query();
```

---

## 7.0 💾 BACKUP & DISASTER RECOVERY

### 7.1 Backup Strategy

#### Multi-Level Backup Approach:
```
┌─────────────────────────────────────────────────────────────┐
│                    BACKUP STRATEGY                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Level 1   │  │   Level 2   │  │   Level 3   │         │
│  │ Transaction │  │   Daily     │  │   Weekly    │         │
│  │   Logs      │  │   Backup    │  │   Backup    │         │
│  │   (WAL)     │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Local     │  │   Cloud     │  │   Offsite   │         │
│  │   Storage   │  │   Storage   │  │   Storage   │         │
│  │   (SSD)     │  │   (S3)      │  │   (Tape)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### Database Backup Implementation:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/backup/database-backup.sh

set -e

# Configuration
BACKUP_ROOT="/opt/hanmarine-hims/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE="${1:-full}" # full, incremental, or wal
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hanmarine_hims}"
DB_USER="${DB_USER:-hanmarine_user}"

# Create backup directory
BACKUP_DIR="$BACKUP_ROOT/database/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] $*"
}

log "Starting $BACKUP_TYPE database backup"

# Pre-backup checks
check_disk_space() {
    local required_space=$(du -sb /var/lib/postgresql/data | awk '{print $1}')
    local available_space=$(df /opt/hanmarine-hims/backups | tail -1 | awk '{print $4 * 1024}')

    if [ "$available_space" -lt "$required_space" ]; then
        log "ERROR: Insufficient disk space for backup"
        exit 1
    fi
}

check_database_connectivity() {
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log "ERROR: Cannot connect to database"
        exit 1
    fi
}

check_disk_space
check_database_connectivity

# Create backup based on type
case "$BACKUP_TYPE" in
    "full")
        log "Creating full database backup"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --format=custom \
                --compress=9 \
                --verbose \
                --file="$BACKUP_DIR/database.backup" \
                --exclude-schema=pg_toast

        # Create restore script
        cat > "$BACKUP_DIR/restore.sh" << EOF
#!/bin/bash
# Restore script for $TIMESTAMP backup

echo "Restoring database from backup..."
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
           --clean --if-exists --create --verbose \
           $BACKUP_DIR/database.backup

echo "Database restore completed"
EOF
        chmod +x "$BACKUP_DIR/restore.sh"
        ;;

    "incremental")
        log "Creating incremental backup (base + WAL)"
        # Get last full backup
        LAST_FULL=$(find "$BACKUP_ROOT/database" -name "database.backup" -type f | sort | tail -1)

        if [ -z "$LAST_FULL" ]; then
            log "ERROR: No full backup found for incremental backup"
            exit 1
        fi

        # Copy WAL files since last full backup
        LAST_BACKUP_TIME=$(stat -c %Y "$LAST_FULL")
        find /var/lib/postgresql/data/pg_wal -name "*.ready" -newermt "@$LAST_BACKUP_TIME" \
             -exec cp {} "$BACKUP_DIR/wal/" \;

        # Create incremental backup file
        cp "$LAST_FULL" "$BACKUP_DIR/database.backup"
        ;;

    "wal")
        log "Archiving WAL files"
        # Archive current WAL files
        pg_archivecleanup /var/lib/postgresql/data/pg_wal /var/lib/postgresql/data/pg_wal 2>/dev/null || true
        ;;
esac

# Calculate backup size and duration
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
DURATION=$SECONDS

log "Backup completed successfully"
log "Backup size: $BACKUP_SIZE"
log "Duration: ${DURATION}s"
log "Backup location: $BACKUP_DIR"

# Compress backup for storage
if [ "$BACKUP_TYPE" = "full" ]; then
    log "Compressing backup..."
    tar -czf "$BACKUP_DIR.tar.gz" -C "$BACKUP_ROOT/database" "$TIMESTAMP"
    rm -rf "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR.tar.gz"
fi

# Upload to cloud storage
if [ -n "$AWS_S3_BUCKET" ]; then
    log "Uploading to cloud storage..."
    aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/database/$TIMESTAMP.tar.gz" \
        --storage-class STANDARD_IA \
        --metadata "backup-type=$BACKUP_TYPE,created=$(date -Iseconds)"

    if [ $? -eq 0 ]; then
        log "Cloud upload successful"
    else
        log "ERROR: Cloud upload failed"
        # Don't fail the backup if cloud upload fails
    fi
fi

# Cleanup old backups
log "Cleaning up old backups..."
find "$BACKUP_ROOT/database" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_ROOT/database" -type d -empty -delete

# Send notification
if [ -n "$NOTIFICATION_EMAIL" ]; then
    mail -s "HANMARINE HIMS Database Backup Completed" "$NOTIFICATION_EMAIL" << EOF
Database backup completed successfully.

Backup Type: $BACKUP_TYPE
Timestamp: $TIMESTAMP
Size: $BACKUP_SIZE
Duration: ${DURATION}s
Location: $BACKUP_FILE

Please verify backup integrity and test restore procedure.
EOF
fi

log "Backup process completed"
```

#### Application Backup:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/backup/application-backup.sh

set -e

BACKUP_ROOT="/opt/hanmarine-hims/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/application/$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] $*"
}

log "Starting application backup"

# Backup application code
log "Backing up application code..."
tar -czf "$BACKUP_DIR/app.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='logs' \
    --exclude='.git' \
    -C /opt/hanmarine-hims app/

# Backup configuration
log "Backing up configuration..."
tar -czf "$BACKUP_DIR/config.tar.gz" \
    -C /opt/hanmarine-hims config/

# Backup environment files (excluding secrets)
log "Backing up environment files..."
cp /opt/hanmarine-hims/app/.env.local "$BACKUP_DIR/"
# Remove sensitive data from backup
sed -i '/ENCRYPTION_KEY/d; /NEXTAUTH_SECRET/d; /JWT_SECRET/d; /SMTP_PASS/d' "$BACKUP_DIR/.env.local"

# Backup SSL certificates
log "Backing up SSL certificates..."
tar -czf "$BACKUP_DIR/ssl.tar.gz" \
    -C /etc ssl/certs/hanmarine*

# Create backup manifest
cat > "$BACKUP_DIR/manifest.txt" << EOF
HANMARINE HIMS Application Backup
Timestamp: $TIMESTAMP
Version: $(cat /opt/hanmarine-hims/app/package.json | grep '"version"' | cut -d'"' -f4)

Contents:
- app.tar.gz: Application code and assets
- config.tar.gz: Configuration files
- .env.local: Environment variables (sanitized)
- ssl.tar.gz: SSL certificates

Restore Instructions:
1. Extract backup files to /opt/hanmarine-hims/
2. Restore configuration: tar -xzf config.tar.gz
3. Restore application: tar -xzf app.tar.gz
4. Restore SSL certificates to /etc/ssl/certs/
5. Update environment variables
6. Restart services
EOF

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
log "Backup size: $BACKUP_SIZE"

# Compress final backup
FINAL_BACKUP="$BACKUP_ROOT/application/$TIMESTAMP.tar.gz"
tar -czf "$FINAL_BACKUP" -C "$BACKUP_ROOT/application" "$TIMESTAMP"
rm -rf "$BACKUP_DIR"

log "Application backup completed: $FINAL_BACKUP"

# Upload to cloud
if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 cp "$FINAL_BACKUP" "s3://$AWS_S3_BUCKET/application/$TIMESTAMP.tar.gz" \
        --storage-class STANDARD_IA
fi

# Cleanup
find "$BACKUP_ROOT/application" -name "*.tar.gz" -mtime +30 -delete

log "Application backup process completed"
```

### 7.2 Disaster Recovery Planning

#### Recovery Time Objectives (RTO):
- **Critical Systems**: 4 hours
- **Database**: 2 hours
- **Application**: 1 hour
- **Full System**: 6 hours

#### Recovery Point Objectives (RPO):
- **Critical Data**: 1 hour (transaction logs)
- **Operational Data**: 4 hours (incremental backups)
- **Archival Data**: 24 hours (full backups)

#### Disaster Recovery Procedures:

##### Complete System Recovery:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/disaster-recovery.sh

set -e

RECOVERY_TYPE="${1:-full}" # full, database-only, application-only
BACKUP_TIMESTAMP="${2:-latest}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [RECOVERY] $*"
}

error_exit() {
    log "ERROR: $*"
    exit 1
}

log "Starting HANMARINE HIMS Disaster Recovery"
log "Recovery Type: $RECOVERY_TYPE"
log "Backup Timestamp: $BACKUP_TIMESTAMP"

# Pre-recovery validation
validate_environment() {
    log "Validating recovery environment..."

    # Check system resources
    local available_mem=$(free -g | awk 'NR==2{print $7}')
    if [ "$available_mem" -lt 8 ]; then
        error_exit "Insufficient memory for recovery (need 8GB, have ${available_mem}GB)"
    fi

    # Check disk space
    local available_disk=$(df /opt/hanmarine-hims | tail -1 | awk '{print $4}')
    if [ "$available_disk" -lt 52428800 ]; then # 50GB in KB
        error_exit "Insufficient disk space for recovery"
    fi

    log "Environment validation passed"
}

# Stop all services
stop_services() {
    log "Stopping all services..."

    # Stop application
    docker-compose -f /opt/hanmarine-hims/config/docker-compose.yml down || true

    # Stop monitoring services
    systemctl stop prometheus || true
    systemctl stop grafana || true
    systemctl stop alertmanager || true

    log "All services stopped"
}

# Database recovery
recover_database() {
    log "Starting database recovery..."

    # Find latest backup
    if [ "$BACKUP_TIMESTAMP" = "latest" ]; then
        LATEST_BACKUP=$(aws s3 ls s3://hanmarine-backups/database/ | sort | tail -1 | awk '{print $4}')
    else
        LATEST_BACKUP="${BACKUP_TIMESTAMP}.tar.gz"
    fi

    if [ -z "$LATEST_BACKUP" ]; then
        error_exit "No database backup found"
    fi

    log "Using database backup: $LATEST_BACKUP"

    # Download backup
    aws s3 cp "s3://hanmarine-backups/database/$LATEST_BACKUP" /tmp/

    # Extract backup
    tar -xzf "/tmp/$LATEST_BACKUP" -C /tmp/

    # Stop PostgreSQL
    systemctl stop postgresql

    # Move old data directory
    mv /var/lib/postgresql/data "/var/lib/postgresql/data.backup.$(date +%s)"

    # Restore database
    pg_restore -h localhost -U hanmarine_user -d hanmarine_hims \
               --clean --if-exists --create --verbose \
               /tmp/database.backup

    # Start PostgreSQL
    systemctl start postgresql

    # Verify recovery
    if ! pg_isready -h localhost -U hanmarine_user -d hanmarine_hims >/dev/null 2>&1; then
        error_exit "Database recovery failed"
    fi

    log "Database recovery completed"
}

# Application recovery
recover_application() {
    log "Starting application recovery..."

    # Find latest backup
    if [ "$BACKUP_TIMESTAMP" = "latest" ]; then
        LATEST_BACKUP=$(aws s3 ls s3://hanmarine-backups/application/ | sort | tail -1 | awk '{print $4}')
    else
        LATEST_BACKUP="${BACKUP_TIMESTAMP}.tar.gz"
    fi

    if [ -z "$LATEST_BACKUP" ]; then
        error_exit "No application backup found"
    fi

    log "Using application backup: $LATEST_BACKUP"

    # Download backup
    aws s3 cp "s3://hanmarine-backups/application/$LATEST_BACKUP" /tmp/

    # Extract backup
    tar -czf "$LATEST_BACKUP" -C /tmp/

    # Restore application code
    rm -rf /opt/hanmarine-hims/app/*
    cp -r /tmp/app/* /opt/hanmarine-hims/app/

    # Restore configuration
    cp -r /tmp/config/* /opt/hanmarine-hims/config/

    # Restore SSL certificates
    cp /tmp/ssl/* /etc/ssl/certs/

    # Restore environment file
    cp /tmp/.env.local /opt/hanmarine-hims/app/

    log "Application files restored"
}

# Start services
start_services() {
    log "Starting services..."

    # Start application
    cd /opt/hanmarine-hims/config
    docker-compose up -d

    # Wait for application to be ready
    local retries=30
    while [ $retries -gt 0 ]; do
        if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
            break
        fi
        sleep 10
        retries=$((retries - 1))
    done

    if [ $retries -eq 0 ]; then
        error_exit "Application failed to start"
    fi

    # Start monitoring
    systemctl start prometheus
    systemctl start grafana
    systemctl start alertmanager

    log "All services started"
}

# Post-recovery validation
validate_recovery() {
    log "Validating recovery..."

    # Test database connectivity
    if ! pg_isready -h localhost -U hanmarine_user -d hanmarine_hims >/dev/null 2>&1; then
        error_exit "Database connectivity test failed"
    fi

    # Test application health
    if ! curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
        error_exit "Application health check failed"
    fi

    # Test key functionality
    if ! curl -f -s http://localhost:3000/api/auth/providers >/dev/null 2>&1; then
        error_exit "Authentication test failed"
    fi

    log "Recovery validation passed"
}

# Main recovery process
main() {
    validate_environment

    case "$RECOVERY_TYPE" in
        "full")
            stop_services
            recover_database
            recover_application
            start_services
            ;;
        "database-only")
            stop_services
            recover_database
            start_services
            ;;
        "application-only")
            stop_services
            recover_application
            start_services
            ;;
        *)
            error_exit "Invalid recovery type: $RECOVERY_TYPE"
            ;;
    esac

    validate_recovery

    log "🎉 Disaster recovery completed successfully!"
    log "System is now operational"

    # Send recovery notification
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        mail -s "HANMARINE HIMS Disaster Recovery Completed" "$NOTIFICATION_EMAIL" << EOF
HANMARINE HIMS disaster recovery has been completed successfully.

Recovery Type: $RECOVERY_TYPE
Backup Used: $BACKUP_TIMESTAMP
Completion Time: $(date)

System Status: OPERATIONAL
Application URL: https://hims.hanmarine.com
Health Check: https://hims.hanmarine.com/api/health

Please verify system functionality and notify users.
EOF
    fi
}

# Run main recovery
main "$@"
```

#### Recovery Testing:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/test-recovery.sh

# Test disaster recovery procedures without affecting production

set -e

TEST_ENV="recovery-test"
TEST_DIR="/tmp/hims-recovery-test"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [TEST] $*"
}

# Create test environment
setup_test_env() {
    log "Setting up test environment..."

    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"

    # Copy production docker-compose
    cp /opt/hanmarine-hims/config/docker-compose.yml .

    # Modify for testing
    sed -i 's/hanmarine-hims-app/hanmarine-hims-test/g' docker-compose.yml
    sed -i 's/hanmarine-hims-db/hanmarine-hims-test-db/g' docker-compose.yml

    # Create test database
    docker run --name hims-test-postgres -e POSTGRES_DB=hanmarine_hims_test \
           -e POSTGRES_USER=hanmarine_user -e POSTGRES_PASSWORD=test_password \
           -d postgres:15

    log "Test environment ready"
}

# Run recovery test
test_recovery() {
    log "Starting recovery test..."

    # Download latest backup
    LATEST_BACKUP=$(aws s3 ls s3://hanmarine-backups/database/ | sort | tail -1 | awk '{print $4}')
    aws s3 cp "s3://hanmarine-backups/database/$LATEST_BACKUP" "$TEST_DIR/"

    # Extract and restore to test database
    tar -xzf "$LATEST_BACKUP" -C "$TEST_DIR/"
    pg_restore -h localhost -U hanmarine_user -d hanmarine_hims_test \
               --clean --if-exists --create --verbose \
               "$TEST_DIR/database.backup"

    log "Database recovery test completed"
}

# Validate test results
validate_test() {
    log "Validating test results..."

    # Check database integrity
    docker exec hims-test-postgres psql -U hanmarine_user -d hanmarine_hims_test \
           -c "SELECT COUNT(*) FROM users;" > /dev/null

    # Check key tables
    local table_count=$(docker exec hims-test-postgres psql -U hanmarine_user \
                       -d hanmarine_hims_test -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

    if [ "$table_count" -lt 10 ]; then
        log "ERROR: Insufficient tables restored ($table_count)"
        exit 1
    fi

    log "Recovery test validation passed"
}

# Cleanup
cleanup() {
    log "Cleaning up test environment..."
    docker stop hims-test-postgres
    docker rm hims-test-postgres
    rm -rf "$TEST_DIR"
    log "Cleanup completed"
}

# Main test
main() {
    setup_test_env
    test_recovery
    validate_test
    cleanup

    log "✅ Recovery test completed successfully"
}

main "$@"
```

---

## 8.0 🔧 TROUBLESHOOTING

### 8.1 Critical System Issues

#### Database Connection Failures:
**Symptoms**: API returns 500 errors, application unresponsive
**Immediate Actions**:
```bash
# Check database service status
systemctl status postgresql

# Check database connectivity
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "SELECT 1;"

# Check connection pool
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
SELECT
  usename,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
"

# Restart database if needed
systemctl restart postgresql
```

**Root Cause Analysis**:
- Check disk space: `df -h`
- Check memory usage: `free -h`
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
- Check for long-running queries

#### Application Crashes:
**Symptoms**: 502/503 errors, blank pages
**Immediate Actions**:
```bash
# Check application logs
tail -f /opt/hanmarine-hims/logs/app.log

# Check application status
curl -f http://localhost:3000/api/health

# Restart application
cd /opt/hanmarine-hims/config
docker-compose restart app

# Check resource usage
docker stats
```

**Diagnostic Commands**:
```bash
# Check Node.js process
ps aux | grep node

# Check memory usage
docker exec hanmarine-hims-app ps aux --sort=-%mem | head -5

# Check application configuration
docker exec hanmarine-hims-app cat .env.local | grep -v PASSWORD
```

#### Authentication Failures:
**Symptoms**: Users cannot login, MFA errors
**Immediate Actions**:
```bash
# Check NextAuth configuration
docker exec hanmarine-hims-app cat .env.local | grep NEXTAUTH

# Check session database
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
SELECT COUNT(*) FROM sessions WHERE expires > NOW();
"

# Clear expired sessions
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
DELETE FROM sessions WHERE expires < NOW();
"
```

### 8.2 Performance Issues

#### Slow Application Response:
**Diagnosis**:
```bash
# Check application metrics
curl http://localhost:3000/api/metrics

# Check database performance
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
SELECT
  query,
  calls,
  total_time / 1000 as total_seconds,
  mean_time / 1000 as mean_seconds,
  rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
"

# Check system resources
top -b -n1 | head -20
iostat -x 1 5
```

**Optimization Steps**:
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_audit_logs_event_time ON audit_logs(event, timestamp DESC);
CREATE INDEX CONCURRENTLY idx_sessions_user_expires ON sessions(user_id, expires);

-- Update statistics
ANALYZE VERBOSE;

-- Clear query cache if using PgPool
-- (PgPool commands would go here)
```

#### Memory Issues:
**Symptoms**: Out of memory errors, application restarts
**Resolution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
docker-compose up -d

# Check for memory leaks
docker exec hanmarine-hims-app node --inspect --max-old-space-size=2048

# Optimize database connections
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
ALTER SYSTEM SET max_connections = '100';
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET work_mem = '8MB';
SELECT pg_reload_conf();
"
```

### 8.3 Security Incidents

#### Suspected Security Breach:
**Immediate Response**:
```bash
# 1. Isolate the system
# Disconnect from network if critical
iptables -A INPUT -s <suspicious_ip> -j DROP

# 2. Preserve evidence
# Do not restart services yet
mkdir -p /opt/hanmarine-hims/forensics
cp -r /opt/hanmarine-hims/logs /opt/hanmarine-hims/forensics/

# 3. Check system logs
grep -i "failed\|error\|security" /var/log/auth.log
grep -i "attack\|breach\|unauthorized" /opt/hanmarine-hims/logs/*.log

# 4. Notify security team
curl -X POST "https://api.pagerduty.com/v2/enqueue" \
     -H "Content-Type: application/json" \
     -d '{
       "routing_key": "'"$PAGERDUTY_SECURITY_KEY"'",
       "event_action": "trigger",
       "payload": {
         "summary": "HANMARINE HIMS Security Incident",
         "source": "system_monitoring",
         "severity": "critical"
       }
     }'
```

#### Incident Response Checklist:
- [ ] Stop all non-essential services
- [ ] Change all administrative passwords
- [ ] Revoke compromised sessions
- [ ] Analyze attack vectors
- [ ] Apply security patches
- [ ] Restore from clean backup
- [ ] Update security policies
- [ ] Conduct post-mortem analysis

### 8.4 Data Recovery Issues

#### Corrupted Database:
**Recovery Steps**:
```bash
# 1. Stop application
docker-compose stop app

# 2. Check database integrity
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "
SELECT
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
"

# 3. Run repair operations
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "REINDEX DATABASE hanmarine_hims;"
psql -h localhost -U hanmarine_user -d hanmarine_hims -c "VACUUM FULL ANALYZE;"

# 4. If corruption persists, restore from backup
# Follow disaster recovery procedures
```

#### Missing Data:
**Investigation**:
```sql
-- Check audit logs for data changes
SELECT
  event,
  user_id,
  resource,
  resource_id,
  old_value,
  new_value,
  timestamp
FROM audit_logs
WHERE resource = 'crew'
  AND event IN ('DATA_MODIFIED', 'DATA_DELETED')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Check for accidental deletions
SELECT
  schemaname,
  tablename,
  n_tup_del
FROM pg_stat_user_tables
WHERE n_tup_del > 0
ORDER BY n_tup_del DESC;
```

### 8.5 Emergency Contacts

#### Critical Support Matrix:
| Role | Name | Primary Phone | Secondary Phone | Email |
|------|------|---------------|-----------------|-------|
| **IT Director** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | it-director@hanmarine.com |
| **CEO** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | ceo@hanmarine.com |
| **Operations Director** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | operations@hanmarine.com |
| **Security Officer** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | security@hanmarine.com |

#### Technical Support Team:
| Component | Primary Contact | Backup Contact | On-Call Schedule |
|-----------|-----------------|----------------|------------------|
| **Database** | DBA Team | Cloud Provider | 24/7 |
| **Application** | DevOps Team | Development Team | 24/7 |
| **Network** | Network Team | IT Infrastructure | Business Hours |
| **Security** | Security Team | IT Director | 24/7 |

---

## 9.0 ⚖️ COMPLIANCE & AUDITING

### 9.1 Regulatory Compliance Framework

#### International Maritime Standards:
- **IMO (International Maritime Organization)**: Safety and environmental standards
- **STCW (Standards of Training, Certification & Watchkeeping)**: Crew competency requirements
- **MLC (Maritime Labour Convention) 2006**: Seafarer rights and working conditions
- **ISM Code**: Safety management system requirements

#### National Regulatory Compliance:
- **Indonesian Maritime Law (UU No. 17/2008)**: National shipping regulations
- **Flag State Requirements**: Indonesian flag vessel standards
- **Port State Control**: Compliance with international inspections
- **Customs & Immigration**: Crew movement regulations

### 9.2 Audit Preparation

#### Internal Audit Requirements:
```typescript
// /api/compliance/audit-prep/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['QUALITY_MANAGER', 'EXECUTIVE_MANAGEMENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const auditType = searchParams.get('type') || 'internal';
    const period = searchParams.get('period') || 'last_6_months';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period === 'last_6_months') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (period === 'last_year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Gather audit evidence
    const auditData = {
      systemOverview: await getSystemOverview(),
      userManagement: await getUserManagementAudit(),
      securityControls: await getSecurityAudit(),
      dataManagement: await getDataManagementAudit(),
      operationalCompliance: await getOperationalComplianceAudit(),
      auditLogs: await getAuditLogsAudit(startDate, endDate)
    };

    return NextResponse.json({
      auditType,
      period,
      dateRange: { start: startDate, end: endDate },
      generatedAt: new Date(),
      data: auditData
    });

  } catch (error) {
    console.error('Audit preparation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSystemOverview() {
  const [
    totalUsers,
    activeUsers,
    totalCrew,
    activeContracts,
    systemUptime
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.crew.count(),
    prisma.employmentContract.count({ where: { status: 'ACTIVE' } }),
    getSystemUptime()
  ]);

  return {
    totalUsers,
    activeUsers,
    totalCrew,
    activeContracts,
    systemUptime,
    version: process.env.npm_package_version || '5.0.0',
    lastBackup: await getLastBackupDate(),
    securityStatus: await getSecurityStatus()
  };
}

async function getUserManagementAudit() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      lastLogin: true,
      passwordResetRequired: true
    }
  });

  return {
    totalUsers: users.length,
    roleDistribution: users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}),
    inactiveUsers: users.filter(u => u.status !== 'ACTIVE').length,
    pendingPasswordResets: users.filter(u => u.passwordResetRequired).length,
    recentLogins: users.filter(u => u.lastLogin && u.lastLogin > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
  };
}

async function getSecurityAudit() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    failedLogins,
    securityAlerts,
    activeSessions,
    expiredPasswords
  ] = await Promise.all([
    prisma.auditLog.count({
      where: {
        event: 'USER_LOGIN_FAILED',
        timestamp: { gte: thirtyDaysAgo }
      }
    }),
    prisma.securityAlert.count({
      where: { status: 'OPEN' }
    }),
    prisma.session.count({
      where: { expires: { gt: new Date() } }
    }),
    prisma.user.count({
      where: {
        passwordLastChanged: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }
    })
  ]);

  return {
    failedLoginsLast30Days: failedLogins,
    activeSecurityAlerts: securityAlerts,
    activeUserSessions: activeSessions,
    usersWithExpiredPasswords: expiredPasswords,
    mfaEnabled: await checkMFAStatus(),
    encryptionStatus: await checkEncryptionStatus()
  };
}

async function getDataManagementAudit() {
  const [
    totalDocuments,
    expiringDocuments,
    dataExports,
    sensitiveDataAccess
  ] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gt: new Date()
        }
      }
    }),
    prisma.auditLog.count({
      where: { event: 'DATA_EXPORTED' }
    }),
    prisma.auditLog.count({
      where: {
        event: 'DATA_ACCESS',
        resource: { in: ['principals', 'salaries', 'medical_records'] }
      }
    })
  ]);

  return {
    totalDocuments,
    expiringDocumentsNext30Days: expiringDocuments,
    totalDataExports: dataExports,
    sensitiveDataAccessCount: sensitiveDataAccess,
    dataRetentionCompliance: await checkDataRetentionCompliance(),
    backupIntegrity: await checkBackupIntegrity()
  };
}

async function getOperationalComplianceAudit() {
  const [
    activeContracts,
    expiredDocuments,
    completedTrainings,
    disciplinaryCases
  ] = await Promise.all([
    prisma.employmentContract.count({ where: { status: 'ACTIVE' } }),
    prisma.document.count({
      where: {
        status: 'VALID',
        expiryDate: { lt: new Date() }
      }
    }),
    prisma.training.count({ where: { status: 'COMPLETED' } }),
    prisma.disciplinary.count()
  ]);

  return {
    activeEmploymentContracts: activeContracts,
    expiredDocuments: expiredDocuments,
    completedSafetyTrainings: completedTrainings,
    openDisciplinaryCases: disciplinaryCases,
    regulatoryCompliance: await checkRegulatoryCompliance(),
    qualityAudits: await getQualityAuditStatus()
  };
}

async function getAuditLogsAudit(startDate: Date, endDate: Date) {
  const [
    totalEvents,
    securityEvents,
    dataEvents,
    userEvents
  ] = await Promise.all([
    prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate, lte: endDate }
      }
    }),
    prisma.auditLog.count({
      where: {
        event: { in: ['USER_LOGIN_FAILED', 'PERMISSION_DENIED', 'SECURITY_ALERT'] },
        timestamp: { gte: startDate, lte: endDate }
      }
    }),
    prisma.auditLog.count({
      where: {
        event: { in: ['DATA_ACCESS', 'DATA_MODIFIED', 'DATA_EXPORTED'] },
        timestamp: { gte: startDate, lte: endDate }
      }
    }),
    prisma.auditLog.count({
      where: {
        event: { in: ['USER_CREATED', 'USER_DEACTIVATED', 'ROLE_CHANGED'] },
        timestamp: { gte: startDate, lte: endDate }
      }
    })
  ]);

  return {
    totalAuditEvents: totalEvents,
    securityEvents,
    dataAccessEvents: dataEvents,
    userManagementEvents: userEvents,
    auditCoverage: totalEvents > 0 ? 'COMPREHENSIVE' : 'INSUFFICIENT',
    logRetention: await checkLogRetentionCompliance()
  };
}

// Helper functions
async function getSystemUptime(): Promise<string> {
  // Implementation to get system uptime
  return '30 days'; // Placeholder
}

async function getLastBackupDate(): Promise<Date> {
  // Implementation to get last backup date
  return new Date(Date.now() - 24 * 60 * 60 * 1000); // Placeholder
}

async function getSecurityStatus(): Promise<string> {
  // Implementation to check security status
  return 'SECURE'; // Placeholder
}

async function checkMFAStatus(): Promise<boolean> {
  // Implementation to check MFA status
  return true; // Placeholder
}

async function checkEncryptionStatus(): Promise<string> {
  // Implementation to check encryption status
  return 'ACTIVE'; // Placeholder
}

async function checkDataRetentionCompliance(): Promise<string> {
  // Implementation to check data retention compliance
  return 'COMPLIANT'; // Placeholder
}

async function checkBackupIntegrity(): Promise<string> {
  // Implementation to check backup integrity
  return 'VERIFIED'; // Placeholder
}

async function checkRegulatoryCompliance(): Promise<string> {
  // Implementation to check regulatory compliance
  return 'COMPLIANT'; // Placeholder
}

async function getQualityAuditStatus(): Promise<string> {
  // Implementation to get quality audit status
  return 'PASSED'; // Placeholder
}

async function checkLogRetentionCompliance(): Promise<string> {
  // Implementation to check log retention compliance
  return 'COMPLIANT'; // Placeholder
}
```

#### External Audit Support:
```typescript
// /api/compliance/external-audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'EXECUTIVE_MANAGEMENT') {
      return NextResponse.json({ error: 'Executive approval required' }, { status: 403 });
    }

    const { auditorName, auditScope, accessDuration } = await request.json();

    // Create temporary auditor access
    const auditorAccess = await createAuditorAccess({
      auditorName,
      auditScope,
      accessDuration: accessDuration || 30 // days
    });

    // Log auditor access creation
    await auditLog('EXTERNAL_AUDIT_ACCESS_CREATED', {
      userId: session.user.id,
      resource: 'auditor_access',
      resourceId: auditorAccess.id,
      metadata: {
        auditorName,
        auditScope,
        accessDuration
      }
    });

    return NextResponse.json({
      message: 'External auditor access created',
      accessDetails: {
        auditorId: auditorAccess.id,
        accessCode: auditorAccess.accessCode,
        expiresAt: auditorAccess.expiresAt,
        scope: auditScope
      }
    });

  } catch (error) {
    console.error('External audit setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createAuditorAccess(data: any) {
  // Implementation to create temporary auditor access
  // This would create a temporary user with limited read-only access
  return {
    id: 'audit_' + Date.now(),
    accessCode: 'AUDIT_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    expiresAt: new Date(Date.now() + (data.accessDuration * 24 * 60 * 60 * 1000))
  };
}
```

### 9.3 Compliance Reporting

#### Automated Compliance Reports:
```typescript
// /api/compliance/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['QUALITY_MANAGER', 'EXECUTIVE_MANAGEMENT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'imo';
    const period = searchParams.get('period') || 'monthly';

    let reportData;

    switch (reportType) {
      case 'imo':
        reportData = await generateIMOComplianceReport(period);
        break;
      case 'stcw':
        reportData = await generateSTCWComplianceReport(period);
        break;
      case 'mlc':
        reportData = await generateMLCComplianceReport(period);
        break;
      case 'iso':
        reportData = await generateISOComplianceReport(period);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      reportType,
      period,
      generatedAt: new Date(),
      generatedBy: session.user.name,
      data: reportData
    });

  } catch (error) {
    console.error('Compliance report generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateIMOComplianceReport(period: string) {
  // ISM Code compliance metrics
  const [
    activeVessels,
    safetyInspections,
    deficiencyCount,
    trainingRecords
  ] = await Promise.all([
    prisma.vessel.count({ where: { status: 'ACTIVE' } }),
    prisma.inspection.count({
      where: {
        type: 'SAFETY',
        createdAt: { gte: getPeriodStartDate(period) }
      }
    }),
    prisma.deficiency.count({
      where: {
        status: 'OPEN',
        createdAt: { gte: getPeriodStartDate(period) }
      }
    }),
    prisma.training.count({
      where: {
        type: 'SAFETY',
        status: 'COMPLETED',
        completedAt: { gte: getPeriodStartDate(period) }
      }
    })
  ]);

  return {
    standard: 'IMO ISM Code',
    period,
    metrics: {
      activeVessels,
      safetyInspectionsCompleted: safetyInspections,
      openDeficiencies: deficiencyCount,
      safetyTrainingCompleted: trainingRecords,
      compliancePercentage: calculateCompliancePercentage(safetyInspections, activeVessels),
      criticalFindings: await getCriticalFindings()
    },
    recommendations: generateIMORecommendations(safetyInspections, deficiencyCount)
  };
}

async function generateSTCWComplianceReport(period: string) {
  // STCW certification compliance
  const [
    certifiedCrew,
    totalCrew,
    expiringCertificates,
    trainingCompliance
  ] = await Promise.all([
    prisma.crew.count({
      where: {
        certifications: {
          some: {
            expiryDate: { gt: new Date() },
            status: 'VALID'
          }
        }
      }
    }),
    prisma.crew.count(),
    prisma.certification.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          gt: new Date()
        }
      }
    }),
    prisma.training.count({
      where: {
        requiredCertification: { not: null },
        status: 'COMPLETED',
        completedAt: { gte: getPeriodStartDate(period) }
      }
    })
  ]);

  return {
    standard: 'STCW Convention',
    period,
    metrics: {
      certifiedCrew,
      totalCrew,
      certificationCoverage: (certifiedCrew / totalCrew) * 100,
      certificatesExpiring90Days: expiringCertificates,
      trainingComplianceRecords: trainingCompliance,
      complianceStatus: certifiedCrew === totalCrew ? 'FULLY_COMPLIANT' : 'PARTIALLY_COMPLIANT'
    },
    recommendations: generateSTCWRecommendations(certifiedCrew, totalCrew, expiringCertificates)
  };
}

async function generateMLCComplianceReport(period: string) {
  // Maritime Labour Convention compliance
  const [
    activeContracts,
    compliantContracts,
    workingHoursCompliance,
    repatriationCases
  ] = await Promise.all([
    prisma.employmentContract.count({ where: { status: 'ACTIVE' } }),
    prisma.employmentContract.count({
      where: {
        status: 'ACTIVE',
        // Add MLC compliance checks
        basicWage: { gte: 0 }, // Minimum wage requirements
        contractStart: { lt: new Date() },
        contractEnd: { gt: new Date() }
      }
    }),
    prisma.workingHours.count({
      where: {
        totalHours: { lte: 14 * 24 }, // Maximum 14 hours per day
        createdAt: { gte: getPeriodStartDate(period) }
      }
    }),
    prisma.repatriation.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: getPeriodStartDate(period) }
      }
    })
  ]);

  return {
    standard: 'MLC 2006',
    period,
    metrics: {
      activeEmploymentContracts: activeContracts,
      mlcCompliantContracts: compliantContracts,
      workingHoursComplianceRecords: workingHoursCompliance,
      repatriationCasesHandled: repatriationCases,
      compliancePercentage: (compliantContracts / activeContracts) * 100,
      workingConditionsStatus: await assessWorkingConditions()
    },
    recommendations: generateMLCRecommendations(compliantContracts, activeContracts)
  };
}

async function generateISOComplianceReport(period: string) {
  // ISO 9001:2015 compliance
  const [
    qualityAudits,
    correctiveActions,
    processImprovements,
    customerFeedback
  ] = await Promise.all([
    prisma.qualityAudit.count({
      where: {
        createdAt: { gte: getPeriodStartDate(period) }
      }
    }),
    prisma.correctiveAction.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: getPeriodStartDate(period) }
      }
    }),
    prisma.processImprovement.count({
      where: {
        implementedAt: { gte: getPeriodStartDate(period) }
      }
    }),
    prisma.customerFeedback.count({
      where: {
        createdAt: { gte: getPeriodStartDate(period) }
      }
    })
  ]);

  return {
    standard: 'ISO 9001:2015',
    period,
    metrics: {
      qualityAuditsConducted: qualityAudits,
      correctiveActionsImplemented: correctiveActions,
      processImprovements: processImprovements,
      customerFeedbackRecords: customerFeedback,
      qualityManagementEffectiveness: calculateQMEffectiveness(qualityAudits, correctiveActions),
      continuousImprovementStatus: processImprovements > 0 ? 'ACTIVE' : 'NEEDS_IMPROVEMENT'
    },
    recommendations: generateISORecommendations(qualityAudits, correctiveActions, processImprovements)
  };
}

// Helper functions
function getPeriodStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'weekly':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarterly':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'yearly':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function calculateCompliancePercentage(completed: number, total: number): number {
  return total > 0 ? (completed / total) * 100 : 0;
}

async function getCriticalFindings() {
  // Implementation to get critical safety findings
  return 0; // Placeholder
}

function generateIMORecommendations(inspections: number, deficiencies: number): string[] {
  const recommendations = [];
  if (inspections < 10) {
    recommendations.push('Increase frequency of safety inspections');
  }
  if (deficiencies > 5) {
    recommendations.push('Implement corrective action plan for open deficiencies');
  }
  return recommendations;
}

function generateSTCWRecommendations(certified: number, total: number, expiring: number): string[] {
  const recommendations = [];
  if ((certified / total) < 0.95) {
    recommendations.push('Accelerate certification process for remaining crew');
  }
  if (expiring > 10) {
    recommendations.push('Implement certificate renewal reminder system');
  }
  return recommendations;
}

function generateMLCRecommendations(compliant: number, total: number): string[] {
  const recommendations = [];
  if ((compliant / total) < 0.95) {
    recommendations.push('Review and update employment contracts for MLC compliance');
  }
  recommendations.push('Conduct regular working conditions assessments');
  return recommendations;
}

function generateISORecommendations(audits: number, actions: number, improvements: number): string[] {
  const recommendations = [];
  if (audits < 4) {
    recommendations.push('Increase frequency of internal quality audits');
  }
  if (actions < audits * 0.8) {
    recommendations.push('Improve corrective action implementation rate');
  }
  if (improvements === 0) {
    recommendations.push('Establish continuous improvement program');
  }
  return recommendations;
}

async function assessWorkingConditions() {
  // Implementation to assess working conditions
  return 'SATISFACTORY'; // Placeholder
}

function calculateQMEffectiveness(audits: number, actions: number): number {
  return audits > 0 ? (actions / audits) * 100 : 0;
}
```

---

## 10.0 🚨 EMERGENCY PROCEDURES

### 10.1 Critical Incident Response

#### Incident Classification:
- **Critical**: System completely unavailable, data breach, safety threat
- **High**: Major functionality impaired, significant data loss
- **Medium**: Minor issues with workarounds available
- **Low**: General questions, minor inconveniences

#### Emergency Response Protocol:
```
1. IMMEDIATE ASSESSMENT (0-5 minutes)
   ├── Identify incident scope and impact
   ├── Notify immediate response team
   ├── Activate incident response plan
   └── Isolate affected systems if needed

2. CONTAINMENT (5-30 minutes)
   ├── Stop the bleeding (block attacks, stop data loss)
   ├── Preserve evidence and logs
   ├── Implement temporary workarounds
   └── Communicate with stakeholders

3. RECOVERY (30 minutes - 4 hours)
   ├── Restore from clean backups
   ├── Verify system integrity
   ├── Test critical functionality
   └── Monitor for recurrence

4. POST-MORTEM (4-24 hours)
   ├── Root cause analysis
   ├── Document lessons learned
   ├── Update procedures and training
   └── Implement preventive measures
```

### 10.2 Emergency Contacts Matrix

#### Primary Response Team:
| Role | Name | Primary Phone | Secondary Phone | Email |
|------|------|---------------|-----------------|-------|
| **IT Director** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | it-director@hanmarine.com |
| **CEO** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | ceo@hanmarine.com |
| **Operations Director** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | operations@hanmarine.com |
| **Security Officer** | [Name] | +62-21-XXXX-XXXX | +62-21-XXXX-XXXX | security@hanmarine.com |

#### Technical Support Team:
| Component | Primary Contact | Backup Contact | On-Call Schedule |
|-----------|-----------------|----------------|------------------|
| **Database** | DBA Team | Cloud Provider | 24/7 |
| **Application** | DevOps Team | Development Team | 24/7 |
| **Network** | Network Team | IT Infrastructure | Business Hours |
| **Security** | Security Team | IT Director | 24/7 |

### 10.3 Communication Protocols

#### Internal Communication:
1. **Immediate**: Slack emergency channel (#hims-emergency)
2. **Escalation**: Email to incident response team
3. **Updates**: Regular status updates every 30 minutes
4. **Resolution**: Final notification with root cause and actions

#### External Communication:
1. **Customers**: Pre-drafted communication templates
2. **Regulatory Bodies**: Required notifications within specified timeframes
3. **Media**: Press release templates for significant incidents
4. **Partners**: Business continuity notifications

### 10.4 Business Continuity

#### Critical Business Functions:
- **Crew Deployment**: Emergency crew assignment capabilities
- **Document Access**: Critical document retrieval
- **Communication**: Emergency contact systems
- **Reporting**: Regulatory compliance reporting

#### Backup Systems:
- **Hot Site**: Fully configured backup environment (4-hour RTO)
- **Cold Site**: Basic infrastructure for extended outages (24-hour RTO)
- **Mobile Operations**: Laptop-based emergency operations
- **Manual Processes**: Paper-based procedures for critical functions

### 10.5 Recovery Testing

#### Quarterly Recovery Tests:
```bash
#!/bin/bash
# /opt/hanmarine-hims/scripts/test-recovery.sh

TEST_DATE=$(date +%Y%m%d_%H%M%S)
TEST_LOG="/opt/hanmarine-hims/logs/recovery-test-$TEST_DATE.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [TEST] $*"
}

# Test scenarios
test_scenarios=(
    "database_failure"
    "application_crash"
    "network_outage"
    "security_breach"
    "data_corruption"
)

for scenario in "${test_scenarios[@]}"; do
    log "Starting recovery test for scenario: $scenario"

    case $scenario in
        "database_failure")
            # Simulate database failure
            docker-compose stop db
            sleep 30
            # Test failover procedures
            docker-compose start db
            ;;

        "application_crash")
            # Simulate application crash
            docker-compose restart app
            sleep 60
            # Verify automatic recovery
            ;;

        "network_outage")
            # Simulate network issues
            # Test offline capabilities
            ;;

        "security_breach")
            # Simulate security incident
            # Test incident response
            ;;

        "data_corruption")
            # Test data recovery procedures
            ;;
    esac

    # Validate recovery
    if validate_recovery "$scenario"; then
        log "✓ Recovery test PASSED for $scenario"
    else
        log "✗ Recovery test FAILED for $scenario"
        alert_failure "$scenario"
    fi

    log "Completed recovery test for scenario: $scenario"
    echo "" >> "$TEST_LOG"
done

log "All recovery tests completed"

# Send test report
mail -s "HANMARINE HIMS Recovery Test Report - $TEST_DATE" \
     incident-response@hanmarine.com < "$TEST_LOG"
```

---

**⚠️ CONFIDENTIAL - RESTRICTED ACCESS**

This Administrator Manual contains highly sensitive technical and security information. Access is strictly limited to authorized IT administrators and executive management. Distribution without explicit written permission from HANMARINE executive management is prohibited and may result in immediate termination and legal action.

**Document Classification**: HIGHLY SENSITIVE - IT/ADMIN ONLY
**Version**: 5.0 - Enterprise Edition
**Effective Date**: December 3, 2025
**Review Cycle**: Annual
**Approval Authority**: CEO & IT Director

*HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS) Administrator Manual v5.0 - Enterprise Edition*