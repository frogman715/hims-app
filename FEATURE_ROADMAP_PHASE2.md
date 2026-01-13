# 🚀 FEATURE ROADMAP - POST DEPLOYMENT (Q1 2026)

**Current Status:** Deployment 98% complete → Ready for new features  
**Date:** January 13, 2026  
**Priority:** Phase 2 & 3 Feature Implementation  

---

## 📋 AVAILABLE FEATURES TO BUILD (By Priority)

### 🔴 **PRIORITY 1: Critical Features** (Week 1-2)

#### **1.1 PDF Generation for Forms** 
**Status:** ⏳ Needs implementation  
**Effort:** 3-4 days  
**Impact:** 🔴 HIGH - Blocks form workflow  

```
What:
- Generate PDF from form data
- Multiple format templates (Letter Guarantee, Medical, Training)
- Email with PDF attachment
- Download & print from UI

Why:
- Forms workflow incomplete without PDF
- Users need hardcopy for documentation
- Required for external agencies (embassy, airport)

How:
- Use: puppeteer OR html-pdf OR pdfkit
- Library: puppeteer (recommended, more reliable)
- Files to create:
  * /src/lib/pdf/generator.ts (core)
  * /src/lib/pdf/templates/* (form templates)
  * /src/app/api/forms/[id]/pdf/route.ts (API endpoint)
  * Update /src/app/*/forms/[id]/page.tsx (download button)

Tech Stack:
- puppeteer (or html2pdf)
- Font: Arial, Courier, Helvetica
- Formatting: A4 paper, portrait
- Performance: Generate in background job (not sync)

Success Criteria:
✓ Letter Guarantee PDF works
✓ Medical Form PDF works  
✓ Training Form PDF works
✓ Email with PDF attachment works
✓ Download from UI works
✓ File size < 500KB

Estimated Effort: 3-4 days (1 developer)
```

#### **1.2 Email Notifications & Alerts**
**Status:** ⏳ Needs implementation  
**Effort:** 2-3 days  
**Impact:** 🔴 HIGH - Improves user adoption  

```
What:
- Auto-send email on form status change
- Daily digest of pending tasks
- Alert when document expiring
- Reminder for crew departure

Why:
- Users won't know form is ready
- Teams miss deadlines
- Documents expire without notice
- Poor user experience

How:
- Use: SendGrid OR AWS SES (recommendation: SendGrid)
- Files to create:
  * /src/lib/email/templates/* (HTML templates)
  * /src/lib/email/sender.ts (core)
  * /src/app/api/email/send/route.ts
  * Update: Database models (add emailAddress field if missing)
  * Update: API routes (add email on status change)

Email Types:
1. Form Status Changed (pending → approved)
2. Form Pending Review (reminder)
3. Document Expiring Soon (14 days, 7 days, 1 day)
4. Crew Departure Checklist (7 days before)
5. Medical Clearance Needed
6. Daily Task Digest

Template Files Needed:
- form-status-changed.html
- form-pending-reminder.html
- document-expiring.html
- crew-departure.html
- task-digest.html

Success Criteria:
✓ Email on form approved
✓ Daily digest working
✓ Document alert 14/7/1 days before
✓ Email format professional
✓ Unsubscribe option available
✓ Retry mechanism for failed sends

Estimated Effort: 2-3 days (1 developer)
```

#### **1.3 Real-time Notifications (WebSocket)**
**Status:** ⏳ Optional but nice-to-have  
**Effort:** 2-3 days  
**Impact:** 🟡 MEDIUM - Nice UX improvement  

```
What:
- Real-time updates in UI (new form, status change)
- Live crew movement tracking
- Instant approval notifications
- No page refresh needed

Why:
- Better UX experience
- Dashboard stays current
- Users know immediately when action needed
- Professional SPA feel

How:
- Use: Socket.io OR Next.js built-in WebSocket
- Files to create:
  * /src/lib/websocket/* (connection manager)
  * /src/hooks/useWebSocket.ts (React hook)
  * Update: API routes (emit on changes)

Success Criteria:
✓ Real-time form status in dashboard
✓ Crew movement updates live
✓ No duplicate notifications
✓ Graceful disconnect/reconnect
✓ Mobile-friendly

Estimated Effort: 2-3 days (1-2 developers)
```

---

### 🟠 **PRIORITY 2: User Experience** (Week 2-3)

#### **2.1 Dashboard Enhancements**
**Status:** ⏳ Partially done, needs enhancement  
**Effort:** 2 days  
**Impact:** 🟡 MEDIUM  

```
Current: Basic dashboard with KPI cards
Needed:
- ✅ Crew movement timeline (visual)
- ✅ Document expiry dashboard
- ✅ Form approval queue
- ✅ Quick stats for CDMO
- ✅ Performance charts (crew utilization, cost)

Files to update:
- /src/app/dashboard/DashboardClient.tsx
- /src/app/dashboard/components/*.tsx
- /src/app/api/dashboard/* (new endpoints if needed)

Estimated Effort: 2 days (1 developer)
```

