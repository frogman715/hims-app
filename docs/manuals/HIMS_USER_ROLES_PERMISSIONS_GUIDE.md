# HANMARINE HIMS - USER ROLES & PERMISSIONS GUIDE
**Version 2.1 | December 2025**

---

## 📋 TABLE OF CONTENTS
1. Overview
2. User Accounts & Credentials
3. Role Descriptions
4. Module Access Matrix
5. Permission Levels Explained
6. Use Cases by Role
7. Data Sensitivity & Encryption
8. Security Best Practices
9. Troubleshooting
10. Contact & Support

---

## 1. OVERVIEW

HANMARINE HIMS menggunakan **Role-Based Access Control (RBAC)** dengan 6 tingkat akses berbeda untuk menjaga keamanan data dan memastikan setiap user hanya bisa mengakses modul sesuai tanggung jawab mereka.

**Compliance Standards:**
- ISO 9001:2015 (Quality Management)
- MLC 2006 (Maritime Labour Convention)
- STCW (Standards of Training, Certification and Watchkeeping)

---

## 2. USER ACCOUNTS & CREDENTIALS

| No | Name | Email | Role | Default Password | Access Level |
|----|------|-------|------|------------------|--------------|
| 1 | Rinaldy | rinaldy@hanmarine.co | DIRECTOR | director123 | Full Access |
| 2 | Arief | arief@hanmarine.co | DIRECTOR | admin123 | Full Access |
| 3 | Dino | dino@hanmarine.co | ACCOUNTING | accounting123 | Financial Only |
| 4 | CDMO | cdmo@hanmarine.co | CDMO | cdmo123 | Technical Admin |
| 5 | Operational Staff | operational@hanmarine.co | OPERATIONAL | operational123 | Crewing Operations |
| 6 | HR Staff | hr@hanmarine.co | HR | hr123 | Human Resources |
| 7 | Seafarer Portal | crew@hanmarine.co | CREW_PORTAL | crew123 | Self-Service |

**⚠️ SECURITY REMINDER:**
- Semua user **WAJIB** ganti password setelah login pertama kali
- Password minimal 8 karakter (kombinasi huruf + angka)
- Jangan share password ke user lain
- Logout setelah selesai menggunakan sistem

---

## 3. ROLE DESCRIPTIONS

### 3.1. DIRECTOR (Rinaldy & Arief)
**Job Title:** Managing Director / System Administrator  
**Responsibility:** Full system oversight, strategic decisions, compliance monitoring

**Access Rights:**
- ✅ **FULL ACCESS** ke seluruh modul
- ✅ Bisa create, read, update, delete semua data
- ✅ User management (tambah/hapus user)
- ✅ System settings & configuration
- ✅ View all sensitive data (salary, medical records, passport numbers)
- ✅ Generate all reports
- ✅ Audit logs access

**Typical Daily Tasks:**
- Review dashboard metrics (crew count, contract expiry, compliance status)
- Approve contracts dan agency agreements
- Monitor financial performance (P&L, billing, expenses)
- Review quality audits dan corrective actions
- Make strategic hiring/firing decisions

---

### 3.2. CDMO (Technical Admin)
**Job Title:** Crewing and Documentation Management Officer  
**Responsibility:** Operational crewing, documentation, technical compliance

**Access Rights:**
- ✅ **FULL ACCESS**: Crew, Crewing, Contracts, Quality, Compliance, Documents
- ✅ **EDIT ACCESS**: HR (recruitment, attendance)
- ❌ **NO ACCESS**: Accounting, Salary data, Office expenses

**Key Features:**
- Manage crew applications & assignments
- Process seafarer documents (passport, certificates, medical)
- Generate HGQS forms (CR-01 to CR-18)
- Conduct compliance checks (KOSMA, Dephub, Schengen)
- Coordinate crew replacements & sign-offs
- Manage vessel crew lists

**Data Restrictions:**
- Cannot view salary details or wage calculations
- Cannot access accounting reports
- Cannot see office financial data

**Typical Daily Tasks:**
- Process new crew applications
- Update crew certificates (expiry tracking)
- Prepare crew for joining (ticket, visa, medical)
- Generate monthly crew replacement plans
- Conduct document audits

---

