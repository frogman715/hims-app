# HIMS Application User Manual

## 1. Introduction
- Purpose: guide Hanmarine crew coordinators and managers through daily use of the HIMS web app.
- Audience: authenticated users across DIRECTOR, CDMO, OPERATIONAL, ACCOUNTING, HR, and CREW_PORTAL roles.
- Platform: https://app.hanmarine.co (Next.js based, optimized for Chrome/Edge).

## 2. Getting Started
- Browser: always use the latest Chrome or Edge desktop version; mobile browsers are read-only.
- Credentials: provided by the system administrator; change default password on first login.
- Support: email itsupport@hanmarine.co or reach CDMO operations chat for urgent escalations.

### 2.1 Default User Accounts (Initial Setup)
- **DIRECTOR**
	- Rinaldy — `rinaldy@hanmarine.co` / `director2025`
	- Arief — `arief@hanmarine.co` / `admin2025`
- **ACCOUNTING**
	- Dino — `dino@hanmarine.co` / `accounting2025`
- **CDMO**
	- Crew Document Management — `cdmo@hanmarine.co` / `cdmo123`
- **OPERATIONAL**
	- Operational Manager — `operational@hanmarine.co` / `operational123`
- **HR**
	- HR Officer — `hr@hanmarine.co` / `hr123`
- **CREW_PORTAL**
	- Crew Portal — `crew@hanmarine.co` / `crew2025`
- **AUDITOR (VIEW ONLY)**
	- External Auditor — `auditor@hanmarine.co` / `auditor2025`

> Update the default passwords immediately after first login using Profile → Change Password.

## 3. Login and Security
- Navigate to the sign in page and enter email + password.
- MFA (if enabled) appears after password; follow OTP instructions.
- Forgotten credentials: click "Forgot password" or contact an HR administrator.
- Session timeout: inactive users are logged out after 30 minutes; save drafts frequently.

## 4. Navigation Overview
- **Global Sidebar**: quick links to Dashboard, Crew, Applications, Assignments, Contracts, Compliance, Accounting, Reports, Settings.
- **Top Bar**: search, notifications, and profile menu for password change + logout.
- **Breadcrumbs**: show current module path (e.g., Crew > Active Seafarers > Detail).

## 5. Dashboard Widgets
- Crew Status Summary: active, standby, on leave counts.
- Upcoming Sign On/Off: 30-day schedule with vessel name and rank.
- Compliance Alerts: certificate expirations, medical checks due.
- Finance Snapshot: pending invoices, payroll batches awaiting approval.

## 6. Core Modules

### 6.1 Crew
- Search crew by name, seaman book, rank, or status filter.
- View detail tabs: Profile, Documents, Contracts, Assignments, Medical.
- Actions: edit profile, upload documents (PDF/JPG), mask sensitive data for AMBER level users.

### 6.2 Applications
- Intake new applications (CR-02), attach resume, certificates, and evaluation forms.
- Status pipeline: Received > Screening > Interview > Approved/Rejected.
- Convert approved applicants directly into Crew records with one click.

### 6.3 Assignments
- Manage vessel roster and on-board dates.
- Use Gantt view for rotations; drag and drop adjusts sign-on/sign-off.
- Replacement flow links to Monthly Checklist for compliance.

### 6.4 Contracts
- Create SEA or OFFICE_PKL contract templates; auto-populate salary, vessel, and principal.
- Draft -> Review -> Approved -> Issued; PDF export for signing.
- Accounting role has full access; other roles follow RBAC limits.

### 6.5 Compliance
- Track external systems: KOSMA, Dephub, Schengen Visa NL.
- Widget shows status (Pending, Verified, Expired) and renewal reminders.
- Upload proof and link to external portal for auditing.

### 6.6 Accounting
- Manage crew payroll, allotments, and invoice submissions.
- Import bank remittance files; verify totals before posting.
- Export CSV for finance system import (monthly batch).

## 7. Searching and Filtering
- Global search (top bar) queries crew, vessel, and contract numbers.
- Module filters save per user; click "Reset" to clear.
- Use advanced filter drawer for multi-select (rank, vessel, principal).

## 8. Data Entry Tips
- Mandatory fields marked with *; system prevents save without completion.
- Upload max file size 10 MB; larger docs compress before upload.
- Date picker enforces ISO format (YYYY-MM-DD).
- Use Notes section to log operational updates (auto stamped with user + time).

## 9. Notifications and Tasks
- Bell icon displays pending approvals, expiring documents, and workflow assignments.
- Email alerts sent daily for overdue compliance items.
- Users can snooze alerts for up to 7 days; Directors receive summary digest.

## 10. Reports and Exports
- Available reports: Crew Listing, Contract Expiry, Compliance Summary, Payroll Register.
- Export options: XLSX and PDF; exports are emailed for large datasets (>5k rows).
- Schedule recurring reports from Settings > Scheduled Exports.

## 11. Profile Management
- Access via top-right avatar > Profile.
- Update contact info, change password, configure notification preferences.
- Enable duo-factor security when available.

## 12. Troubleshooting
- Page not loading: clear browser cache, retry in incognito, ensure no VPN blocking domain.
- Permission denied: verify role in Settings or contact admin.
- Upload fails: check file size and format, rename file without special characters.
- Server Action error: refresh browser or contact IT to confirm latest deployment.

## 13. Best Practices
- Log out when leaving workstation.
- Review dashboard alerts at start and end of day.
- Keep crew documents updated immediately after receipt.
- Use comment threads instead of external messaging for audit trail.

## 14. Support Escalation Matrix
1. Contact module lead (Crew: HR Supervisor, Compliance: CDMO).
2. Submit ticket via ITSM portal with screenshot and timestamp.
3. Emergency hotline: +62-21-555-0101 (24/7).

## 15. Revision History
- v1.0 (2025-12-11): Initial manual covering HIMS core modules.