#### **2.2 Advanced Search & Filtering**
**Status:** ⏳ Basic search exists, needs enhancement  
**Effort:** 2-3 days  
**Impact:** 🟡 MEDIUM  

```
Current: Text search for crew
Needed:
- ✅ Filter by status, rank, vessel
- ✅ Date range filters (expiry, deployment)
- ✅ Saved search filters (user preferences)
- ✅ Export filtered results (Excel, CSV)
- ✅ Advanced search syntax (name:"Ricky" rank:"Chief")

Files to update/create:
- /src/components/SearchFilters.tsx (new)
- /src/app/crewing/seafarers/page.tsx
- /src/app/api/seafarers/search

Estimated Effort: 2-3 days (1 developer)
```

#### **2.3 Mobile App Improvements**
**Status:** ⏳ Mobile route exists, needs enhancement  
**Effort:** 3-4 days  
**Impact:** 🟡 MEDIUM  

```
Current: Basic mobile menu
Needed:
- ✅ Offline capability (PWA)
- ✅ Crew app for check-in
- ✅ Mobile forms (signature capture)
- ✅ Document view on phone
- ✅ QR code for quick access

Files to update/create:
- /public/manifest.json (PWA manifest)
- /src/app/(mobile)/* (expand routes)
- /src/lib/offline/* (offline storage)

Estimated Effort: 3-4 days (1-2 developers)
```

---

### 🟡 **PRIORITY 3: Compliance & Reporting** (Week 3-4)

#### **3.1 SIUPPAK Reporting (Auto-Generate)**
**Status:** ⏳ Manual only, needs automation  
**Effort:** 2-3 days  
**Impact:** 🟡 MEDIUM  

```
Current: Manual form
Needed:
- ✅ Auto-generate from crew database
- ✅ Monthly + semester reports
- ✅ Submit directly to Ministry API (if available)
- ✅ Audit trail
- ✅ Export as PDF

Files to create:
- /src/app/api/reports/siuppak/generate
- /src/app/api/reports/siuppak/submit
- /src/lib/siuppak/* (SIUPPAK formatting)

Estimated Effort: 2-3 days (1 developer)
```

#### **3.2 Audit Trail & Compliance Reports**
**Status:** ⏳ Partial (crewing only)  
**Effort:** 3-4 days  
**Impact:** 🔴 HIGH - Regulatory requirement  

```
Current: Crewing module tracked
Needed:
- ✅ All module actions logged (forms, approval, changes)
- ✅ Report: Who did what, when, where
- ✅ GDPR/ISO compliance
- ✅ Archive old logs
- ✅ Export audit trail

Files to create:
- /src/app/api/audit-logs/* (endpoints)
- /src/app/compliance/audit-trail (UI)
- /src/lib/audit/* (expand)

Estimated Effort: 3-4 days (1-2 developers)
```

#### **3.3 Document Compliance Matrix**
**Status:** ⏳ Needs implementation  
**Effort:** 2 days  
**Impact:** 🟡 MEDIUM  

```
What:
- Show which documents are required per rank
- Track compliance percentage per crew
- Alert when documents expiring
- Compliance dashboard

Files to create:
- /src/app/compliance/documents-matrix
- /src/lib/compliance/* (rules engine)

Estimated Effort: 2 days (1 developer)
```

---

### 🟢 **PRIORITY 4: Performance & Infrastructure** (Optional)

#### **4.1 Database Optimization**
**Status:** ⏳ Could be done anytime  
**Effort:** 2 days  

```
- Add indexes on frequently searched fields
- Optimize query N+1 problems
- Cache common queries
- Archive old data (forms, logs)
```

#### **4.2 Performance Monitoring**
**Status:** ⏳ Basic monitoring only  
**Effort:** 1-2 days  

```
- Add APM (Application Performance Monitoring)
- Track slow API endpoints
- Monitor database performance
- Alert on errors
```

---

## 📊 FEATURE TIMELINE

```
Week 1 (Jan 13-19):
  Mon-Tue:  Deploy finalize + test (if needed)
  Wed-Fri:  PDF Generation (1.1)
  
Week 2 (Jan 20-26):
  Mon-Fri:  Email Notifications (1.2) + Real-time WebSocket (1.3)
  
Week 3 (Jan 27-Feb 2):
  Mon-Wed:  Dashboard enhancements (2.1)
  Thu-Fri:  Advanced search (2.2)
  
Week 4 (Feb 3-9):
  Mon-Tue:  Mobile improvements (2.3)
  Wed-Fri:  SIUPPAK reporting (3.1)
  
Week 5+ (Feb 10+):
  Audit trail (3.2), Document matrix (3.3)
  Performance optimization (4.1, 4.2)
```

---

## 🎯 WHICH FEATURE TO START WITH?