### 3.3. OPERATIONAL (Staff Operasional)
**Job Title:** Crewing Operations Coordinator  
**Responsibility:** Day-to-day crewing operations, crew coordination

**Access Rights:**
- ✅ **FULL ACCESS**: Crewing Operations (applications, assignments, sign-on/off)
- ✅ **EDIT ACCESS**: Crew Management, Documents, Quality Forms
- ✅ **VIEW ACCESS**: Contracts (read-only), HR, Insurance
- ❌ **NO ACCESS**: Accounting, Salary, Financial data

**Key Features:**
- Add/edit crew profiles
- Process crew applications
- Create crew assignments
- Upload crew documents
- Generate CR forms
- Schedule crew replacements
- Coordinate with vessels

**Data Restrictions:**
- Cannot edit contracts (view only)
- Cannot delete crew records (safety measure)
- Cannot access financial modules
- Cannot view salary information

**Typical Daily Tasks:**
- Screen new crew applications
- Update crew status (available, on-board, off-shore)
- Coordinate crew travel & logistics
- Track document expiry dates
- Submit crew replacement requests
- Generate crew lists for vessels

---

### 3.4. ACCOUNTING (Dino)
**Job Title:** Accounting & Payroll Officer  
**Responsibility:** Financial management, payroll, billing, agency fees

**Access Rights:**
- ✅ **FULL ACCESS**: Accounting (wages, allotments, billing, expenses), Contracts (wage calculation)
- ✅ **EDIT ACCESS**: Insurance (claim processing), Agency Fees
- ✅ **VIEW ACCESS**: Crew Management (for payroll reference)
- ❌ **NO ACCESS**: Crewing Operations, Quality, HR, Medical Records

**Key Features:**
- Calculate crew wages & allotments
- Process monthly payroll
- Generate invoices to principals
- Track office expenses
- Manage insurance claims
- Monitor agency fees
- Generate financial reports

**Data Restrictions:**
- Cannot edit crew operational data
- Cannot access quality management
- Cannot view medical records (privacy)
- Cannot manage crew assignments

**Typical Daily Tasks:**
- Process monthly crew payroll
- Calculate wage adjustments (overtime, bonuses)
- Send billing invoices to principals
- Track allotment transfers
- Reconcile agency fees
- Generate financial reports for management

---

### 3.5. HR (Staff HR)
**Job Title:** Human Resources Officer  
**Responsibility:** Internal staff recruitment, attendance, disciplinary, leaves

**Access Rights:**
- ✅ **FULL ACCESS**: HR Module (recruitment, attendance, leaves, disciplinary, appraisals)
- ✅ **EDIT ACCESS**: Crew Applications (recruitment coordination)
- ✅ **VIEW ACCESS**: Crew Management, Quality
- ❌ **NO ACCESS**: Contracts, Accounting, Medical Records

**Key Features:**
- Post job vacancies
- Screen candidates
- Manage staff attendance
- Process leave requests
- Handle disciplinary cases
- Conduct performance appraisals
- Organize training & orientation

**Data Restrictions:**
- Cannot edit crew contracts
- Cannot access salary data
- Cannot view medical records
- Cannot access financial modules

**Typical Daily Tasks:**
- Post new job openings
- Review candidate applications
- Schedule interviews
- Track staff attendance
- Approve leave requests
- Document disciplinary actions
- Coordinate employee training

---

### 3.6. CREW_PORTAL (Seafarers)
**Job Title:** Seafarer / Crew Member  
**Responsibility:** Self-service portal for personal data management

**Access Rights:**
- ✅ **VIEW OWN DATA**: Personal profile, documents, contracts, assignments, training
- ✅ **EDIT OWN**: Profile information, contact details
- ❌ **NO ACCESS**: Other crew data, admin modules, company financial data

**Key Features:**
- View personal contracts
- Download own certificates
- Check assignment history
- Update contact information
- View training records
- Check document expiry dates

**Data Restrictions:**
- Cannot view other crew members' data
- Cannot access admin modules
- Cannot edit contracts
- Cannot access company operations

**Typical Usage:**
- Login untuk cek status kontrak
- Download sertifikat pribadi
- Update alamat/nomor telepon
- Cek riwayat assignment
- Lihat jadwal training

---

## 4. MODULE ACCESS MATRIX

