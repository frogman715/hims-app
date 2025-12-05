# 🚀 QUICK START GUIDE - HIMS

## ⚡ Fast Track Setup (5 Minutes)

### 1. Generate Secrets (REQUIRED)

```bash
cd /home/docter203/hanmarine_hims/hims-app

# Generate all secrets at once
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "HIMS_CRYPTO_KEY=$(openssl rand -base64 32)" >> .env.local
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)" >> .env.local
```

### 2. Create .env File

```bash
# Copy template
cp .env.example .env

# Open and paste your secrets
nano .env
```

**Minimal .env:**
```env
DATABASE_URL="postgresql://postgres:YOUR_GENERATED_PASSWORD@localhost:5434/hims"
POSTGRES_PASSWORD="YOUR_GENERATED_PASSWORD"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_GENERATED_32_CHAR_SECRET"
HIMS_CRYPTO_KEY="YOUR_GENERATED_32_CHAR_KEY"

# External Systems (Optional)
KOSMA_BASE_URL="https://www.marinerights.or.kr"
DEPHUB_BASE_URL="https://pelaut.dephub.go.id"
SCHENGEN_VISA_BASE_URL="https://consular.mfaservices.nl"
```

### 3. Verify & Start

```bash
# Verify environment
bash scripts/verify-env.sh

# Install & setup
npm install
docker-compose up -d db
npx prisma migrate deploy
npx prisma generate
npm run seed

# Start application
npm run dev
```

### 4. Login & Test

1. Open: http://localhost:3000
2. Login: `admin@hims.com` / `admin123`
3. Go to Dashboard
4. Scroll down to see "External Compliance Systems" widget
5. Click "View All Compliance Records →"

---

## 🌐 External Systems Setup

### KOSMA (Korea)

**For each crew on Korean vessels:**

1. Go to: https://www.marinerights.or.kr
2. Create individual account
3. Complete 3-hour online training
4. Download certificate
5. In HIMS:
   - Go to `/compliance/external`
   - Click "Add New"
   - Select "KOSMA Certificate"
   - Enter certificate details
   - Set expiry date (1 year from issue)

### Dephub (Indonesia)

**Company account required:**

1. Login at: https://pelaut.dephub.go.id/login-perusahaan
2. Use company SIUPAK credentials
3. In HIMS:
   - Track certificate verification status
   - Link to Dephub for authenticity checks

### Schengen Visa NL

**For tanker crew:**

1. Apply at: https://consular.mfaservices.nl
2. Track application status
3. In HIMS:
   - Record visa application details
   - Update when approved
   - Set expiry tracking

---

## 📊 Dashboard Features

### Director Dashboard
- Executive KPI cards
- Crew movement pipeline
- Risk alerts
- **External Compliance Widget** ← NEW!
- Quick actions

### External Compliance Widget Shows:
- **KOSMA**: Total/Verified/Expired/Pending
- **Dephub**: Certificate validation status
- **Schengen**: Visa application tracking
- Direct links to external portals

---

## 🔧 Common Commands

```bash
# Start everything
docker-compose up -d && npm run dev

# Stop everything
docker-compose down

# Reset database (CAUTION!)
docker-compose down -v
docker-compose up -d db
npx prisma migrate deploy
npm run seed

# Check environment
bash scripts/verify-env.sh

# View logs
docker-compose logs -f

# Access database
docker exec -it hims-db psql -U postgres -d hims
```

---

## 🎯 What's Changed? (For Existing Users)

### Security Improvements
✅ **Fixed crypto** - Secure AES-256-GCM encryption
✅ **Security headers** - CSP, HSTS, X-Frame-Options
✅ **Rate limiting** - Protection against brute force
✅ **Error boundaries** - Graceful error handling
✅ **Centralized errors** - No more exposed stack traces

### New Features
🆕 **KOSMA integration** - Track Korean training certificates
🆕 **Dephub integration** - Indonesian certificate validation
🆕 **Schengen Visa** - EU visa tracking for tanker crew
🆕 **Dashboard widget** - Real-time compliance overview
🆕 **API middleware** - Cleaner, more secure code patterns

### Documentation
📚 **DEPLOYMENT.md** - Complete deployment guide
📚 **UPGRADE_SUMMARY.md** - Full list of changes
📚 **.env.example** - Environment template
📚 **verify-env.sh** - Automatic verification script

---

## ❓ Troubleshooting

### Can't Login
```bash
# Check environment
grep NEXTAUTH_SECRET .env

# Restart
docker-compose restart app
```

### Widget Not Loading
```bash
# Test API
curl http://localhost:3000/api/external-compliance/stats

# Check database
docker exec -it hims-db psql -U postgres -d hims -c "\dt external*"
```

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

---

## 🎓 Next Steps

1. **Change admin password** in Settings
2. **Create user accounts** for your team
3. **Set up external systems**:
   - Register on KOSMA, Dephub, Schengen portals
   - Add credentials to your accounts
4. **Import crew data**
5. **Add compliance records**
6. **Train your team**

---

## 📞 Support

**Documentation:**
- Setup: `DEPLOYMENT.md`
- Changes: `UPGRADE_SUMMARY.md`
- API: `.github/copilot-instructions.md`

**Health Check:**
http://localhost:3000/admin/system-health

**External Compliance:**
http://localhost:3000/compliance/external

---

**🎉 You're all set! Happy sailing! ⚓🚢**
