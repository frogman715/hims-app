# 🚀 HIMS DEPLOYMENT GUIDE

## Prerequisites Checklist
- [ ] Docker & Docker Compose installed
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 16 (via Docker)
- [ ] 4GB+ RAM available
- [ ] Port 3000 and 5434 available

## 🔐 Security Setup (CRITICAL - Do First!)

### 1. Generate Strong Secrets

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Generate HIMS_CRYPTO_KEY (32+ characters for AES-256)
openssl rand -base64 32

# Generate strong database password
openssl rand -base64 24
```

### 2. Create `.env` File

Copy `.env.example` to `.env` and fill with YOUR generated secrets:

```bash
cp .env.example .env
```

**IMPORTANT**: Edit `.env` and replace ALL `CHANGE_ME_*` values with your generated secrets!

```env
# Example (DON'T USE THESE - Generate your own!)
DATABASE_URL="postgresql://postgres:YOUR_GENERATED_PASSWORD@localhost:5434/hims"
POSTGRES_PASSWORD="YOUR_GENERATED_PASSWORD"
NEXTAUTH_SECRET="YOUR_GENERATED_32_CHAR_SECRET"
HIMS_CRYPTO_KEY="YOUR_GENERATED_32_CHAR_KEY"
```

### 3. Security Verification

```bash
# Check .env is NOT committed to git
git status  # Should show .env is ignored

# Verify secrets are set
grep -q "CHANGE_ME" .env && echo "⚠️ WARNING: Default secrets detected!" || echo "✅ Secrets configured"
```

## 📦 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d db

# Wait for database to be healthy
docker-compose ps

# Check logs if needed
docker-compose logs db
```

### 3. Run Database Migrations

```bash
# Run all migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 4. Seed Initial Data

```bash
# Create admin user and sample data
npm run seed
```

**Default Admin Credentials** (CHANGE IMMEDIATELY after first login):
- Email: `admin@hanmarine.com`
- Password: `admin123`

### 5. Start Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
# Build application
npm run build

# Start production server
npm start
```

Access at: `http://localhost:3000`

## 🌐 External System Integrations

HIMS integrates with three external maritime compliance systems:

### 1. KOSMA (Korea Maritime Safety)
- **URL**: https://www.marinerights.or.kr
- **Purpose**: 3-hour online training certification for Korea-flagged vessels
- **Validity**: 1 year
- **Required**: Before every crew member joins a Korean vessel
- **Process**: 
  1. Create individual account on KOSMA portal
  2. Complete 3-hour online training
  3. Receive certificate
  4. Add certificate to HIMS External Compliance module

### 2. Dephub Indonesia (Perhubungan)
- **URL**: https://pelaut.dephub.go.id/login-perusahaan
- **Purpose**: Validate seafarer certificates (sijil) and seaman book
- **Features**:
  - Verify certificate authenticity (online/offline)
  - Required for international voyages
  - Company account required (legal SIUPAK holders only)
- **Usage in HIMS**: Track and verify Dephub certificates

### 3. Schengen Visa NL (Netherlands)
- **URL**: https://consular.mfaservices.nl
- **Purpose**: Schengen visa application for crew on tanker vessels
- **Required**: Crew joining vessels without visa must apply
- **Process**:
  1. Submit application online
  2. Track status in HIMS
  3. Update when approved/received

### Accessing External Compliance

**In Dashboard:**
- Widget shows real-time status of all three systems
- Click "Open Portal →" to access external sites
- Click "View All Compliance Records →" for detailed management

**Direct Management:**
Navigate to: `Compliance > External Systems` or `/compliance/external`

## 🔧 Post-Installation Configuration

### 1. Change Default Admin Password

```bash
# Login at http://localhost:3000/auth/signin
# Go to Settings > Change Password
```

### 2. Create User Accounts

Based on roles:
- **DIRECTOR**: Full system access
- **CDMO**: Crew operations management
- **OPERATIONAL**: Daily operations
- **ACCOUNTING**: Financial records
- **HR**: Human resources
- **CREW_PORTAL**: Crew member access

### 3. Configure External Compliance

1. Navigate to `Compliance > External Systems`
2. For each crew member:
   - Add KOSMA certificate (if applicable)
   - Add Dephub verification status
   - Add Schengen visa status (if applicable)

### 4. System Health Check

Visit: `http://localhost:3000/admin/system-health`

Check:
- [ ] Database connection
- [ ] Authentication working
- [ ] Permissions enforced
- [ ] External compliance widgets loading

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Check database is running
docker-compose ps