### 4.1. Dashboard Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| Total Crew Stats | ✅ | ✅ | ✅ | ✅ (limited) | ✅ (limited) | ❌ |
| Crew Movement | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Contract Expiry Alerts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (own) |
| Document Expiry Alerts | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Financial Overview | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Quality Metrics | ✅ | ✅ | ✅ (view) | ❌ | ✅ (view) | ❌ |
| External Compliance Widget | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### 4.2. Crew Management Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| View Crew List | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add New Crew | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Crew Profile | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Delete Crew | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Medical Records | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (own) |
| View Salary History | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Passport Details | ✅ | ✅ | ✅ (masked) | ❌ | ❌ | ✅ (own) |
| Export Crew Data | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

---

### 4.3. Crewing Operations Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| **Applications** |
| View Applications | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Create Application (CR-02) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve Application | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reject Application | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Assignments** |
| View Assignments | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (own) |
| Create Assignment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Assignment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Assignment | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Crew Replacements** |
| View Replacement Plans | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Replacement | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Monthly Checklist | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Prepare Joining** |
| View Joining List | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Update Joining Status | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Sign-Off** |
| Process Sign-Off | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign-Off Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Vessels** |
| View Vessel List | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add/Edit Vessel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crew List per Vessel | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Principals** |
| View Principals | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add/Edit Principal | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 4.4. Contracts Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| View Contracts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (own) |
| Create SEA Contract | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create OFFICE PKL | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Contract | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Contract | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Wage Details | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ (own) |
| Calculate Wages | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Export Contract PDF | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (own) |
| Contract Expiry Alerts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (own) |

---

### 4.5. Quality Management Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| **HGQS Forms** |
| View Forms Library | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Generate CR Forms | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Generate AD Forms | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Generate AC Forms | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Quality Manual** |
| View Main Manual | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Procedures | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Guidelines | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Edit Manual | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Audits** |
| View Audit Reports | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Create Audit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **QMR Dashboard** |
| View QMR Metrics | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quality Tasks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### 4.6. Compliance Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| **Internal Compliance** |
| View Compliance Status | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Communication Records | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **External Compliance** |
| KOSMA Certificate | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Dephub Certificate | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Schengen Visa NL | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Add Compliance Record | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Verify Compliance | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### 4.7. Accounting Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| **Wages & Payroll** |
| View Wage Calculations | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Process Monthly Payroll | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Generate Payslips | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Allotments** |
| View Allotments | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Process Allotment | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Billing** |
| View Invoices | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create Invoice | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Send Invoice to Principal | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Office Expenses** |
| View Expenses | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Add Expense | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Reports** |
| P&L Report | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cash Flow | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

### 4.8. HR Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| **Recruitment** |
| View Job Postings | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Create Job Posting | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Screen Candidates | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Attendance** |
| View Attendance | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Mark Attendance | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Attendance Reports | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Leaves** |
| View Leave Requests | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve/Reject Leave | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Disciplinary** |
| View Cases | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Create Case | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Appraisals** |
| View Appraisals | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Conduct Appraisal | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

---

### 4.9. Documents Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| View Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (own) |
| Upload Document | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Document | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Document | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Download Document | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (own) |
| Expiry Tracking | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| Generate Forms | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### 4.10. Insurance Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| View Insurance Policies | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add Insurance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Insurance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Process Claims | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Expiry Tracking | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

### 4.11. Agency Fees Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| View Agency Fees | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Add Fee | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Edit Fee | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Generate Invoice | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

### 4.12. National Holidays Module

| Feature | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|---------|----------|------|-------------|------------|-------|-------------|
| View Holidays | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add Holiday | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Edit Holiday | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Delete Holiday | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. PERMISSION LEVELS EXPLAINED

### FULL_ACCESS
- **Create**: Tambah data baru
- **Read**: Lihat semua data
- **Update**: Edit data yang ada
- **Delete**: Hapus data
- **Export**: Download reports

### EDIT_ACCESS
- **Create**: Tambah data baru ✅
- **Read**: Lihat semua data ✅
- **Update**: Edit data yang ada ✅
- **Delete**: Hapus data ❌
- **Export**: Download reports ✅

### VIEW_ACCESS
- **Create**: Tambah data baru ❌
- **Read**: Lihat semua data ✅
- **Update**: Edit data yang ada ❌
- **Delete**: Hapus data ❌
- **Export**: Download reports ✅ (limited)

