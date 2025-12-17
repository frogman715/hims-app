# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS) v2
## Operator Guide & User Manual

### Version 2.0 - November 2025
### HANMARINE GLOBAL INDONESIA

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Login & Authentication](#login--authentication)
4. [Dashboard Overview](#dashboard-overview)
5. [Business Process Flows](#business-process-flows)
6. [Module-Specific Operations](#module-specific-operations)
7. [Data Security & Sensitivity](#data-security--sensitivity)
8. [System Administration](#system-administration)
9. [Troubleshooting](#troubleshooting)
10. [Contact Information](#contact-information)

---

## System Overview

HANMARINE HIMS is a comprehensive maritime crew management system designed to handle all aspects of seafarer lifecycle management, from recruitment to repatriation. The system implements role-based access control with data sensitivity classifications to ensure secure and efficient operations.

### Key Features:
- **Crew Management**: Complete seafarer lifecycle tracking
- **Contract Management**: Employment contracts and PKL agreements
- **Financial Management**: Salary processing, agency fees, expenses
- **Document Management**: Certificate tracking and compliance
- **Operational Control**: Vessel assignments, dispatches, replacements
- **Quality Assurance**: Disciplinary records, performance tracking
- **Reporting**: Comprehensive analytics and compliance reports

---

## User Roles & Permissions

### 1. CDMO (Chief Director Maritime Operations)
**System Administrator with Full Access**
- **Access Level**: All modules, all data sensitivities
- **System Admin Override**: Can access restricted data
- **Responsibilities**:
  - System configuration and maintenance
  - User management and permissions
  - Override security restrictions when necessary
  - Financial approvals and audit oversight

### 2. DIRECTOR
**Executive Management Access**
- **Access Level**: All modules except system administration
- **Data Access**: RED, AMBER, GREEN data
- **Responsibilities**:
  - Strategic decision making
  - Financial oversight and approvals
  - Performance monitoring
  - Policy and procedure management

### 3. ACCOUNTING
**Financial Operations**
- **Access Level**: Accounting, Crew Salary, Agency Fees, Office Expenses
- **Data Access**: RED (salary data), AMBER, GREEN
- **Responsibilities**:
  - Salary processing and payroll
  - Invoice management
  - Expense approvals
  - Financial reporting

### 4. OPERATIONAL
**Crewing & Vessel Operations**
- **Access Level**: Crew, Contracts, Assignments, Documents, Dispatch
- **Data Access**: AMBER, GREEN (limited RED access)
- **Responsibilities**:
  - Crew assignments and rotations
  - Contract management
  - Document processing
  - Operational planning

### 5. HR
**Human Resources Management**
- **Access Level**: Crew, Recruitment, Training, Disciplinary
- **Data Access**: RED (medical/personal), AMBER, GREEN
- **Responsibilities**:
  - Recruitment and onboarding
  - Training coordination
  - Disciplinary actions
  - Employee relations

### 6. CREW_PORTAL
**Limited Crew Access**
- **Access Level**: Personal documents, basic information
- **Data Access**: Own RED data only, limited GREEN
- **Responsibilities**:
  - View personal information
  - Update contact details
  - Document submissions

---

## Login & Authentication

### Initial Login Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| CDMO | cdmo@hanmarine.com | cdmo123 | System Administrator |
| Director | director@hanmarine.com | director123 | Executive Management |
| Accounting | accounting@hanmarine.com | accounting123 | Finance Officer |
| Operational | operational@hanmarine.com | operational123 | Operations Manager |
| HR | hr@hanmarine.com | hr123 | HR Officer |
| Crew Portal | crew@hanmarine.com | crew123 | Crew Access |

### Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, and numbers
- Changed every 90 days
- Cannot reuse last 5 passwords

### Multi-Factor Authentication
- Required for all administrative roles
- SMS verification for critical operations
- Session timeout: 30 minutes of inactivity

---

## Dashboard Overview

### Role-Based Dashboards

Each user role has a customized dashboard displaying relevant KPIs and quick actions.

#### CDMO Dashboard
- System health metrics
- User activity logs
- Critical alerts (expiring documents, overdue payments)
- Financial summaries
- Crew utilization statistics

#### Director Dashboard
- Executive KPIs (revenue, crew count, vessel utilization)
- Pending approvals
- Risk indicators
- Performance metrics

#### Accounting Dashboard
- Outstanding payments
- Salary processing status
- Expense approvals
- Financial alerts

#### Operational Dashboard
- Crew availability
- Vessel assignments
- Document expiry alerts
- Dispatch schedules

#### HR Dashboard
- Recruitment pipeline
- Training completion rates
- Disciplinary cases
- Crew welfare indicators

#### Crew Portal Dashboard
- Personal document status
- Upcoming assignments
- Contact information
- Training requirements

---

## Business Process Flows

### 1. Crew Recruitment Process

```
New Requirement → Application → Interview → Medical Check → Orientation → Assignment
     ↓              ↓           ↓            ↓              ↓            ↓
  HR/Operational  HR/Op      HR/Op       Medical       Training     Operations
```

### 2. Contract Signing Process

```
Crew Selection → Contract Draft → Principal Approval → Crew Signing → PKL Generation
      ↓               ↓              ↓                  ↓               ↓
   Operations      Operations     Principal        Operations      Operations
```

### 3. Joining Process

```
Contract Signed → Document Prep → Visa Processing → Ticket Booking → Dispatch
      ↓               ↓                ↓               ↓            ↓
   Operations      Operations       Operations     Operations   Operations
```

### 4. Salary Processing

```
Contract Active → Salary Calculation → Approval → Payment → Allotment
      ↓               ↓                  ↓        ↓        ↓
   System         Accounting        Director  Finance  Banking
```

### 5. Crew Replacement

```
Notice Received → Replacement Search → Interview → Approval → Handover
      ↓               ↓                  ↓         ↓         ↓
   Operations      HR/Operations     HR/Op    Director  Operations
```

---

## Module-Specific Operations

### Crew Management Module

#### Creating New Crew Record
1. Navigate to Crew → Add New
2. Enter personal information (name, DOB, nationality)
3. Upload passport and seaman book details
4. Set data sensitivity level
5. Save and assign initial status

#### Document Management
1. Access crew profile → Documents tab
2. Upload new document with type and expiry
3. System validates document type requirements
4. Automatic expiry alerts generated

### Contract Management

#### Employment Contract Creation
1. Select crew and vessel
2. Choose wage scale or enter custom terms
3. Set contract period and conditions
4. Generate PDF for signatures
5. Track approval workflow

#### PKL Contract Generation
1. Based on employment contract
2. Auto-populate vessel and principal details
3. Include wage and allowance details
4. Generate official PKL document

### Financial Operations

#### Salary Processing
1. System calculates based on contract terms
2. Accounting review and approval
3. Generate payslips and bank transfers
4. Track payment status

#### Agency Fee Management
1. Calculate based on contract value
2. Track payment schedules
3. Generate invoices to principals
4. Monitor outstanding balances

### Operational Management

#### Vessel Assignments
1. Check crew availability
2. Match rank and qualifications
3. Create assignment record
4. Update crew status

#### Dispatch Management
1. Prepare joining instructions
2. Book flights and hotels
3. Generate travel documents
4. Track dispatch status

---

## Data Security & Sensitivity

### Data Classification Levels

#### RED (Highly Sensitive)
- Passport information
- Medical records
- Full salary breakdowns
- Disciplinary records
- Personal contact details

#### AMBER (Sensitive)
- Certificate details
- Contract terms
- Performance reviews
- Travel information

#### GREEN (Internal/Normal)
- Vessel information
- Public procedures
- General statistics
- Company policies

### Access Controls

- **Role-based permissions** determine module access
- **Data sensitivity** controls field-level visibility
- **System admin override** for emergency access
- **Audit logging** tracks all data access

### Data Retention

- **Active crew data**: Indefinite retention
- **Inactive crew**: 7 years minimum
- **Financial records**: 10 years
- **Audit logs**: 5 years

---

## System Administration

### User Management

#### Creating New Users
1. Access Admin → User Management
2. Enter user details and role
3. Set initial password
4. Assign permissions
5. Send welcome email

#### Permission Management
1. Define role-based access rules
2. Set data sensitivity permissions
3. Configure approval workflows
4. Audit permission changes

### System Configuration

#### Business Rules Setup
1. Configure wage scales
2. Set document requirements
3. Define approval hierarchies
4. Customize workflows

#### Integration Settings
1. Configure email templates
2. Set up notification rules
3. Connect external systems
4. Manage API access

### Backup & Recovery

- **Daily automated backups**
- **Point-in-time recovery** available
- **Offsite backup storage**
- **Disaster recovery plan** documented

---

## Troubleshooting

### Common Issues

#### Login Problems
- Check email and password
- Verify account is active
- Contact administrator for account issues

#### Permission Errors
- Verify user role and permissions
- Check data sensitivity requirements
- Contact system administrator

#### Data Not Displaying
- Check internet connection
- Clear browser cache
- Verify user permissions

#### Document Upload Failures
- Check file size limits (10MB max)
- Verify file format compatibility
- Ensure network stability

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| AUTH001 | Invalid credentials | Check username/password |
| PERM002 | Insufficient permissions | Contact administrator |
| DATA003 | Data sensitivity restriction | Request access elevation |
| FILE004 | Upload failed | Check file requirements |

### Support Process

1. **Level 1**: User self-service via help documentation
2. **Level 2**: Department IT support
3. **Level 3**: System administrator
4. **Level 4**: Vendor technical support

---

## Contact Information

### System Administration
- **CDMO Administrator**: cdmo@hanmarine.com
- **Technical Support**: support@hanmarine.com
- **Emergency Hotline**: +62-21-1234-5678

### Department Contacts

| Department | Contact | Email |
|------------|---------|-------|
| Accounting | Finance Officer | accounting@hanmarine.com |
| Operations | Operations Manager | operational@hanmarine.com |
| HR | HR Officer | hr@hanmarine.com |
| IT Support | System Admin | cdmo@hanmarine.com |

### Business Hours
- **Monday - Friday**: 08:00 - 17:00 WIB
- **Emergency Support**: 24/7 available
- **Response Time**: 4 hours for critical issues

---

## Appendix

### Document Type Requirements

| Document Type | Required For | Validity Period | Responsible |
|---------------|--------------|-----------------|-------------|
| Passport | All crew | 6 months min | Operations |
| Seaman Book | All crew | 6 months min | Operations |
| STCW Certificates | Officers | 12 months min | HR |
| Medical Certificate | All crew | 12 months | Medical |
| Visa | As required | Per destination | Operations |

### Approval Workflows

#### Contract Approvals
1. Operations draft → HR review → Director approval → Principal confirmation

#### Salary Adjustments
1. Operations request → Accounting review → Director approval

#### Disciplinary Actions
1. Supervisor report → HR investigation → Director decision

### System Performance Metrics

- **Response Time**: <2 seconds for standard operations
- **Uptime**: 99.5% target
- **Data Accuracy**: 100% validation rules
- **Backup Success**: 100% daily

---

*This manual is confidential and for authorized HANMARINE personnel only. Version 2.0 - November 2025*