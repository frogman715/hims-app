# ✅ PRODUCTION DEPLOYMENT CHECKLIST

**Hanmarine Integrated Management System (HIMS)**  
Pre-deployment verification checklist

Use this checklist to verify all requirements are met before deploying to production.

---

## 📋 PRE-DEPLOYMENT VERIFICATION

### 🖥️ Server Infrastructure

#### Server Access & Setup
- [ ] VPS/Cloud server provisioned
- [ ] SSH access configured and tested
- [ ] Root or sudo privileges confirmed
- [ ] Static IP address assigned
- [ ] Server meets minimum requirements:
  - [ ] CPU: 2+ cores (4+ recommended)
  - [ ] RAM: 4GB+ (8GB+ recommended)
  - [ ] Storage: 40GB+ SSD
  - [ ] OS: Ubuntu 22.04 LTS or 20.04 LTS

#### Required Software Installed
- [ ] Node.js v24.12.0 or v20.x LTS
- [ ] PostgreSQL v16 or v15
- [ ] Nginx (latest stable)
- [ ] PM2 (latest version)
- [ ] Git (latest version)
- [ ] Certbot (for SSL)

#### Network & Firewall
- [ ] Firewall enabled (UFW or iptables)
- [ ] Port 22 (SSH) open and secured
- [ ] Port 80 (HTTP) open
- [ ] Port 443 (HTTPS) open
- [ ] Port 3000 (Next.js) blocked from external access
- [ ] Port 5432 (PostgreSQL) blocked from external access (localhost only)

---

### 🌐 Domain & DNS

#### Domain Configuration
- [ ] Domain registered: `app.hanmarine.co`
- [ ] DNS A record configured: `app.hanmarine.co` → Server IP
- [ ] DNS propagation verified: `nslookup app.hanmarine.co`
- [ ] DNS TTL reduced (optional, for faster propagation)

#### SSL Certificate
- [ ] Let's Encrypt account created (via Certbot)
- [ ] SSL certificate obtained: `sudo certbot --nginx -d app.hanmarine.co`
- [ ] HTTPS access verified: `https://app.hanmarine.co`
- [ ] HTTP to HTTPS redirect configured
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`

---

### 🗄️ Database Setup

#### PostgreSQL Configuration
- [ ] PostgreSQL installed and running
- [ ] Production database created: `hims_prod`
- [ ] Database user created: `hims_prod_user`
- [ ] Strong password set (16+ characters)
- [ ] User privileges granted correctly
- [ ] Schema permissions granted (PostgreSQL 15+)
- [ ] Local connection tested: `psql -U hims_prod_user -d hims_prod -h localhost`

#### Database Connection String
- [ ] DATABASE_URL format correct:
  ```
  postgresql://hims_prod_user:password@localhost:5432/hims_prod?schema=public
  ```
- [ ] Connection tested from application directory
- [ ] PostgreSQL configured for local access only (security)

---

### 📁 Application Setup

#### Repository & Code
- [ ] Repository cloned to `/var/www/hims-app`
- [ ] Correct branch checked out (main or production)
- [ ] `.git` directory present (for future updates)
- [ ] Correct file ownership: `chown -R $USER:$USER /var/www/hims-app`

#### Environment Variables
- [ ] `.env.production.example` reviewed
- [ ] `.env.production` created from example
- [ ] All required variables configured:
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` (correct connection string)
  - [ ] `NEXTAUTH_SECRET` (32+ characters)
  - [ ] `NEXTAUTH_URL=https://app.hanmarine.co`
  - [ ] `HIMS_CRYPTO_KEY` (32+ characters)
  - [ ] `COMPANY_NAME`, `COMPANY_EMAIL`, etc.
- [ ] File permissions set: `chmod 600 .env.production`

#### Build Process
- [ ] Dependencies installed: `npm install --production`
- [ ] Application built successfully: `npm run build`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] `.next/standalone/server.js` exists
- [ ] Build directory size reasonable (< 1GB)
- [ ] No build errors or warnings

#### Database Migrations
- [ ] Migrations applied: `npx prisma migrate deploy`
- [ ] Migration status verified: `npx prisma migrate status`
- [ ] All migrations applied successfully
- [ ] No pending migrations

#### Initial Data Seeding (Optional)
- [ ] Seed script reviewed: `scripts/seed.js`
- [ ] Admin user seeded: `npm run seed`
- [ ] Admin credentials documented
- [ ] Test login successful

---

### 🔧 Process Management (PM2)

#### PM2 Configuration
- [ ] PM2 installed globally: `npm list -g pm2`
- [ ] `ecosystem.config.js` verified at root
- [ ] PM2 config references correct paths
- [ ] Environment file path correct in config

