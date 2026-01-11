# 🚀 Upload System Deployment - Quick Commands Reference

## For: VPS Deployment at Hostinger

### Pre-Deployment Checklist

```bash
# 1. SSH to VPS
ssh hanmarine@your-vps-ip

# 2. Create upload directory
mkdir -p /home/hanmarine/seafarers_files
chmod 755 /home/hanmarine/seafarers_files

# 3. Create backup directory
mkdir -p /home/hanmarine/backups
chmod 755 /home/hanmarine/backups
```

### Environment Configuration

Edit `.env.production`:

```bash
cd /home/hanmarine/projects/hims-app
nano .env.production
```

Add these lines:

```env
UPLOAD_BASE_DIR=/home/hanmarine/seafarers_files
UPLOAD_MAX_SIZE_MB=20
```

### Deploy Commands

```bash
# Navigate to project
cd /home/hanmarine/projects/hims-app

# Pull latest code
git fetch origin
git checkout copilot/find-upload-configuration
git pull origin copilot/find-upload-configuration

# Install dependencies (if package.json changed)
npm install

# Build application
npm run build

# Restart with PM2
pm2 reload ecosystem.config.js --env production

# Check status
pm2 status
pm2 logs hims-app --lines 50
```

### Verify Deployment

```bash
# Check environment variables
pm2 env hims-app | grep UPLOAD

# Check upload directory
ls -la /home/hanmarine/seafarers_files

# Check logs for errors
pm2 logs hims-app --err | grep UPLOAD

# Monitor real-time logs
pm2 logs hims-app | grep "UPLOAD\|FILE_SERVER"
```

### Setup Automated Backup

```bash
# Edit crontab
crontab -e

# Add this line (backup at 2 AM daily)
0 2 * * * /home/hanmarine/projects/hims-app/backup-uploads.sh >> /var/log/hims-backup.log 2>&1

# Verify cron
crontab -l
```

### Test Upload Functionality

1. **Login to app:** https://app.hanmarine.co
2. **Test photo upload:** Crew Management → Seafarer → Upload Photo
3. **Test document upload:** Documents → Upload Document
4. **Verify files created:**
   ```bash
   ls -lR /home/hanmarine/seafarers_files | head -50
   ```

### Troubleshooting Commands

```bash
# Permission issues
sudo chown -R hanmarine:hanmarine /home/hanmarine/seafarers_files
chmod -R 755 /home/hanmarine/seafarers_files

# Check disk space
df -h /home/hanmarine
du -sh /home/hanmarine/seafarers_files

# View upload errors
pm2 logs hims-app --err | tail -100 | grep UPLOAD

# Restart app
pm2 restart hims-app
pm2 flush hims-app  # Clear old logs
```

### Rollback Plan (if needed)

```bash
cd /home/hanmarine/projects/hims-app

# Switch back to main branch
git checkout main
git pull origin main

# Rebuild
npm run build

# Restart
pm2 restart hims-app
```

### Migration from Old System (Optional)

```bash
# Preview migration
cd /home/hanmarine/projects/hims-app
./scripts/migrate-old-uploads.sh

# Execute migration
DRY_RUN=false ./scripts/migrate-old-uploads.sh

# Check results
ls -lR /home/hanmarine/seafarers_files
```

### Emergency Contacts & Resources

- **Full Deployment Guide:** [DEPLOYMENT_UPLOAD_GUIDE.md](./DEPLOYMENT_UPLOAD_GUIDE.md)
- **Technical Reference:** [UPLOAD_SYSTEM_TECHNICAL_REFERENCE.md](./UPLOAD_SYSTEM_TECHNICAL_REFERENCE.md)
- **PM2 Process Manager:** https://pm2.keymetrics.io/docs/usage/quick-start/

### Key Files Modified

```
✅ src/lib/upload-path.ts                          # New utility
✅ src/app/api/files/[...path]/route.ts           # New file server
✅ src/app/api/crewing/seafarers/[id]/photo/route.ts
✅ src/app/api/documents/route.ts
✅ src/app/api/hgf/documents/upload/route.ts
✅ src/app/api/mobile/crew/upload/route.ts
✅ .env.production.example
✅ backup-uploads.sh
✅ deploy/config/pm2/ecosystem.config.js
```

### Success Criteria

- [x] Upload directory created and accessible
- [x] Environment variables set correctly
- [x] Application builds without errors
- [x] PM2 shows app running
- [x] Can upload photo via UI
- [x] Can upload document via UI
- [x] Files appear in `/home/hanmarine/seafarers_files/{crewId}_{slug}/`
- [x] Backup cron job configured
- [x] No permission errors in logs

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Verified By:** _____________  
**Status:** ⬜ Success  ⬜ Issues (see notes)  

**Notes:**