### **Recommended Order:**
1. **✅ PDF Generation** - Blocks workflows, essential
2. **✅ Email Notifications** - Improves adoption quickly
3. **✅ Dashboard Enhancements** - Quick wins
4. **⏳ WebSocket** - If team wants (optional)
5. **⏳ Advanced Search** - Nice-to-have
6. **⏳ Reporting** - Important but can wait

### **Effort vs Impact Matrix:**

```
            QUICK (1-2 days)     MEDIUM (2-3 days)    SLOW (3+ days)
HIGH        ✅ Email Alerts      ✅ PDF Gen           ? Audit Trail
MEDIUM      ✅ Dashboard         ✅ Search            ✅ WebSocket
LOW         ? Performance        ? Document Matrix    ? Mobile App
```

---

## 🏗️ TECH STACK FOR NEW FEATURES

### **Recommended Libraries**
```
PDF Generation:
  - puppeteer (best, but heavier)
  - html2pdf (lighter)
  - pdfkit (low-level control)
  → Pick: puppeteer

Email:
  - SendGrid (recommended, reliable, good docs)
  - AWS SES (cheaper at scale)
  - Nodemailer (self-hosted)
  → Pick: SendGrid

WebSocket:
  - Socket.io (most popular, automatic fallback)
  - Next.js WebSocket (new, lighter)
  - ws (low-level)
  → Pick: Socket.io

Search/Filter:
  - Elasticsearch (if scaling needed)
  - Prisma filtering (simpler, current setup)
  → Pick: Prisma filtering

Charts/Graphs:
  - Recharts (React, lightweight)
  - Chart.js (popular)
  - D3 (complex, powerful)
  → Pick: Recharts
```

---

## 💰 EFFORT ESTIMATION

| Feature | Effort | Developer | Days | Cost @$150/hr |
|---------|--------|-----------|------|--------------|
| PDF Generation | 3-4d | 1 | 3-4 | $3,600-4,800 |
| Email Notifications | 2-3d | 1 | 2-3 | $2,400-3,600 |
| WebSocket Real-time | 2-3d | 1-2 | 2-3 | $2,400-3,600 |
| Dashboard Enhance | 2d | 1 | 2 | $2,400 |
| Advanced Search | 2-3d | 1 | 2-3 | $2,400-3,600 |
| Mobile Improve | 3-4d | 1-2 | 3-4 | $3,600-4,800 |
| SIUPPAK Auto | 2-3d | 1 | 2-3 | $2,400-3,600 |
| Audit Trail | 3-4d | 1-2 | 3-4 | $3,600-4,800 |
| Document Matrix | 2d | 1 | 2 | $2,400 |
| **TOTAL** | **~25d** | **1-2** | **~25** | **~$28,800-35,200** |

**Option 1: 1 developer (25 days) = $30,000**  
**Option 2: 2 developers parallel (12-15 days) = $28,800 (faster)**

---

## ✅ NEXT STEPS

### **TODAY (Jan 13):**
1. ✅ Crewing cleanup committed
2. ⏳ Push to GitHub
3. ⏳ Review deployment status

### **TOMORROW (Jan 14):**
1. ⏳ Get management approval on feature priorities
2. ⏳ Finalize deployment (if VPS stable)
3. ⏳ Create detailed task tickets for dev team

### **WEEK 1 (Jan 13-19):**
1. ⏳ Deploy finalize + smoke tests
2. ⏳ Start PDF Generation feature
3. ⏳ Parallel: Setup email sending (SendGrid API)

### **WEEK 2+:**
1. ⏳ Email notifications go live
2. ⏳ Dashboard improvements
3. ⏳ Advanced search/filtering
4. ⏳ Continue with priority features

---

## 🎓 DEVELOPER NOTES

### **Code Patterns to Follow:**
1. **API Routes:** Use existing pattern in `/src/app/api/*`
2. **Database:** Follow Prisma patterns in schema.prisma
3. **Components:** Use existing Button, Card components
4. **Error Handling:** Logger + proper HTTP status codes
5. **Auth:** Check session + roles on all endpoints
6. **TypeScript:** Strict mode, no `any` types

### **Testing Checklist:**
- [ ] Unit tests for business logic
- [ ] API endpoint tests
- [ ] UI component tests
- [ ] Integration tests (full feature)
- [ ] Manual smoke test
- [ ] Load test (especially WebSocket)

---

## 📞 DECISION NEEDED

**Bro, pilih mana yang mau dijalanin duluan?**

**Option A: Core Features First**
```
Week 1-2: PDF + Email (stable, essential)
Cost: ~$14,000 / 10 days
Risk: Low
```

**Option B: Feature-rich + Performance**
```
Week 1-3: PDF + Email + Dashboard + WebSocket
Cost: ~$21,000 / 17 days
Risk: Medium
```

**Option C: Full Suite (Everything)**
```
Week 1-5: All features
Cost: ~$30,000+ / 25+ days
Risk: Medium (but comprehensive)
```

---

**Status: ✅ Ready to code, waiting for direction!**

⚓ HANMARINE HIMS - Phase 2 Features Roadmap
