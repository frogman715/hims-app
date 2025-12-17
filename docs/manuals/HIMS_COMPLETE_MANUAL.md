# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS)
## COMPLETE USER & PROCEDURE MANUAL

**Version:** 1.0  
**Date:** December 5, 2025  
**Company:** PT Hanmarine Indonesia  
**System URL:** https://app.hanmarine.co

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [User Access & Authentication](#2-user-access--authentication)
3. [Role-Based Permissions](#3-role-based-permissions)
4. [Module Operations](#4-module-operations)
5. [Standard Operating Procedures](#5-standard-operating-procedures)
6. [Compliance & Quality Management](#6-compliance--quality-management)
7. [Troubleshooting & Support](#7-troubleshooting--support)
8. [Appendix](#8-appendix)

---

## 1. SYSTEM OVERVIEW

### 1.1 What is HIMS?
HIMS (Hanmarine Integrated Management System) is a comprehensive maritime crew management system designed to handle:
- Seafarer applications and recruitment
- Crew assignments and replacements
- Employment contracts (SEA & PKL)
- Document management and compliance
- Vessel and principal management
- Financial accounting and payroll
- Quality management system (ISO 9001, MLC, STCW)

### 1.2 System Architecture
- **Technology Stack:** Next.js 16, React 19, PostgreSQL 16, Prisma ORM
- **Deployment:** VPS (31.97.223.11) with Nginx, PM2, SSL (Let's Encrypt)
- **Security:** AES-256-GCM encryption, role-based access control, firewall protection
- **Backup:** Automated daily backups at 2 AM (7-day retention)

### 1.3 Compliance Standards
- **MLC (Maritime Labour Convention):** Employment contracts, medical standards
- **STCW (Standards of Training, Certification and Watchkeeping):** Certificate management
- **ISO 9001:** Quality management procedures
- **Indonesian Regulations:** PKL contracts, Hubla documentation

---

## 2. USER ACCESS & AUTHENTICATION

### 2.1 Login Credentials

#### **DIRECTOR (Full Access)**
1. **Rinaldy (Director)**
   - Email: `rinaldy@hanmarine.co`
   - Password: `director2025`
   - Access: Complete system control

2. **Arief (Admin)**
   - Email: `arief@hanmarine.co`
   - Password: `admin2025`
   - Access: Complete system control

#### **ACCOUNTING (Finance)**
3. **Dino (Accounting Officer)**
   - Email: `dino@hanmarine.co`
   - Password: `accounting2025`
   - Access: Full access to contracts, wage scales, agency fees, insurance

#### **OPERATIONAL STAFF**
4. **CDMO (Crew Document Management Officer)**
   - Email: `cdmo@hanmarine.co`
   - Password: `cdmo123`
   - Access: Full access to crew, documents, applications

5. **Operational Manager**
   - Email: `operational@hanmarine.co`
   - Password: `operational123`
   - Access: View access to most modules, edit crewing operations

6. **HR Officer**
   - Email: `hr@hanmarine.co`
   - Password: `hr123`
   - Access: Full access to HR, recruitment, national holidays

#### **CREW PORTAL**
7. **Crew Portal (For Seafarers)**
   - Email: `crew@hanmarine.co`
   - Password: `crew2025`
   - Access: View own contracts, documents, assignments

#### **AUDITOR**
8. **External Auditor**
   - Email: `auditor@hanmarine.co`
   - Password: `auditor2025`
   - Access: Read-only access to compliance, quality, documents

### 2.2 Login Process
1. Navigate to: https://app.hanmarine.co
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to the dashboard based on your role

### 2.3 Password Security
- Passwords are encrypted using bcrypt (industry standard)
- Change default passwords immediately after first login
- Use strong passwords: minimum 8 characters, mix of letters and numbers
- Never share credentials with unauthorized personnel

### 2.4 Session Management
- Sessions expire after 24 hours of inactivity
- Always log out when leaving workstation
- System uses JWT tokens for secure authentication

---

## 3. ROLE-BASED PERMISSIONS

### 3.1 Permission Levels
- **NO_ACCESS:** Module completely blocked
- **VIEW_ACCESS:** Read-only (can view data but cannot modify)
- **EDIT_ACCESS:** Can create and update records (cannot delete)
- **FULL_ACCESS:** Complete control (create, read, update, delete)

### 3.2 Permission Matrix by Role

| Module | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|--------|----------|------|-------------|------------|-----|-------------|
| **Dashboard** | FULL | FULL | FULL | FULL | FULL | VIEW |
| **Crew** | FULL | FULL | EDIT | VIEW | VIEW | NO |
| **Applications** | FULL | FULL | EDIT | VIEW | VIEW | NO |
| **Assignments** | FULL | FULL | EDIT | VIEW | VIEW | NO |
| **Contracts** | FULL | EDIT | VIEW | FULL | VIEW | VIEW |
| **Documents** | FULL | FULL | VIEW | VIEW | VIEW | VIEW |
| **Principals** | FULL | EDIT | VIEW | EDIT | NO | NO |
| **Vessels** | FULL | EDIT | VIEW | VIEW | NO | NO |
| **Wage Scales** | FULL | VIEW | VIEW | FULL | NO | NO |
| **Agency Fees** | FULL | VIEW | VIEW | FULL | NO | NO |
| **Insurance** | FULL | VIEW | VIEW | FULL | NO | NO |
| **Quality/HGQS** | FULL | VIEW | VIEW | VIEW | NO | NO |
| **Compliance** | FULL | EDIT | VIEW | VIEW | VIEW | NO |
| **HR/Recruitment** | FULL | VIEW | VIEW | VIEW | FULL | NO |
| **Disciplinary** | FULL | EDIT | VIEW | NO | VIEW | NO |

### 3.3 Data Sensitivity Levels

#### **RED (Highly Confidential - Encrypted)**
- Passport numbers
- Medical examination results
- Full salary details
- Seaman book codes
- Bank account numbers

**Access:** DIRECTOR and ACCOUNTING only

#### **AMBER (Confidential - Masked)**
- Personal contact information
- Disciplinary records
- Certificate details
- Contract terms

**Access:** DIRECTOR, CDMO, HR with masking for others

#### **GREEN (Public/Internal)**
- Vessel information
- Principal details
- Procedural documents
- Training records

**Access:** All authorized users

---

## 4. MODULE OPERATIONS

### 4.1 CREW MODULE

#### 4.1.1 Adding New Seafarer
1. Navigate to **Crew** → **Add New Crew**
2. Fill in required fields:
   - Full Name (as per passport)
   - Date of Birth
   - Nationality
   - Rank/Position
   - Seaman Book Number
   - Contact Information
3. Upload required documents:
   - Passport copy
   - Seaman book
   - COC (Certificate of Competency)
   - Medical certificate
4. Click **Save**

#### 4.1.2 Crew Status Management
- **ACTIVE:** Currently employed/available
- **ON_BOARD:** Currently serving on vessel
- **STANDBY:** Available for next assignment
- **INACTIVE:** Not available for assignment
- **BLACKLISTED:** Prohibited from employment

#### 4.1.3 Searching Crew
- Use search bar for name, rank, or seaman book
- Filter by:
  - Status (Active, On Board, Standby)
  - Rank (Captain, Chief Engineer, Able Seaman, etc.)
  - Nationality
  - Certificate expiry date

### 4.2 APPLICATION MODULE (CR-02)

#### 4.2.1 Creating Application
1. Go to **Crewing** → **Applications**
2. Click **New Application**
3. Select:
   - Principal (ship owner)
   - Vessel
   - Rank required
   - Sign-on date
4. Choose seafarer from crew database
5. Upload application documents:
   - Application form (CR-02)
   - Updated certificates
   - Medical certificate
6. Set application status:
   - **PENDING:** Awaiting principal approval
   - **APPROVED:** Principal accepted
   - **REJECTED:** Principal declined
   - **CANCELLED:** Application withdrawn

#### 4.2.2 Application Workflow
```
Crew Selection → Document Check → CR-02 Form → Submit to Principal 
→ Principal Approval → Assignment → Contract
```

### 4.3 ASSIGNMENT MODULE

#### 4.3.1 Creating Assignment
1. From approved application → **Create Assignment**
2. Fill assignment details:
   - Sign-on date
   - Sign-on port
   - Contract duration (months)
   - Expected sign-off date
3. Generate crew list entry
4. Create employment contract

#### 4.3.2 Crew Replacement Process
1. **Monthly Checklist:** Review expiring contracts
2. **Replacement Request:** Identify positions needing replacement
3. **Crew Selection:** Choose suitable replacement
4. **Application:** Submit CR-02 to principal
5. **Assignment:** Create new assignment for replacement
6. **Sign-off/Sign-on:** Update crew list

### 4.4 CONTRACT MODULE

#### 4.4.1 Contract Types
**SEA Contract (Seafarer Employment Agreement)**
- MLC compliant format
- Carried onboard vessel
- Contains:
  - Employment terms
  - Wage details (basic, overtime, leave pay)
  - Working hours
  - Leave entitlements
  - Repatriation terms
  - Insurance coverage

**PKL Contract (Perjanjian Kerja Laut)**
- Indonesian regulatory format
- Filed with Hubla (Ministry of Transportation)
- Required for:
  - Immigration clearance
  - Work permit compliance
  - National regulatory audit

#### 4.4.2 Creating Contract
1. From assignment → **Generate Contract**
2. Select contract type: SEA or PKL
3. System auto-fills from:
   - Crew personal data
   - Assignment details
   - Principal agreement terms
   - Wage scale for rank
4. Review and adjust if needed
5. Generate PDF
6. Print for signatures
7. Upload signed copy

#### 4.4.3 Contract Management
- Track contract status: DRAFT, ACTIVE, EXPIRED, TERMINATED
- Set reminders for expiry
- Generate renewal contracts
- Link to wage scale and insurance

### 4.5 DOCUMENT MODULE

#### 4.5.1 Document Categories
- **Certificates:** COC, GMDSS, BST, AVSEC, etc.
- **Medical:** Medical examination certificate
- **Identity:** Passport, seaman book
- **Training:** STCW courses, company training
- **Compliance:** Visa, yellow book, KOSMA certificate

#### 4.5.2 Document Tracking
- Expiry date alerts (30/60/90 days)
- Renewal reminders
- Compliance status indicators
- Batch upload for multiple documents

#### 4.5.3 External Compliance Systems

**KOSMA Certificate (Korea)**
- URL: https://www.marinerights.or.kr
- Purpose: 3-hour online training for Korean vessels
- Validity: 1 year
- Track in system: Issue date, expiry date, certificate number

**Dephub Certificate (Indonesia)**
- URL: https://pelaut.dephub.go.id/login-perusahaan
- Purpose: Validate seaman book authenticity
- Required: SIUPAK company account
- Track: Verification status, last check date

**Schengen Visa NL (Netherlands)**
- URL: https://consular.mfaservices.nl
- Purpose: Visa for crew joining vessels in EU ports
- Track: Application status, visa validity, passport number

### 4.6 PRINCIPAL & VESSEL MODULE

#### 4.6.1 Principal Management
- Add ship owners/management companies
- Store contact information
- Track agency agreements:
  - Agreement start/end date
  - Commission percentage
  - Payment terms
  - Vessel list under management

#### 4.6.2 Vessel Management
- Add vessels under each principal
- Vessel details:
  - IMO number
  - Vessel name
  - Vessel type (Tanker, Bulk Carrier, Container, etc.)
  - Flag state
  - Gross tonnage
  - Manning requirements
- Track crew complement by rank

### 4.7 ACCOUNTING MODULE

#### 4.7.1 Wage Scale Management
1. **Wage Scale Setup:**
   - Create wage scales by principal
   - Set rates for each rank
   - Components:
     - Basic wage (USD/month)
     - Overtime rate (USD/hour)
     - Leave pay percentage
     - Fixed overtime hours
   - Set effective date range

2. **Calculating Total Wages:**
   ```
   Total Monthly Wage = Basic Wage + (Overtime Hours × Overtime Rate) + Leave Pay
   ```

#### 4.7.2 Agency Fees
- Service fees charged to principals
- Types:
  - Per crew placement fee
  - Monthly management fee
  - Document processing fee
- Track invoicing and payment status

#### 4.7.3 Insurance Management
- P&I (Protection & Indemnity) Insurance
- Group insurance for crew
- Track:
  - Policy number
  - Coverage period
  - Premium amount
  - Beneficiaries

### 4.8 HR MODULE

#### 4.8.1 Recruitment
- Job posting management
- Applicant tracking
- Interview scheduling
- Selection process
- Onboarding workflow

#### 4.8.2 National Holidays
- Maintain calendar of Indonesian holidays
- Reference for leave calculation
- Compliance with labor laws

#### 4.8.3 Disciplinary Module
- Record incidents/violations
- Disciplinary actions:
  - Verbal warning
  - Written warning
  - Suspension
  - Termination
- Investigation notes
- Resolution tracking

### 4.9 QUALITY MANAGEMENT (HGQS)

#### 4.9.1 HGQS System Overview
Hanmarine Group Quality System complies with:
- ISO 9001:2015
- MLC 2006
- STCW 2010 Manila Amendments

#### 4.9.2 Document Control
- Procedures (SOP)
- Work instructions
- Forms and templates
- Records management
- Document revision control

#### 4.9.3 Internal Audit
- Audit planning
- Audit checklists
- Non-conformance reports (NCR)
- Corrective action tracking
- Management review

#### 4.9.4 Continuous Improvement
- Preventive actions
- Process improvement initiatives
- KPI monitoring
- Customer feedback

---

## 5. STANDARD OPERATING PROCEDURES

### 5.1 SOP-001: Crew Application Process

**Purpose:** Standard procedure for processing seafarer applications to principals

**Scope:** All crew applications for vessel assignments

**Procedure:**

1. **Crew Selection (CDMO)**
   - Review crew database for suitable candidates
   - Check certificate validity (minimum 6 months remaining)
   - Verify medical certificate (valid)
   - Confirm availability and willingness

2. **Document Preparation (CDMO)**
   - Collect updated documents:
     - Passport copy (minimum 12 months validity)
     - COC and endorsement
     - Medical certificate
     - STCW certificates
     - Special certificates (if required)
   - Prepare CR-02 application form
   - Scan all documents in high quality (PDF)

3. **Application Creation (CDMO)**
   - Log into HIMS
   - Navigate to **Crewing** → **Applications** → **New**
   - Fill in application details
   - Upload all documents
   - Set status: PENDING
   - Save application

4. **Submission to Principal (OPERATIONAL)**
   - Review application completeness
   - Email application package to principal
   - Record submission date in HIMS
   - Follow up after 2-3 business days

5. **Principal Response (OPERATIONAL)**
   - Receive approval/rejection from principal
   - Update application status in HIMS:
     - APPROVED: Proceed to assignment
     - REJECTED: Record reason, find alternative candidate
     - PENDING: Continue follow-up

6. **Assignment Creation (CDMO)**
   - For approved applications:
   - Create assignment record
   - Set sign-on date and port
   - Generate crew list entry

**Timeline:** 3-5 business days from selection to approval

**Records:** Application form, email correspondence, approval letter

---

### 5.2 SOP-002: Contract Generation and Signing

**Purpose:** Standardize employment contract creation and execution

**Scope:** All SEA and PKL contracts

**Procedure:**

1. **Contract Initiation (CDMO)**
   - From approved assignment → **Generate Contract**
   - Select contract type:
     - SEA: For onboard compliance (MLC)
     - PKL: For Indonesian regulatory compliance
   - System auto-populates data

2. **Contract Review (OPERATIONAL/ACCOUNTING)**
   - Verify wage details against wage scale
   - Check contract duration and terms
   - Confirm insurance coverage
   - Review repatriation terms
   - Ensure compliance with principal agreement

3. **Contract Finalization (DIRECTOR)**
   - Review complete contract
   - Approve for printing
   - Generate final PDF

4. **Printing and Signing (ADMIN)**
   - Print contract in triplicate:
     - Original: Seafarer
     - Copy 1: Company file
     - Copy 2: Principal (if required)
   - Arrange signing appointment with seafarer
   - Witness signatures

5. **Contract Execution**
   - Company representative signs
   - Seafarer signs
   - Witness signs (if required)
   - Date and stamp each copy

6. **Document Management (CDMO)**
   - Scan signed contract
   - Upload to HIMS
   - Update contract status: ACTIVE
   - File physical copy in crew folder
   - Send copy to principal (email/courier)

7. **PKL Filing (HR)**
   - For PKL contracts:
   - Submit to Hubla online system
   - Obtain registration number
   - Record in HIMS

**Timeline:** 1-2 days from assignment approval

**Records:** Signed contracts (3 copies), Hubla registration (PKL)

---

### 5.3 SOP-003: Document Expiry Management

**Purpose:** Proactive monitoring of certificate and document expiry

**Scope:** All crew certificates, medical, passports, visas

**Procedure:**

1. **Daily Monitoring (CDMO)**
   - Login to HIMS dashboard
   - Review "Expiring Documents" widget
   - Check documents expiring in:
     - 30 days: URGENT (red alert)
     - 60 days: WARNING (yellow alert)
     - 90 days: NOTICE (blue alert)

2. **Notification to Crew**
   - For documents expiring in 90 days:
   - Send email/WhatsApp to seafarer
   - Inform about expiry date
   - Provide renewal instructions
   - Set reminder for follow-up

3. **Renewal Coordination (CDMO)**
   - Assist crew with renewal process
   - Arrange training/medical appointments
   - Coordinate with training centers
   - Track renewal progress

4. **Updated Document Collection**
   - Receive renewed certificate from seafarer
   - Verify authenticity and validity
   - Scan in high quality
   - Upload to HIMS

5. **Document Replacement (CDMO)**
   - Update document record in HIMS
   - Replace old document with new
   - Update expiry date
   - Archive old certificate

6. **Compliance Check (OPERATIONAL)**
   - Weekly review of all crew compliance status
   - Ensure no expired documents
   - Report any critical issues to director

**Frequency:** Daily monitoring, weekly compliance report

**Records:** Renewal notices, updated certificates, compliance reports

---

### 5.4 SOP-004: Crew Replacement Process

**Purpose:** Systematic crew replacement for expiring contracts

**Scope:** All crew sign-offs and replacements

**Procedure:**

1. **Monthly Review (OPERATIONAL)**
   - Generate monthly checklist (last week of month)
   - Identify contracts expiring in next 60 days
   - List all positions requiring replacement
   - Confirm sign-off dates with principals

2. **Replacement Planning (CDMO)**
   - For each expiring position:
   - Search for suitable replacement candidates
   - Check availability and document validity
   - Create shortlist (2-3 candidates per position)
   - Discuss with operational manager

3. **Application Submission**
   - Follow SOP-001 (Crew Application Process)
   - Submit replacement applications to principal
   - Request approval minimum 30 days before sign-off

4. **Approval and Assignment**
   - Receive principal approval
   - Create assignment for replacement crew
   - Set sign-on date (usually same as sign-off date)
   - Coordinate joining arrangements

5. **Sign-off Crew Management (OPERATIONAL)**
   - Arrange transportation for sign-off crew
   - Coordinate with vessel/agent
   - Prepare sign-off documents
   - Calculate final wages

6. **Sign-on Crew Management (CDMO)**
   - Prepare joining documents:
     - Contract (SEA & PKL)
     - Joining instructions
     - Travel tickets
     - Cash advance (if applicable)
   - Brief crew on vessel details
   - Arrange pre-departure medical (if needed)

7. **Crew List Update (CDMO)**
   - Update crew list in HIMS
   - Mark sign-off crew as "STANDBY"
   - Mark sign-on crew as "ON_BOARD"
   - Generate updated crew list report
   - Send to principal and vessel

8. **Contract Closure (ACCOUNTING)**
   - Close contract for sign-off crew
   - Calculate final settlement
   - Process payment
   - Update contract status: COMPLETED

**Timeline:** 60 days advance planning, 30 days execution

**Records:** Monthly checklist, replacement applications, crew list updates

---

### 5.5 SOP-005: External Compliance Management

**Purpose:** Manage external regulatory system requirements

**Scope:** KOSMA, Dephub, Schengen Visa

**Procedure:**

#### **A. KOSMA Certificate (Korea)**

1. **Eligibility Check**
   - For crew assigned to Korean-flagged vessels
   - Check if KOSMA certificate is valid (1 year)
   - If expired or new assignment: proceed with registration

2. **Online Registration**
   - Visit: https://www.marinerights.or.kr
   - Use company account credentials
   - Register seafarer details
   - Pay training fee (approx. USD 50)

3. **Online Training**
   - Seafarer completes 3-hour online course
   - Topics: Korean labor law, MLC rights, complaint procedures
   - Pass online test (minimum 70%)

4. **Certificate Download**
   - Download certificate upon passing
   - Upload to HIMS under "External Compliance"
   - Record:
     - Certificate number
     - Issue date
     - Expiry date (1 year from issue)
   - Print copy for crew file

5. **Renewal Tracking**
   - Set reminder 2 months before expiry
   - Notify crew to renew before next Korean vessel assignment

#### **B. Dephub Certificate Verification (Indonesia)**

1. **Account Access**
   - Login to: https://pelaut.dephub.go.id/login-perusahaan
   - Use company SIUPAK account
   - Navigate to "Verifikasi Sijil"

2. **Seaman Book Verification**
   - Enter seaman book number
   - Enter seafarer name
   - Click "Verify"
   - Check verification result:
     - VALID: Record verification date in HIMS
     - INVALID: Contact seafarer for clarification

3. **Regular Verification**
   - Verify all active crew: Quarterly
   - Verify new crew: Before first assignment
   - Record verification status in HIMS

4. **Discrepancy Resolution**
   - If verification fails:
   - Contact crew to check seaman book details
   - Verify with local Syahbandar office
   - Update records if needed
   - Re-verify online

#### **C. Schengen Visa Application (Netherlands)**

1. **Visa Requirement Check**
   - For crew joining vessels in EU ports
   - Check if visa is required (based on nationality)
   - Verify passport validity (minimum 6 months)

2. **Document Preparation**
   - Collect required documents:
     - Passport (original + copy)
     - Passport photos (2 pcs, 35x45mm)
     - Contract/assignment letter
     - Travel itinerary
     - Proof of accommodation
     - Travel insurance
     - Company invitation letter

3. **Online Application**
   - Visit: https://consular.mfaservices.nl
   - Create account (if new)
   - Fill visa application form
   - Upload supporting documents
   - Pay visa fee (approx. EUR 80)

4. **Appointment Booking**
   - Book appointment at VFS Global center (Jakarta)
   - Bring original documents
   - Submit biometrics (fingerprints, photo)

5. **Application Tracking**
   - Track application status online
   - Record in HIMS:
     - Application number
     - Submission date
     - Status (PENDING/APPROVED/REJECTED)
   - Processing time: 15-20 working days

6. **Visa Collection**
   - Collect passport with visa from VFS
   - Verify visa details:
     - Validity dates
     - Entry type (single/multiple)
     - Duration of stay
   - Scan and upload to HIMS
   - Original to crew

**Records:** Certificates, verification reports, visa copies

---

### 5.6 SOP-006: Monthly Compliance Reporting

**Purpose:** Generate regular compliance reports for management

**Scope:** All crew, documents, contracts

**Procedure:**

1. **Data Collection (CDMO) - Last week of month**
   - Export crew database
   - Export document expiry report
   - Export contract status report
   - Export assignment report

2. **Analysis (OPERATIONAL)**
   - Total crew: Active, On Board, Standby, Inactive
   - Documents expiring: Next 30/60/90 days
   - Contracts expiring: Next 60 days
   - Pending applications: Status summary
   - External compliance: KOSMA, Dephub, Visa status

3. **Report Generation**
   - Create monthly report using template
   - Include:
     - Executive summary
     - Crew statistics
     - Document compliance status
     - Contract renewals needed
     - Critical issues and recommendations
   - Attach supporting data tables

4. **Review and Submission (OPERATIONAL)**
   - Review report for accuracy
   - Submit to Director by 5th of following month
   - Distribute to:
     - Director
     - CDMO
     - Accounting (for financial data)

5. **Management Review (DIRECTOR)**
   - Review monthly report
   - Identify trends and issues
   - Provide feedback and directives
   - Archive report in quality system

**Frequency:** Monthly (by 5th of following month)

**Records:** Monthly compliance reports (digital archive)

---

## 6. COMPLIANCE & QUALITY MANAGEMENT

### 6.1 Maritime Labour Convention (MLC) 2006

#### 6.1.1 MLC Requirements
HIMS ensures compliance with MLC 2006 through:

**Regulation 1.4 - Recruitment and Placement**
- Licensed manning agency (SIUPAK)
- No fees charged to seafarers
- Clear recruitment procedures
- Fair employment terms

**Regulation 2.1 - Seafarers' Employment Agreement**
- Written contract before employment
- Copy provided to seafarer
- Terms clearly stated
- Mutual agreement signatures

**Regulation 2.2 - Wages**
- Clear wage structure
- Timely payment
- Wage slips provided
- Minimum wage compliance

**Regulation 2.3 - Hours of Work and Rest**
- Maximum 14 hours work per day
- Minimum 10 hours rest per 24-hour period
- Overtime properly calculated and paid

**Regulation 2.5 - Repatriation**
- Right to repatriation after contract
- Company covers repatriation costs
- Medical repatriation provisions

**Regulation 4.2 - Medical Care**
- Pre-employment medical examination
- Access to medical care onboard
- Medical facilities ashore

#### 6.1.2 MLC Compliance in HIMS
- Contract templates comply with MLC format
- Wage calculation includes all MLC components
- Document tracking ensures valid medical certificates
- Insurance module tracks P&I coverage
- Disciplinary procedures follow fair treatment principles

### 6.2 STCW Compliance

#### 6.2.1 Certificate Management
HIMS tracks all STCW mandatory certificates:

**Management Level:**
- Certificate of Competency (COC) + Endorsement
- GMDSS (Radio Officer)
- Advanced Fire Fighting
- Medical First Aid
- Ship Security Officer (SSO)

**Operational Level:**
- Proficiency in Survival Craft (PSC)
- Advanced Fire Fighting / Fire Prevention & Fire Fighting
- Elementary First Aid
- Personal Safety & Social Responsibility (PSSR)
- Security Awareness

**Support Level:**
- Basic Safety Training (BST):
  - Personal Survival Techniques
  - Fire Prevention & Fire Fighting
  - Elementary First Aid
  - Personal Safety & Social Responsibility

**Special Certificates:**
- Tanker Familiarization (Basic/Advanced)
- Ship Security Awareness
- Crowd Management (Passenger ships)
- Crisis Management (Passenger ships)

#### 6.2.2 STCW Compliance Monitoring
- Certificate expiry tracking (90/60/30 day alerts)
- Renewal coordination with training centers
- Endorsement verification with flag states
- Compliance reports for principals

### 6.3 ISO 9001:2015 Quality Management

#### 6.3.1 Quality Policy
Hanmarine is committed to:
- Providing competent seafarers meeting international standards
- Continuous improvement of processes
- Customer satisfaction
- Regulatory compliance
- Safe and efficient operations

#### 6.3.2 Quality Objectives
- 98% crew placement success rate
- Zero expired certificates on active crew
- 95% customer satisfaction rating
- 100% regulatory compliance
- Continuous process improvement

#### 6.3.3 Document Control
HIMS serves as the document management system:
- Controlled documents: SOPs, procedures, forms
- Version control and revision history
- Access control based on roles
- Obsolete document archival

#### 6.3.4 Internal Audit Program
- Annual internal audit schedule
- Audit checklists in quality module
- Non-conformance tracking
- Corrective action follow-up
- Management review meetings

### 6.4 Indonesian Maritime Regulations

#### 6.4.1 SIUPAK (Manning Agency License)
- Company licensed by Ministry of Transportation
- License number tracked in system
- Annual renewal compliance

#### 6.4.2 PKL (Perjanjian Kerja Laut)
- Indonesian employment contract format
- Filed with Hubla online system
- Required for all Indonesian seafarers on international voyages
- System tracks PKL registration numbers

#### 6.4.3 Syahbandar (Harbor Master) Requirements
- Seaman book verification
- Sign-on/sign-off reporting
- Crew list submission

---

## 7. TROUBLESHOOTING & SUPPORT

### 7.1 Common Issues

#### 7.1.1 Login Problems

**Issue:** "Invalid credentials" error
**Solution:**
1. Verify email is correct (use @hanmarine.co domain)
2. Check password (case-sensitive)
3. Clear browser cache and cookies
4. Try different browser
5. Contact admin if problem persists

**Issue:** Account locked after multiple failed attempts
**Solution:**
- Wait 15 minutes for automatic unlock
- Contact DIRECTOR or ADMIN for manual unlock

#### 7.1.2 Permission Errors

**Issue:** "Insufficient permissions" message
**Solution:**
1. Verify you're logged in with correct account
2. Check your role matches required permission level
3. Contact DIRECTOR if you need additional permissions
4. Refer to permission matrix (Section 3.2)

#### 7.1.3 Data Not Saving

**Issue:** Changes not saved or data disappears
**Solution:**
1. Check internet connection
2. Verify all required fields are filled
3. Check for validation errors (red highlights)
4. Refresh page and try again
5. Contact technical support if issue persists

#### 7.1.4 Document Upload Failures

**Issue:** Cannot upload documents
**Solution:**
1. Check file size (maximum 10MB per file)
2. Verify file format (PDF, JPG, PNG accepted)
3. Check internet connection speed
4. Try compressing large files
5. Use different browser if issue persists

### 7.2 System Maintenance

#### 7.2.1 Scheduled Maintenance
- **Daily Backup:** 2:00 AM - 2:30 AM WIB
  - Database backup
  - File backup
  - No system downtime expected

- **Weekly Maintenance:** Sunday 1:00 AM - 3:00 AM WIB
  - System updates
  - Security patches
  - Performance optimization
  - Brief downtime possible (5-10 minutes)

- **Monthly Maintenance:** First Saturday 11:00 PM - 1:00 AM WIB
  - Major updates
  - Database optimization
  - System backup verification
  - Planned downtime (up to 2 hours)

#### 7.2.2 Emergency Maintenance
- Announced via email to all users
- System status page: https://app.hanmarine.co/status (if available)
- Critical issues resolved within 4 hours

### 7.3 Technical Support

#### 7.3.1 Support Contacts

**Level 1 Support (General Issues)**
- Email: support@hanmarine.co
- Phone: +62 XXX XXXX XXXX
- Response time: 4 business hours

**Level 2 Support (Technical Issues)**
- Email: tech@hanmarine.co
- Response time: 8 business hours

**Level 3 Support (Critical/Emergency)**
- Contact: DIRECTOR or System Administrator
- Email: arief@hanmarine.co
- Phone: [Emergency contact]
- Response time: 1 hour

#### 7.3.2 Reporting Issues
When reporting an issue, provide:
1. Your name and email
2. Your role in the system
3. Description of the problem
4. Steps to reproduce the issue
5. Screenshots (if applicable)
6. Browser and operating system information
7. Time when issue occurred

### 7.4 Data Recovery

#### 7.4.1 Accidental Deletion
- Contact DIRECTOR immediately
- Provide details of deleted data
- Recovery possible from daily backup (within 7 days)
- Recovery time: 2-4 hours

#### 7.4.2 System Failure
- Automatic failover to backup system
- Data restored from latest backup
- Maximum data loss: 24 hours
- Recovery time: 1-2 hours

---

## 8. APPENDIX

### 8.1 Glossary of Terms

**Assignment:** Crew member's specific work period on a vessel

**CDMO:** Crew Document Management Officer - manages crew documents and compliance

**COC:** Certificate of Competency - seafarer's professional license

**Crewing:** Process of recruiting, assigning, and managing seafarers

**GMDSS:** Global Maritime Distress and Safety System - radio communication certificate

**HGQS:** Hanmarine Group Quality System

**MLC:** Maritime Labour Convention 2006 - international seafarer labor standards

**PKL:** Perjanjian Kerja Laut - Indonesian maritime employment contract

**Principal:** Ship owner or ship management company

**Rank:** Seafarer's position/job title on vessel (e.g., Captain, Chief Engineer)

**SEA:** Seafarer Employment Agreement - MLC-compliant contract

**Sign-on:** Crew member joining a vessel

**Sign-off:** Crew member leaving a vessel

**SIUPAK:** Surat Izin Usaha Perekrutan Awak Kapal - Indonesian manning agency license

**STCW:** Standards of Training, Certification and Watchkeeping for Seafarers

**Syahbandar:** Indonesian Harbor Master authority

### 8.2 Quick Reference Charts

#### 8.2.1 Certificate Validity Periods

| Certificate | Validity | Renewal Lead Time |
|-------------|----------|-------------------|
| COC (Certificate of Competency) | 5 years | 6 months |
| Medical Certificate | 2 years (under 18: 1 year) | 3 months |
| Passport | 10 years | 12 months |
| STCW Certificates (BST, etc.) | 5 years | 6 months |
| Tanker Familiarization | No expiry | N/A |
| KOSMA Certificate | 1 year | 2 months |
| Visa (varies) | As per visa type | 2 months |

#### 8.2.2 Response Time Matrix

| Issue Type | Priority | Response Time | Resolution Time |
|------------|----------|---------------|-----------------|
| System Down | Critical | 15 minutes | 1-2 hours |
| Login Issues | High | 1 hour | 4 hours |
| Permission Errors | Medium | 4 hours | 1 business day |
| Data Corrections | Medium | 4 hours | 1 business day |
| Report Requests | Low | 1 business day | 2 business days |
| Feature Requests | Low | 1 week | As per development schedule |

### 8.3 Contact Information

**PT Hanmarine Indonesia**
- Address: [Company Address]
- Phone: [Company Phone]
- Email: info@hanmarine.co
- Website: https://hanmarine.co

**System Access:**
- Application URL: https://app.hanmarine.co
- Support Email: support@hanmarine.co
- Technical Support: tech@hanmarine.co

**Emergency Contacts:**
- Director: rinaldy@hanmarine.co
- Admin: arief@hanmarine.co
- 24/7 Hotline: [Emergency Number]

### 8.4 Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | December 5, 2025 | Initial complete manual | System Administrator |

---

**END OF MANUAL**

*This document is controlled under HGQS document management system. Any printed copy is uncontrolled. For latest version, refer to HIMS system.*