#### Application Start
- [ ] Application started: `pm2 start ecosystem.config.js --env production`
- [ ] Application status: `pm2 status` shows "online"
- [ ] No errors in logs: `pm2 logs hims-app --lines 50`
- [ ] Application responds: `curl http://localhost:3000/api/health`
- [ ] Response is: `{"status":"ok"}`

#### PM2 Persistence
- [ ] Process list saved: `pm2 save`
- [ ] Startup script created: `pm2 startup systemd`
- [ ] Startup command executed (from PM2 output)
- [ ] PM2 will restart on server reboot

---

### 🌐 Nginx Configuration

#### Nginx Setup
- [ ] Nginx installed and running
- [ ] Configuration file created: `/etc/nginx/sites-available/hims-app`
- [ ] Configuration copied from `nginx.conf` in repository
- [ ] Server name updated: `server_name app.hanmarine.co;`
- [ ] Symbolic link created: `/etc/nginx/sites-enabled/hims-app`
- [ ] Default site disabled (optional)

#### Nginx Testing
- [ ] Configuration syntax verified: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Nginx status: `sudo systemctl status nginx` shows "active"
- [ ] HTTP access works: `curl http://app.hanmarine.co`
- [ ] HTTPS access works: `curl https://app.hanmarine.co`

#### Nginx Features Verified
- [ ] HTTP to HTTPS redirect working
- [ ] SSL certificate configured
- [ ] Security headers present: `curl -I https://app.hanmarine.co`
- [ ] Gzip compression enabled
- [ ] Static file caching configured
- [ ] Reverse proxy to port 3000 working

---

### 🔒 Security Hardening

#### Application Security
- [ ] `.env.production` permissions: `chmod 600`
- [ ] `.env.production` NOT in git: verify `.gitignore`
- [ ] Strong secrets generated (32+ characters):
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `HIMS_CRYPTO_KEY`
  - [ ] `SCHEDULER_SECRET_TOKEN` (if using)
- [ ] Database password is strong (16+ characters)
- [ ] Admin password will be changed on first login

#### Server Security
- [ ] Firewall enabled: `sudo ufw status`
- [ ] SSH key authentication configured
- [ ] Password authentication disabled (optional but recommended)
- [ ] Root login disabled (optional but recommended)
- [ ] Fail2ban installed and configured (optional)
- [ ] Automatic security updates enabled

#### PostgreSQL Security
- [ ] PostgreSQL only listening on localhost
- [ ] No remote database access (unless needed)
- [ ] Database user has minimum required privileges
- [ ] PostgreSQL log files reviewed

#### Nginx Security
- [ ] Security headers configured (in nginx.conf):
  - [ ] `Strict-Transport-Security` (HSTS)
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-XSS-Protection`
  - [ ] `Referrer-Policy`
  - [ ] `Permissions-Policy`
- [ ] SSL protocols: TLSv1.2 and TLSv1.3 only
- [ ] Strong cipher suites configured
- [ ] Rate limiting considered (optional)

---

### ✅ Functional Testing

#### Application Access
- [ ] Homepage loads: `https://app.hanmarine.co`
- [ ] SSL certificate valid (browser padlock icon)
- [ ] No mixed content warnings
- [ ] Login page accessible: `/auth/signin`
- [ ] Static assets loading (CSS, images)

#### Authentication & Authorization
- [ ] Admin can login with seeded credentials
- [ ] JWT session working
- [ ] User session persists across page refreshes
- [ ] Logout works correctly
- [ ] Unauthorized access redirects to login

#### Core Functionality
- [ ] Dashboard loads and displays data
- [ ] API endpoints respond correctly:
  - [ ] `/api/health` returns 200 OK
  - [ ] `/api/crew` (with auth) works
  - [ ] Other key endpoints tested
- [ ] Database queries executing properly
- [ ] No JavaScript console errors

#### Module Testing
- [ ] Crew management module
- [ ] Crewing operations module
- [ ] Contract management module
- [ ] Document management module
- [ ] Compliance module
- [ ] Accounting module

#### Data Operations
- [ ] Create operations work (e.g., add crew member)
- [ ] Read operations work (e.g., view crew list)
- [ ] Update operations work (e.g., edit crew)
- [ ] Delete operations work (e.g., remove crew)
- [ ] File upload works (if applicable)
- [ ] File download works (if applicable)

---

### 📊 Performance & Monitoring

#### Performance Metrics
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] No memory leaks: `pm2 monit`
- [ ] Server resources within limits:
  - [ ] CPU usage < 50% idle
  - [ ] Memory usage < 70%
  - [ ] Disk usage < 80%

#### Monitoring Setup
- [ ] PM2 monitoring: `pm2 monit`
- [ ] Application logs accessible: `pm2 logs hims-app`
- [ ] Nginx logs accessible:
  - [ ] `/var/log/nginx/hims-app-access.log`
  - [ ] `/var/log/nginx/hims-app-error.log`