### NO_ACCESS
- ❌ Tidak bisa akses modul sama sekali
- ❌ Menu tidak muncul di sidebar
- ❌ API endpoint di-block (403 Forbidden)

---

## 6. USE CASES BY ROLE

### Use Case 1: Hiring New Seafarer (Operational Staff)

**Scenario:** Ada pelaut baru apply posisi Able Seaman

**Steps:**
1. Login sebagai `operational@hanmarine.co`
2. Menu: **Crewing → Applications → New Application**
3. Isi form CR-02 (Application Form):
   - Crew Name: John Doe
   - Rank: Able Seaman
   - Principal: PT XYZ Shipping
   - Vessel: MV ABC
   - Status: PENDING
4. Upload dokumen:
   - Passport copy
   - Seaman Book
   - Certificates (BST, PSCRB, dll)
5. Submit application
6. Notifikasi otomatis ke CDMO untuk approval

**Result:** Application tersimpan dengan status PENDING, menunggu approval dari CDMO atau Director.

---

### Use Case 2: Processing Monthly Payroll (Accounting Staff)

**Scenario:** Tanggal 25, Dino harus proses payroll bulan ini

**Steps:**
1. Login sebagai `dino@hanmarine.co`
2. Menu: **Accounting → Wages**
3. Filter: Active Contracts (on-board crew)
4. Sistem auto-calculate:
   - Basic Salary
   - Overtime (jika ada)
   - Fixed Overtime
   - Leave Pay
   - Deductions (allotment, insurance)
5. Review total wages per crew
6. Generate payslips (PDF)
7. Export payroll report (Excel)
8. Submit untuk approval Director

**Result:** Payroll report siap kirim ke bank untuk transfer, payslips siap dikirim ke crew.

---

### Use Case 3: Document Expiry Tracking (CDMO)

**Scenario:** Passport pelaut A akan expired 3 bulan lagi

**Steps:**
1. Login sebagai `cdmo@hanmarine.co`
2. Dashboard menampilkan alert: **"5 documents expiring in 90 days"**
3. Klik alert → redirect ke **Documents** page
4. Filter: Status = EXPIRING
5. Lihat list:
   - John Doe - Passport - Expiry: 15 March 2025
   - Jane Smith - Medical Certificate - Expiry: 20 March 2025
6. Klik crew name → detail page
7. Contact crew via email/phone untuk renewal
8. Setelah dokumen baru ready, upload via **Documents → Upload**
9. Update expiry date

**Result:** Crew reminded untuk renewal dokumen sebelum expired, compliance maintained.

---

### Use Case 4: Quality Audit (Director)

**Scenario:** Internal audit ISO 9001:2015 bulan ini

**Steps:**
1. Login sebagai `rinaldy@hanmarine.co`
2. Menu: **Quality → Audits → New Audit**
3. Isi form:
   - Audit Type: Internal
   - Standard: ISO 9001:2015
   - Auditor: External consultant
   - Date: 10 December 2025
   - Scope: All departments
4. Generate checklist (auto dari HGQS Manual)
5. Conduct audit → input findings
6. Identify non-conformities (jika ada)
7. Create **Corrective Actions** (link ke modul CA)
8. Generate audit report (PDF)
9. Submit untuk management review

**Result:** Audit report tersimpan, corrective actions di-track sampai closed.

---

### Use Case 5: Crew Self-Service (Seafarer Portal)

**Scenario:** Pelaut B mau download sertifikat untuk visa application

**Steps:**
1. Login sebagai pelaut: `johnsmith@hanmarine.co` (contoh)
2. Dashboard menampilkan:
   - Current Contract: MV ABC (expires 30 June 2025)
   - Next Assignment: MV DEF (sign-on 5 July 2025)
   - Documents expiring soon: STCW (90 days)
3. Menu: **Documents**
4. Lihat list dokumen pribadi:
   - Passport
   - Seaman Book
   - BST Certificate
   - PSCRB Certificate
   - Medical Certificate
5. Klik **Download** pada dokumen yang dibutuhkan
6. File downloaded (PDF format)

**Result:** Pelaut bisa akses dokumen sendiri kapan aja tanpa harus kontak office.

---

