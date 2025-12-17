# HANMARINE HIMS - Maritime Workflow & Routes Verification

## ✅ VERIFIED ROUTES (Working)

### 1. DASHBOARD
- **Route**: `/dashboard`
- **Status**: ✅ Working
- **Features**: KPI cards, crew movement pipeline, risk alerts, external compliance

### 2. CREW MANAGEMENT
- **Route**: `/crew`
- **Status**: ✅ Working
- **Features**: List all seafarers, filter by status (AVAILABLE, ONBOARD, etc)
- **Link from**: Dashboard KPI card "Crew Complement"

### 3. PREPARE JOINING
- **Route**: `/crewing/prepare-joining`
- **Status**: ✅ Working (Just created)
- **Features**: Track crew preparing to join vessels
  - Documents pending
  - Medical pending
  - Ticket pending
  - Ready to join
- **Link from**: Dashboard KPI card "Pending Joinings" + Crew Movement Pipeline

### 4. CREWING
- **Route**: `/crewing`
- **Status**: ✅ Working
- **Features**: Main crewing operations hub

### 5. VESSELS
- **Route**: `/crewing/vessels`
- **Status**: ✅ Working
- **Features**: Fleet management, vessel list
- **Link from**: Dashboard KPI card "Total Fleet"

### 6. COMPLIANCE
- **Route**: `/compliance`
- **Status**: ✅ Working
- **Features**: Compliance tracking, audits, certificates
- **Link from**: Dashboard KPI card "Critical Alerts"

### 7. CONTRACTS
- **Route**: `/contracts`
- **Status**: ✅ Working
- **Features**: SEA & PKL contracts management

### 8. DOCUMENTS
- **Route**: `/documents`
- **Status**: ✅ Working
- **Features**: Seafarer documents, certificates tracking
- **Link from**: Risk Alerts "Certificate Expirations"

### 9. EXTERNAL COMPLIANCE
- **Route**: `/compliance/external`
- **Status**: ✅ Working
- **Features**: KOSMA, Dephub, Schengen Visa tracking

### 10. ACCOUNTING
- **Route**: `/accounting`
- **Status**: ✅ Working
- **Features**: Wages, allotments, billing, office expenses

### 11. HR
- **Route**: `/hr`
- **Status**: ✅ Working
- **Features**: Employees, orientation, leaves, attendance

### 12. INSURANCE
- **Route**: `/insurance`
- **Status**: ✅ Working
- **Features**: Crew insurance policies

### 13. DISCIPLINARY
- **Route**: `/disciplinary`
- **Status**: ✅ Working
- **Features**: Disciplinary actions, records

### 14. ADMIN - SYSTEM HEALTH
- **Route**: `/admin/system-health`
- **Status**: ✅ Working
- **Features**: System monitoring (Director only)

---

## 📋 MARITIME WORKFLOW STANDARD

### Phase 1: RECRUITMENT & APPLICATION
1. **Create Seafarer Profile** → `/crew` (Add New)
2. **Submit Application** → `/crewing/applications`
3. **Upload Documents** → `/documents`
   - Passport
   - Certificates (STCW, COC, etc)
   - Medical Certificate
   - Seaman Book

### Phase 2: PREPARE JOINING
4. **Documents Verification** → `/documents`
   - Check expiry dates
   - Verify authenticity
5. **Medical Check** → Schedule & upload results
6. **External Compliance** → `/compliance/external`
   - KOSMA Certificate (Korea vessels)
   - Dephub Verification (Indonesia)
   - Schengen Visa (if needed)
7. **Contract Preparation** → `/contracts` (Create SEA contract)
8. **Ticket Booking** → `/crewing/prepare-joining`
9. **Status**: READY TO JOIN

### Phase 3: ASSIGNMENT & SIGN-ON
10. **Create Assignment** → `/crewing/assignments`
    - Select seafarer
    - Select vessel
    - Set join date
11. **Add to Crew List** → `/crewing/crew-list`
12. **Sign On Contract** → `/contracts` (Activate)
13. **Update Status** → ONBOARD

### Phase 4: ONBOARD OPERATIONS
14. **Monthly Checklist** → `/crewing/checklist`
    - Safety drills
    - Equipment checks
15. **Wage Calculation** → `/accounting/wages`
16. **Allotment Processing** → `/accounting/allotments`
17. **Vacation Planning** → `/crewing/vacation-plans`

### Phase 5: SIGN-OFF & REPLACEMENT
18. **Sign-Off Planning** → Contract end date - 30 days
19. **Replacement Request** → `/crewing/replacements`
20. **Disembarkation Process** → `/crewing/disembarkations`
21. **Final Settlement** → `/accounting/wages`
22. **Update Status** → AVAILABLE

### Phase 6: COMPLIANCE & MONITORING
23. **Internal Audits** → `/compliance`
24. **Document Renewal** → `/documents` (Track expiry)
25. **Training Records** → `/crewing/training`
26. **Medical Treatment** → `/crewing/treatment-requests`
27. **Disciplinary Actions** → `/disciplinary` (if needed)

---

## 🔗 DASHBOARD LINKS MAPPING

| Dashboard Component | Target Route | Status |
|-------------------|-------------|--------|
| Total Fleet KPI | `/crewing/vessels` | ✅ |
| Crew Complement KPI | `/crew` | ✅ |
| Pending Joinings KPI | `/crewing/prepare-joining` | ✅ |
| Critical Alerts KPI | `/compliance` | ✅ |
| Preparing to Join Card | `/crewing/prepare-joining` | ✅ |
| On Board Card | `/crew?status=ONBOARD` | ✅ |
| Sign-Off Due Card | `/crew?status=SIGN_OFF_DUE` | ✅ |
| Certificate Expirations Alert | `/documents?expiring=30` | ✅ |
| Vessel Compliance Alert | `/compliance?status=PENDING` | ✅ |
| Live Vessel Tracking | `https://www.vesselfinder.com/` | ✅ External |
| KOSMA Training | `https://www.marinerights.or.kr` | ✅ External |
| Dephub Verify | `https://pelaut.dephub.go.id` | ✅ External |
| Schengen Visa NL | `https://consular.mfaservices.nl` | ✅ External |

---

## 🎯 ROLE-BASED ACCESS

### DIRECTOR
- Full access to all modules
- System Health monitoring
- Financial reports

### CDMO (Crew & Document Management Officer)
- Crew management
- Documents
- Compliance
- Contracts
- Insurance

### OPERATIONAL
- Vessels
- Assignments
- Crew List
- Replacements

### ACCOUNTING
- Wages
- Allotments
- Billing
- Agency Fees
- Office Expenses

### HR
- Employees
- Orientation
- Leaves
- Attendance
- Disciplinary

### CREW_PORTAL
- View own profile
- View own documents
- Limited access

---

## 🚀 NEXT ACTIONS

All critical routes are working! Maritime workflow is complete and follows industry standards:
1. ✅ Recruitment to onboard flow
2. ✅ Document & compliance tracking
3. ✅ Contract management (SEA & PKL)
4. ✅ External system integration
5. ✅ Financial operations
6. ✅ HR processes

**System is ready for production deployment!** 🎉