# Restart database
docker-compose restart db

# Check connection
docker exec -it hims-db psql -U postgres -d hims -c "SELECT 1;"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
NEXTAUTH_URL="http://localhost:3001"
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma client
npx prisma generate

# If still fails, clean and rebuild
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### Prisma Shadow Database Permission Error

If `npx prisma migrate dev` fails with `Error: P3014` stating that the shadow database cannot be created, the connected PostgreSQL role lacks `CREATE DATABASE` privileges. Generate the migration manually and apply it with `prisma migrate deploy`:

1. Create a manual SQL script from the current schema diff:

  ```bash
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  npx prisma migrate diff \
    --from-migrations prisma/migrations \
    --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/${TIMESTAMP}_manual/migration.sql
  ```

2. Review the SQL and apply migrations without a shadow database:

  ```bash
  npx prisma migrate deploy
  ```

3. Commit the new migration folder. Other environments can replay it with `prisma migrate deploy` without elevated permissions.

Optionally, configure `PRISMA_MIGRATE_SHADOW_DATABASE_URL` to point at a separate Postgres instance that allows temporary database creation when running `prisma migrate dev` locally.

### Authentication Issues

```bash
# Verify NEXTAUTH_SECRET is set
grep NEXTAUTH_SECRET .env

# Clear browser cookies/cache
# Restart application
npm run dev
```

### External Compliance Widget Not Loading

1. Check API endpoint: `http://localhost:3000/api/external-compliance/stats`
2. Verify database has `ExternalCompliance` table:
   ```bash
   docker exec -it hims-db psql -U postgres -d hims -c "\dt"
   ```
3. Run migration if table missing:
   ```bash
   npx prisma migrate deploy
   ```

## 📊 Monitoring & Logs

### Application Logs

```bash
# Development logs (stdout)
npm run dev

# Production logs
pm2 logs hims-app  # if using PM2
docker-compose logs app  # if using Docker
```

### Database Logs

```bash
# View PostgreSQL logs
docker-compose logs db

# Access database shell
docker exec -it hims-db psql -U postgres -d hims
```

## 🔒 Production Deployment

### Environment Variables

**CRITICAL**: Update these for production:

```env
NODE_ENV="production"
NEXTAUTH_URL="https://your-domain.com"
DATABASE_URL="postgresql://user:password@production-db:5432/hims"

# Use strong, unique secrets (not from examples!)
NEXTAUTH_SECRET="<64-character-minimum-secret>"
HIMS_CRYPTO_KEY="<32-character-minimum-key>"
```

### Security Checklist

- [ ] All secrets changed from defaults
- [ ] HTTPS enabled (NEXTAUTH_URL uses https://)
- [ ] Database password is strong (20+ chars)
- [ ] `.env` file has proper permissions (600)
- [ ] Firewall configured (only 80/443 open)
- [ ] Database not exposed to internet
- [ ] Regular backups configured
- [ ] Rate limiting enabled (see middleware)
- [ ] Security headers configured (check next.config.ts)

### Docker Production Build

```bash
# Build production image
docker-compose build

# Start all services
docker-compose up -d

# Check health
docker-compose ps
```

### Database Backups

```bash
# Create backup
docker exec -t hims-db pg_dump -U postgres hims > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20251204.sql | docker exec -i hims-db psql -U postgres -d hims
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check system health dashboard
- Review expired certificates
- Monitor external compliance status

**Weekly:**
- Backup database
- Review security logs
- Update crew compliance records

**Monthly:**
- Renew KOSMA certificates (1-year validity)
- Update Prisma dependencies
- Security patches

### Getting Help

1. Check logs: `docker-compose logs`
2. Review error messages in browser console
3. Check database connectivity
4. Verify environment variables are set
5. Review documentation in `/docs` folder

## 🎯 Quick Reference

### Common Commands

```bash
# Start everything
docker-compose up -d && npm run dev

# Stop everything
docker-compose down && pkill -f "next dev"

# Reset database (CAUTION: Deletes all data!)
docker-compose down -v
docker-compose up -d db
npx prisma migrate deploy
npm run seed

# Update dependencies
npm update
npx prisma generate

# Check system status
curl http://localhost:3000/api/health
```

### Important URLs

- Application: `http://localhost:3000`
- Login: `http://localhost:3000/auth/signin`
- Dashboard: `http://localhost:3000/dashboard`
- External Compliance: `http://localhost:3000/compliance/external`
- System Health: `http://localhost:3000/admin/system-health`

---

**🚀 You're all set! Access HIMS at http://localhost:3000**