## 7. DATA SENSITIVITY & ENCRYPTION

### RED Level (Encrypted with AES-256-GCM)
**Stored encrypted, decrypted only for authorized roles**

- Passport numbers (full)
- Seaman book numbers
- Medical test results (detailed)
- Full salary amounts
- Bank account numbers
- ID card numbers (KTP)

**Access:** DIRECTOR, CDMO only

---

### AMBER Level (Masked for non-privileged users)
**Partially hidden for lower-level users**

- Personal phone numbers (masked: +62 812 **** 5678)
- Email addresses (masked for CREW_PORTAL)
- Home addresses
- Emergency contact details
- Disciplinary records
- Certificate numbers

**Access:** DIRECTOR, CDMO (full), OPERATIONAL (masked), Others (no access)

---

### GREEN Level (Public within system)
**No restrictions for authorized users**

- Crew names
- Ranks/positions
- Vessel names
- Principal names
- Certificate types (without numbers)
- Training records
- Public compliance data

**Access:** All roles (according to module permissions)

---

## 8. SECURITY BEST PRACTICES

### For All Users:
1. ✅ **Change default password** setelah login pertama
2. ✅ **Use strong password**: Min 8 karakter, kombinasi huruf + angka + simbol
3. ✅ **Logout after use**, especially dari komputer shared
4. ❌ **Jangan share credentials** ke orang lain
5. ❌ **Jangan save password** di browser (gunakan password manager)
6. ✅ **Report suspicious activity** ke IT/CDMO immediately

### For Admins (DIRECTOR, CDMO):
1. ✅ **Enable audit logs** untuk track user activity
2. ✅ **Review permissions** setiap 6 bulan
3. ✅ **Deactivate users** yang sudah resign
4. ✅ **Backup database** weekly (automated)
5. ✅ **Monitor failed login attempts**
6. ✅ **Keep system updated** (Next.js, dependencies)

---

## 9. TROUBLESHOOTING

### "403 Forbidden" Error
**Cause:** User tidak punya permission untuk akses modul tersebut  
**Solution:** 
- Cek role user di **Admin → Users**
- Verify permission matrix di atas
- Contact Director jika butuh access upgrade

### "Session Expired" Error
**Cause:** User idle terlalu lama (30 menit)  
**Solution:** Login ulang

### "Cannot Edit Data" (Read-Only)
**Cause:** User role hanya punya VIEW_ACCESS  
**Solution:** Request EDIT_ACCESS dari Director

### "Document Upload Failed"
**Cause:** File size > 10MB atau format tidak supported  
**Solution:** 
- Compress file (use PDF, max 10MB)
- Supported formats: PDF, JPG, PNG, DOCX

---

## 10. CONTACT & SUPPORT

**System Administrator:**
- Name: Arief
- Email: arief@hanmarine.co
- Phone: [Your Phone]

**Technical Support:**
- Email: cdmo@hanmarine.co
- Response Time: 24 hours (business days)

**Emergency Contact (System Down):**
- Phone: [Emergency Hotline]
- Available: 24/7

---

## APPENDIX A: GLOSSARY

- **RBAC**: Role-Based Access Control
- **MLC**: Maritime Labour Convention
- **STCW**: Standards of Training, Certification and Watchkeeping
- **HGQS**: Hanmarine Quality Management System
- **SEA Contract**: Seafarer Employment Agreement
- **PKL**: Perjanjian Kerja Laut (Indonesian maritime employment contract)
- **KOSMA**: Korea Seafarer Mutual Aid Association
- **Dephub**: Departemen Perhubungan (Indonesia Ministry of Transportation)
- **Schengen**: European visa for crew joining vessels in EU ports
- **CR Forms**: Crewing forms (CR-01 to CR-18)
- **AD Forms**: Administrative forms (AD-01 to AD-25)
- **AC Forms**: Accounting forms (AC-01 to AC-07)

---

## APPENDIX B: REVISION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.1 | Dec 5, 2025 | Initial documentation with updated emails | AI Assistant |
| 2.0 | Dec 1, 2025 | Added External Compliance module | AI Assistant |
| 1.0 | Nov 27, 2025 | First release with RBAC implementation | AI Assistant |

---

**END OF DOCUMENT**

**© 2025 HANMARINE - All Rights Reserved**