- [ ] PostgreSQL logs accessible
- [ ] System logs accessible: `/var/log/syslog`

#### Automated Monitoring (Optional)
- [ ] Uptime monitoring configured (e.g., UptimeRobot)
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Application monitoring configured (e.g., New Relic)
- [ ] Log aggregation configured (e.g., Logstash)

---

### 💾 Backup & Recovery

#### Backup Configuration
- [ ] Database backup script created
- [ ] Backup directory created: `/var/backups/hims`
- [ ] Backup script tested manually
- [ ] Cron job configured for automated backups
- [ ] Backup frequency: Daily at 2 AM
- [ ] Backup retention: 30 days

#### Backup Verification
- [ ] Database backup successful
- [ ] Backup file created and compressed
- [ ] Backup file size reasonable
- [ ] Test restore from backup (on separate database)
- [ ] Uploads directory backup configured

#### Recovery Procedures
- [ ] Rollback procedure documented
- [ ] Database restore procedure tested
- [ ] Application rollback procedure tested
- [ ] Emergency contact information documented

---

### 📚 Documentation

#### Required Documentation
- [ ] [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) reviewed
- [ ] `.env.production.example` completed and up-to-date
- [ ] `nginx.conf` reviewed and configured
- [ ] `ecosystem.config.js` verified
- [ ] Admin credentials securely stored
- [ ] Database credentials securely stored

#### Team Documentation
- [ ] Deployment procedure shared with team
- [ ] Server access credentials shared securely
- [ ] Emergency procedures documented
- [ ] Maintenance schedule documented
- [ ] Support contact information documented

#### User Documentation
- [ ] User guide created/updated
- [ ] Admin guide created/updated
- [ ] Training materials prepared
- [ ] FAQ document created

---

### 🚀 Final Verification

#### Pre-Launch Checklist
- [ ] All above sections completed ✅
- [ ] No outstanding errors in logs
- [ ] All tests passed
- [ ] Stakeholders notified of launch
- [ ] Support team briefed and ready
- [ ] Rollback plan confirmed and tested

#### Launch Verification
- [ ] Application accessible: `https://app.hanmarine.co`
- [ ] SSL certificate valid and trusted
- [ ] Login with admin credentials successful
- [ ] Key features tested and working
- [ ] No errors in browser console
- [ ] No errors in application logs
- [ ] No errors in Nginx logs
- [ ] Database connection stable

#### Post-Launch Monitoring (First 24 Hours)
- [ ] Application uptime: 100%
- [ ] No critical errors reported
- [ ] Performance metrics within acceptable range
- [ ] User feedback collected
- [ ] Team available for support

---

## 🎯 DEPLOYMENT APPROVAL

### Sign-Off

**Technical Lead**:  
- Name: ________________  
- Date: ________________  
- Signature: ________________

**System Administrator**:  
- Name: ________________  
- Date: ________________  
- Signature: ________________

**Project Manager**:  
- Name: ________________  
- Date: ________________  
- Signature: ________________

---

## 📞 EMERGENCY CONTACTS

### Technical Team
- **Lead Developer**: [Name] - [Email] - [Phone]
- **System Admin**: [Name] - [Email] - [Phone]
- **DevOps**: [Name] - [Email] - [Phone]

### Hosting Provider
- **Provider**: [Name]
- **Support**: [Phone/Email]
- **Account**: [Account ID]

### Third-Party Services
- **Domain Registrar**: [Name] - [Support Contact]
- **SSL Provider**: Let's Encrypt (free)
- **Email Service**: [Provider] - [Support Contact]

---

## 📝 NOTES

### Deployment Date & Time
- **Scheduled**: ________________
- **Actual**: ________________

### Known Issues
- _List any known issues or limitations_

### Post-Deployment Tasks
- _List any tasks to be completed after deployment_

---

## ✅ CHECKLIST COMPLETION

**Total Items**: ~150+  
**Completed**: _____ / ~150+  
**Completion %**: _____%

**Status**: 
- [ ] ✅ Ready for Production
- [ ] ⚠️ Issues to Resolve
- [ ] ❌ Not Ready

**Final Notes**:
_Add any final notes or comments here_

---

**Document Version**: 1.0  
**Last Updated**: January 11, 2026  
**Maintained by**: HIMS Development Team

---

## 📖 RELATED DOCUMENTS

- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Complete deployment guide
- [.env.production.example](.env.production.example) - Environment variables template
- [nginx.conf](nginx.conf) - Nginx configuration
- [ecosystem.config.js](ecosystem.config.js) - PM2 configuration
- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) - Additional deployment notes
