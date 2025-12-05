# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS)
## User Manual & Operational Guide

**Version:** 5.0 - Enterprise Edition
**Date:** December 3, 2025
**Classification:** INTERNAL USE ONLY
**Company:** PT. HANMARINE Indonesia
**Compliance:** ISO 9001:2015 | MLC 2006 | STCW 2010 | ISM Code

---

## 📋 Executive Summary

HANMARINE HIMS is a comprehensive, enterprise-grade maritime crew management system designed to handle the complete lifecycle of seafarer operations from recruitment to repatriation. This system implements world-class security standards, regulatory compliance, and operational efficiency for maritime industry excellence.

### Key System Capabilities:
- **Complete Crew Lifecycle Management**: End-to-end seafarer operations
- **Regulatory Compliance**: IMO, STCW, MLC, Flag State requirements
- **Enterprise Security**: AES-256 encryption, MFA, comprehensive audit trails
- **Role-Based Access Control**: Granular permissions with data sensitivity levels
- **Real-time Operations**: Live dashboards and automated workflows

---

## 📊 Table of Contents

| Section | Description | Page |
|---------|-------------|------|
| 1.0 | System Overview | 3 |
| 2.0 | User Roles & Permissions | 5 |
| 3.0 | Getting Started | 12 |
| 4.0 | Core Modules | 18 |
| 5.0 | Business Processes | 45 |
| 6.0 | Security & Data Protection | 62 |
| 7.0 | Reporting & Analytics | 75 |
| 8.0 | Troubleshooting | 82 |
| 9.0 | Compliance & Standards | 89 |
| 10.0 | Support & Training | 95 |

---

## 1.0 🎯 SYSTEM OVERVIEW

### 1.1 Purpose & Objectives

HANMARINE HIMS serves as the centralized digital platform for managing all maritime crew operations, ensuring compliance with international maritime standards while optimizing operational efficiency.

#### Primary Objectives:
1. **Operational Excellence**: Streamline crew management processes
2. **Regulatory Compliance**: Maintain 100% adherence to maritime regulations
3. **Data Security**: Protect sensitive crew and commercial information
4. **Cost Efficiency**: Reduce administrative overhead and errors
5. **Real-time Visibility**: Provide live operational insights

### 1.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HANMARINE HIMS v5.0                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Frontend  │  │   Backend   │  │  Database   │         │
│  │ Next.js 16  │  │ API Routes  │  │ PostgreSQL  │         │
│  │ React 19    │  │ Node.js     │  │ Prisma ORM  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Security   │  │ Compliance  │  │ Monitoring  │         │
│  │ AES-256     │  │ ISO/MLC     │  │ Audit Logs  │         │
│  │ MFA/2FA     │  │ STCW/IMO    │  │ Real-time   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Key Features

#### Core Capabilities:
- **Multi-role Dashboard**: Role-specific interfaces and KPIs
- **Document Management**: Centralized document storage with version control
- **Workflow Automation**: Automated approval processes and notifications
- **Real-time Collaboration**: Live updates and communication tools
- **Mobile Responsiveness**: Optimized for tablets and mobile devices
- **API Integration**: Third-party system connectivity

#### Advanced Features:
- **Predictive Analytics**: Crew availability forecasting
- **Automated Compliance**: Regulatory requirement monitoring
- **Smart Notifications**: Intelligent alert system
- **Offline Capability**: Limited offline functionality for critical operations

---

## 2.0 👥 USER ROLES & PERMISSIONS

### 2.1 Role Hierarchy

HANMARINE HIMS implements a comprehensive role-based access control (RBAC) system with 10 distinct user roles, each with specific permissions and data access levels.

#### Executive Leadership
| Role | Primary Function | Access Level | Reports To |
|------|------------------|--------------|------------|
| **EXECUTIVE_MANAGEMENT** | Strategic oversight | FULL_SYSTEM | Board of Directors |
| **CREWING_MANAGER** | Crew operations leadership | FULL_CREWING | Executive Management |

#### Operational Roles
| Role | Primary Function | Access Level | Reports To |
|------|------------------|--------------|------------|
| **CREWING_SUPERVISOR** | Daily crew supervision | EDIT_CREWING | Crewing Manager |
| **CREWING_OFFICER** | Crew data management | EDIT_CREWING | Crewing Supervisor |
| **ACCOUNTING_MANAGER** | Financial operations | FULL_FINANCE | Executive Management |
| **ACCOUNTING_OFFICER** | Financial transactions | EDIT_FINANCE | Accounting Manager |

#### Support Roles
| Role | Primary Function | Access Level | Reports To |
|------|------------------|--------------|------------|
| **HR_MANAGER** | Personnel management | FULL_HR | Executive Management |
| **HR_OFFICER** | HR administration | EDIT_HR | HR Manager |
| **QUALITY_MANAGER** | Compliance & QA | FULL_QUALITY | Executive Management |
| **QUALITY_OFFICER** | QA operations | EDIT_QUALITY | Quality Manager |

### 2.2 Permission Matrix

#### 🔴 RED - HIGHLY SENSITIVE DATA ACCESS
| Module/Resource | EXEC | CM | CS | CO | AM | AO | HM | HO | QM | QO |
|-----------------|------|----|----|----|----|----|----|----|----|----|
| Principal Agreements | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Salary Data | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Medical Records | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Passport Scans | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

#### 🟡 AMBER - SENSITIVE DATA ACCESS
| Module/Resource | EXEC | CM | CS | CO | AM | AO | HM | HO | QM | QO |
|-----------------|------|----|----|----|----|----|----|----|----|----|
| Contract Terms | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Performance Reviews | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Training Records | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Disciplinary Cases | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

#### 🟢 GREEN - INTERNAL DATA ACCESS
| Module/Resource | EXEC | CM | CS | CO | AM | AO | HM | HO | QM | QO |
|-----------------|------|----|----|----|----|----|----|----|----|----|
| Vessel Information | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crew Statistics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Company Policies | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| General Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.3 Data Sensitivity Levels

#### Level Definitions:
- **🔴 RED**: Highly sensitive data requiring executive approval for access
- **🟡 AMBER**: Sensitive operational data with restricted access
- **🟢 GREEN**: Internal company data with broad access

#### Access Rules:
- **RED Data**: Requires MFA, logged access, no export capability
- **AMBER Data**: Standard authentication, audit logging, limited export
- **GREEN Data**: Basic authentication, general access controls

---

## 3.0 🚀 GETTING STARTED

### 3.1 System Access

#### Login Process:
1. Navigate to `https://hims.hanmarine.com`
2. Enter corporate email and password
3. Complete Multi-Factor Authentication (MFA) if required
4. Select role if multiple roles assigned
5. Access role-specific dashboard

#### Password Requirements:
- Minimum 12 characters
- Uppercase, lowercase, numbers, and special characters
- Changed every 90 days
- Cannot reuse last 5 passwords
- No dictionary words or personal information

### 3.2 Dashboard Overview

Each role has a customized dashboard displaying relevant KPIs and quick actions.

#### Executive Dashboard KPIs:
- Total Active Crew: Current onboard count
- Fleet Utilization: Vessel capacity vs. crew deployment
- Financial Overview: Monthly revenue and expenses
- Compliance Status: Regulatory adherence metrics
- Critical Alerts: Urgent items requiring attention

#### Operational Dashboard KPIs:
- Crew Pipeline: Recruitment funnel status
- Assignment Readiness: Crew available for deployment
- Document Expiry: Certificates requiring renewal
- Travel Coordination: Upcoming joinings/sign-offs

### 3.3 Navigation Structure

```
HANMARINE HIMS
├── Dashboard (Role-specific overview)
├── Crewing
│   ├── Applications (Recruitment pipeline)
│   ├── Assignments (Vessel deployments)
│   ├── Contracts (Employment agreements)
│   ├── Crew List (Active personnel)
│   └── Documents (Certificates & licenses)
├── Accounting
│   ├── Agency Fees (Commission management)
│   ├── Billing (Invoice processing)
│   ├── Wages (Salary administration)
│   └── Reports (Financial analytics)
├── HR
│   ├── Employees (Personnel records)
│   ├── Disciplinary (Incident management)
│   ├── Training (Certification tracking)
│   └── Attendance (Time management)
├── Quality
│   ├── Inspections (Safety compliance)
│   ├── Audits (Internal reviews)
│   ├── Documents (Quality records)
│   └── Reports (Compliance analytics)
└── Admin (System administration - restricted access)
```

---

## 4.0 📊 CORE MODULES

### 4.1 Crewing Management Module

#### 4.1.1 Applications Management
**Purpose**: Manage seafarer recruitment pipeline
**Access**: Crewing Department (Manager, Supervisor, Officer)

**Key Functions**:
- Create new job requisitions
- Review and process applications
- Schedule interviews and assessments
- Track candidate progress
- Generate recruitment reports

**Workflow**:
```
Job Requisition → Application Review → Interview → Assessment → Selection → Offer
```

#### 4.1.2 Assignments Management
**Purpose**: Manage crew deployment to vessels
**Access**: Crewing Department + Executive Management

**Key Functions**:
- View vessel crew requirements
- Match crew qualifications to positions
- Create deployment assignments
- Track assignment status
- Manage crew rotations

**Assignment Types**:
- **Planned**: Scheduled deployments
- **Emergency**: Urgent crew replacements
- **Temporary**: Short-term assignments
- **Training**: Onboard training deployments

#### 4.1.3 Contracts Management
**Purpose**: Employment contract lifecycle management
**Access**: Crewing Department + Accounting + Legal

**Key Functions**:
- Generate employment contracts
- Create PKL (Pelaut Kapal Laut) documents
- Track contract expiry dates
- Manage contract amendments
- Process contract terminations

**Contract Types**:
- **SEA Contracts**: Maritime employment agreements
- **OFFICE PKL**: Office-based contracts
- **KOREA Standard**: Korean maritime law contracts
- **BAHAMAS/PANAMA**: Flag state specific contracts

### 4.2 Principal Management Module

#### 4.2.1 Principal Agreements
**Purpose**: Manage ship owner relationships and agreements
**Access**: Executive Management + Crewing Manager (🔴 HIGHLY SENSITIVE)

**Key Functions**:
- Maintain principal contact information
- Track agreement terms and conditions
- Monitor agreement expiry dates
- Manage financial terms and penalties
- Generate compliance reports

**Agreement Components**:
- **Commercial Terms**: Pricing and payment conditions
- **Operational Requirements**: Crew qualifications and standards
- **Compliance Obligations**: Regulatory and safety requirements
- **Termination Clauses**: Contract exit conditions

#### 4.2.2 Vessel Information
**Purpose**: Maintain vessel database and specifications
**Access**: All operational roles (🟢 GREEN)

**Key Functions**:
- Vessel registration and specifications
- Crew capacity and rank requirements
- Safety equipment and certifications
- Maintenance schedules and history
- Performance and utilization tracking

### 4.3 Financial Management Module

#### 4.3.1 Agency Fees Management
**Purpose**: Commission calculation and payment tracking
**Access**: Accounting Department + Executive Management

**Key Functions**:
- Calculate agency fees based on contract values
- Track payment schedules and due dates
- Generate invoices to principals
- Monitor outstanding balances
- Reconcile payments and adjustments

**Fee Structure**:
- **Percentage-based**: Percentage of contract value
- **Fixed fees**: Standard charges per transaction
- **Tiered pricing**: Volume-based discounts
- **Special agreements**: Custom pricing arrangements

#### 4.3.2 Wage Processing
**Purpose**: Salary calculation and payment administration
**Access**: Accounting Department (🔴 HIGHLY SENSITIVE)

**Key Functions**:
- Calculate monthly salaries based on contracts
- Process allotments and deductions
- Generate payslips and payment instructions
- Track payment status and confirmations
- Handle salary adjustments and bonuses

**Salary Components**:
- **Basic Wage**: Contractual base salary
- **Overtime**: Additional hours compensation
- **Allowances**: Special duty allowances
- **Deductions**: Tax and other withholdings

### 4.4 HR & Disciplinary Module

#### 4.4.1 Employee Records
**Purpose**: Comprehensive personnel data management
**Access**: HR Department + Crewing Department

**Key Functions**:
- Maintain personal information and contact details
- Track employment history and qualifications
- Manage document storage and access
- Generate personnel reports and analytics

**Data Categories**:
- **Personal Information**: Name, DOB, nationality, contact details
- **Professional Qualifications**: Licenses, certificates, training
- **Employment History**: Previous positions and experience
- **Medical Information**: Health records and restrictions (🔴 SENSITIVE)

#### 4.4.2 Disciplinary Management
**Purpose**: Incident reporting and disciplinary action tracking
**Access**: HR Department + Quality Department + Executive Management

**Key Functions**:
- Report and document incidents
- Conduct investigations and hearings
- Implement disciplinary measures
- Track appeal processes and outcomes
- Generate disciplinary reports

**Disciplinary Process**:
```
Incident Report → Investigation → Hearing → Decision → Implementation → Appeal (if applicable)
```

### 4.5 Quality Assurance Module

#### 4.5.1 Inspections Management
**Purpose**: Safety and compliance inspection coordination
**Access**: Quality Department + Executive Management

**Key Functions**:
- Schedule and conduct vessel inspections
- Document inspection findings and deficiencies
- Track corrective action implementation
- Generate inspection reports and certificates

**Inspection Types**:
- **Pre-voyage Inspections**: Safety readiness checks
- **Port State Control**: Flag state compliance verification
- **Internal Audits**: Company standard compliance
- **Third-party Inspections**: Classification society surveys

#### 4.5.2 Document Control
**Purpose**: Quality document management and version control
**Access**: All departments with approval workflows

**Key Functions**:
- Maintain document version control
- Manage approval and review processes
- Track document distribution and access
- Archive historical versions
- Generate document audit trails

---

## 5.0 🔄 BUSINESS PROCESSES

### 5.1 Recruitment Process Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Job Requisition │ -> │  Application    │ -> │  Initial Screen │
│  (Crewing Dept)  │    │  (Candidate)    │    │  (HR/Crewing)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Interview      │ -> │  Assessment     │ -> │  Medical Check  │
│  (Panel)        │    │  (Technical)    │    │  (Medical)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Reference      │ -> │  Background     │ -> │  Final Approval │
│  Check          │    │  Verification   │    │  (Management)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Offer Letter   │ -> │  Contract       │ -> │  Onboarding     │
│  (HR)           │    │  Preparation    │    │  (Operations)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 5.2 Joining Process Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Contract       │ -> │  Document       │ -> │  Visa           │
│  Signed         │    │  Preparation    │    │  Processing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Travel         │ -> │  Ticket         │ -> │  Pre-Joining    │
│  Authorization  │    │  Booking        │    │  Briefing       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Dispatch       │ -> │  Sign-On        │ -> │  Assignment     │
│  Coordination   │    │  Process        │    │  Activation     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 5.3 Salary Processing Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Contract       │ -> │  Time Sheet     │ -> │  Calculation    │
│  Verification   │    │  Validation     │    │  (System)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Supervisor     │ -> │  Accounting     │ -> │  Executive      │
│  Approval       │    │  Review         │    │  Approval       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Payment        │ -> │  Allotment      │ -> │  Confirmation   │
│  Processing     │    │  Distribution   │    │  (Crew)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 5.4 Emergency Replacement Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Emergency      │ -> │  Crew           │ -> │  Qualification  │
│  Notification   │    │  Availability   │    │  Verification   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Assignment     │ -> │  Document       │ -> │  Travel         │
│  Creation       │    │  Preparation    │    │  Coordination   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Rapid          │ -> │  Handover       │ -> │  Sign-Off       │
│  Deployment     │    │  Process        │    │  Original Crew  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 6.0 🔒 SECURITY & DATA PROTECTION

### 6.1 Authentication & Authorization

#### Multi-Factor Authentication (MFA):
- **Required Roles**: EXECUTIVE_MANAGEMENT, CREWING_MANAGER, ACCOUNTING_MANAGER
- **Methods**: SMS verification, authenticator apps, hardware tokens
- **Grace Period**: 7 days for initial setup
- **Backup Codes**: 10 emergency access codes per user

#### Session Management:
- **Timeout**: 30 minutes of inactivity
- **Concurrent Sessions**: Maximum 3 simultaneous sessions
- **Device Tracking**: IP address and device fingerprinting
- **Force Logout**: Immediate termination for security incidents

### 6.2 Data Classification & Handling

#### 🔴 RED - Highly Sensitive Data:
**Access Requirements**: Executive approval, MFA mandatory, full audit logging
**Storage**: Encrypted at rest, no external export, masked in logs
**Retention**: 10 years minimum, secure deletion protocols
**Examples**:
- Principal agreement terms and financial data
- Individual salary breakdowns and personal finances
- Complete medical records and health information
- Full passport scans and biometric data

#### 🟡 AMBER - Sensitive Data:
**Access Requirements**: Department approval, standard authentication, audit logging
**Storage**: Encrypted at rest, controlled export, partial masking in logs
**Retention**: 7 years minimum, standard deletion protocols
**Examples**:
- Employment contract terms and conditions
- Performance reviews and disciplinary records
- Training records and certification details
- Travel and accommodation arrangements

#### 🟢 GREEN - Internal Data:
**Access Requirements**: Basic authentication, general access controls
**Storage**: Standard encryption, full export capability, no masking
**Retention**: 5 years minimum, standard deletion protocols
**Examples**:
- Vessel specifications and operational data
- Company policies and procedures
- Statistical reports and analytics
- General operational information

### 6.3 Encryption & Data Protection

#### Data at Rest:
- **Algorithm**: AES-256-GCM
- **Key Management**: AWS KMS or equivalent
- **Key Rotation**: Automatic every 90 days
- **Backup Encryption**: Same standards as production

#### Data in Transit:
- **Protocol**: TLS 1.3 minimum
- **Certificate**: Valid, trusted certificates only
- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate Pinning**: Implemented for critical systems

#### Data Masking:
- **PII Fields**: Automatic masking in logs and reports
- **Financial Data**: Partial masking for audit trails
- **Document Previews**: Watermarked and access-controlled

### 6.4 Audit & Compliance Logging

#### Audit Trail Requirements:
- **All Access**: Every data access logged with user, timestamp, IP
- **Data Changes**: Before/after values for all modifications
- **Export Activities**: File exports tracked with recipient information
- **Failed Access**: Unauthorized access attempts logged and alerted

#### Log Retention:
- **Security Events**: 7 years minimum
- **Access Logs**: 2 years minimum
- **Audit Logs**: 7 years minimum (regulatory requirement)
- **System Logs**: 1 year minimum

---

## 7.0 📈 REPORTING & ANALYTICS

### 7.1 Dashboard Analytics

#### Executive Dashboard:
- **Crew Utilization**: Active vs. planned crew deployment
- **Financial Performance**: Revenue, expenses, profitability trends
- **Compliance Status**: Regulatory adherence percentages
- **Operational Efficiency**: Process completion times and bottlenecks

#### Operational Dashboard:
- **Recruitment Pipeline**: Candidate flow and conversion rates
- **Assignment Status**: Current deployment and availability
- **Document Compliance**: Certificate expiry tracking
- **Travel Coordination**: Upcoming movements and logistics

### 7.2 Standard Reports

#### Crewing Reports:
- **Crew List Report**: Active crew by vessel/rank
- **Recruitment Analytics**: Time-to-hire and source effectiveness
- **Assignment History**: Crew deployment patterns
- **Contract Status**: Expiring contracts and renewals

#### Financial Reports:
- **Agency Fee Summary**: Commission by principal/vessel
- **Salary Reports**: Payroll summaries and distributions
- **Expense Analysis**: Cost center breakdowns
- **Payment Status**: Outstanding and overdue tracking

#### Compliance Reports:
- **Certificate Expiry**: Documents requiring renewal
- **Training Compliance**: Required vs. completed training
- **Medical Fitness**: Health certificate status
- **Regulatory Compliance**: IMO/STCW/MLC adherence

### 7.3 Custom Analytics

#### Predictive Analytics:
- **Crew Availability Forecasting**: Future deployment planning
- **Recruitment Demand**: Anticipated hiring needs
- **Cost Projections**: Budget forecasting and variance analysis
- **Compliance Trends**: Risk assessment and mitigation planning

#### Advanced Filtering:
- **Date Ranges**: Historical and future period analysis
- **Geographic Filters**: Port, region, and nationality analysis
- **Vessel Filters**: Fleet-wide or individual vessel metrics
- **Role-based Views**: Department-specific data perspectives

---

## 8.0 🛠️ TROUBLESHOOTING

### 8.1 Common Issues & Solutions

#### Login Problems:
**Issue**: "Invalid credentials" error
**Solutions**:
- Verify username and password (case-sensitive)
- Check account status (may be locked or expired)
- Reset password through IT support
- Clear browser cache and cookies
- Try different browser or incognito mode

#### Permission Errors:
**Issue**: "Access denied" or "Insufficient permissions"
**Solutions**:
- Verify user role and assigned permissions
- Check data sensitivity requirements for requested data
- Contact supervisor for role clarification
- Submit permission request through proper channels

#### System Performance:
**Issue**: Slow loading or system unresponsiveness
**Solutions**:
- Check internet connection stability
- Clear browser cache and temporary files
- Close unnecessary browser tabs
- Try accessing during off-peak hours
- Contact IT support if issue persists

#### Data Display Issues:
**Issue**: Information not showing or incorrect data
**Solutions**:
- Refresh the page (F5 or Ctrl+F5)
- Check user permissions for data visibility
- Verify data filters and search criteria
- Clear browser cache
- Report to IT if data appears corrupted

### 8.2 Error Codes Reference

| Error Code | Description | User Action | Support Action |
|------------|-------------|-------------|----------------|
| AUTH001 | Authentication failed | Check credentials, reset password | Check account status |
| PERM002 | Permission denied | Request access, contact supervisor | Review role permissions |
| DATA003 | Data access restricted | Contact data owner | Check data classification |
| FILE004 | File upload failed | Check file size/type, retry | Verify storage capacity |
| NET005 | Network connection error | Check internet, retry | Investigate connectivity |
| SYS006 | System temporarily unavailable | Wait and retry | Check system status |

### 8.3 System Maintenance Windows

#### Scheduled Maintenance:
- **Weekly**: Sunday 02:00-04:00 WIB (system optimization)
- **Monthly**: Last Sunday of month 01:00-03:00 WIB (security updates)
- **Quarterly**: Major version updates (advance notice provided)
- **Emergency**: Unscheduled as needed (minimal impact)

#### Maintenance Communications:
- Email notifications 48 hours in advance
- Dashboard banner alerts
- SMS alerts for critical maintenance
- Post-maintenance status reports

---

## 9.0 ⚖️ COMPLIANCE & STANDARDS

### 9.1 International Maritime Standards

#### IMO (International Maritime Organization):
- **ISM Code**: International Safety Management Code compliance
- **ISPS Code**: International Ship and Port Facility Security Code
- **MARPOL**: Marine pollution prevention standards
- **SOLAS**: Safety of Life at Sea requirements

#### STCW (Standards of Training, Certification & Watchkeeping):
- **Certification Tracking**: Mandatory competency requirements
- **Training Records**: Formal training and assessment documentation
- **Watchkeeping Standards**: Rest hour and fatigue management
- **Proficiency Validation**: Regular skills assessment and renewal

#### MLC (Maritime Labour Convention) 2006:
- **Employment Conditions**: Fair working conditions and contracts
- **Accommodation Standards**: Crew living and working conditions
- **Health Protection**: Medical care and health & safety requirements
- **Complaint Procedures**: Crew grievance and resolution mechanisms

### 9.2 National Regulatory Compliance

#### Indonesian Maritime Regulations:
- **UU No. 17/2008**: Shipping law compliance
- **Permen No. 7/2013**: Indonesian seafarers certification
- **Flag State Requirements**: Indonesian flag vessel standards
- **Port State Control**: Compliance with international inspections

#### International Flag State Requirements:
- **Classification Society**: Bureau Veritas, DNV, ABS standards
- **Port State Control**: Paris MoU, Tokyo MoU compliance
- **Coastal State Requirements**: Local maritime authority standards

### 9.3 Quality Management Standards

#### ISO 9001:2015 Compliance:
- **Quality Management System**: Documented processes and procedures
- **Continuous Improvement**: Regular process optimization
- **Customer Focus**: Stakeholder requirement management
- **Risk-based Thinking**: Proactive risk identification and mitigation

#### Internal Quality Standards:
- **HANMARINE Quality Manual**: Company-specific procedures
- **Safety Management System**: Incident prevention and response
- **Environmental Management**: Pollution prevention measures
- **Security Management**: Facility and information security

### 9.4 Audit & Certification Requirements

#### Internal Audits:
- **Frequency**: Quarterly comprehensive audits
- **Scope**: All departments and processes
- **Certification**: Lead auditor qualification requirements
- **Corrective Actions**: Non-conformance tracking and resolution

#### External Audits:
- **Classification Society**: Annual vessel certification
- **Flag State Inspections**: Regulatory compliance verification
- **Customer Audits**: Principal and client requirements
- **Third-party Certifications**: ISO and other standard certifications

---

## 10.0 📞 SUPPORT & TRAINING

### 10.1 Support Channels

#### Tier 1 Support (Self-Service):
- **User Manual**: Comprehensive online documentation
- **FAQ Database**: Common questions and solutions
- **Video Tutorials**: Step-by-step process guides
- **Knowledge Base**: Searchable article database

#### Tier 2 Support (Department):
- **Department IT Coordinators**: Local technical support
- **Subject Matter Experts**: Process and domain specialists
- **Super User Network**: Trained power users for peer support

#### Tier 3 Support (Central IT):
- **IT Helpdesk**: hanmarine-it@hanmarine.com
- **Emergency Hotline**: +62-21-XXXX-XXXX (24/7)
- **System Administrators**: Critical system support
- **Vendor Support**: Third-party system vendor assistance

### 10.2 Training Programs

#### New User Training:
- **Duration**: 4 hours comprehensive training
- **Format**: Classroom and online modules
- **Certification**: Completion certificate required
- **Frequency**: Mandatory for all new users

#### Role-Specific Training:
- **Executive Management**: Strategic overview and reporting
- **Crewing Department**: Complete crew lifecycle processes
- **Accounting Department**: Financial processes and compliance
- **HR Department**: Personnel management and regulations
- **Quality Department**: Audit and compliance procedures

#### Advanced Training:
- **System Administration**: Technical maintenance and configuration
- **Process Improvement**: Workflow optimization and automation
- **Compliance Training**: Regulatory updates and requirements
- **Security Awareness**: Data protection and cybersecurity

### 10.3 Service Level Agreements

#### Response Times:
| Priority | Description | Response Time | Resolution Time |
|----------|-------------|---------------|-----------------|
| **Critical** | System down, data loss | 15 minutes | 2 hours |
| **High** | Major functionality impaired | 30 minutes | 4 hours |
| **Medium** | Minor issues, workarounds available | 2 hours | 24 hours |
| **Low** | General questions, enhancements | 24 hours | 5 business days |

#### Support Hours:
- **Primary Hours**: Monday-Friday 08:00-17:00 WIB
- **Extended Hours**: Monday-Friday 17:00-20:00 WIB
- **Emergency Support**: 24/7 for critical systems
- **Holiday Coverage**: Reduced staffing with escalation procedures

---

## 📋 APPENDICES

### Appendix A: Document Type Requirements

| Document Type | Required For | Minimum Validity | Responsible Department |
|---------------|--------------|------------------|----------------------|
| Passport | All crew | 6 months | Operations |
| Seaman Book | All crew | 6 months | Operations |
| STCW Certificates | Officers | 12 months | HR |
| Medical Certificate | All crew | 12 months | Medical |
| Visa | As required | Per destination | Operations |
| Police Clearance | As required | 6 months | Operations |

### Appendix B: Approval Workflows

#### Contract Approvals:
1. Operations draft → HR review → Accounting verification → Executive approval

#### Financial Approvals:
1. Department request → Budget verification → Accounting review → Executive approval

#### Disciplinary Actions:
1. Incident report → Investigation → HR review → Executive decision

### Appendix C: System Performance Metrics

- **Availability**: 99.5% uptime target
- **Response Time**: <2 seconds for standard operations
- **Data Accuracy**: 100% validation and audit trails
- **Security**: Zero data breaches, comprehensive logging

---

**⚠️ CONFIDENTIAL**: This document contains sensitive operational information. Distribution is restricted to authorized HANMARINE personnel only. Unauthorized disclosure may result in disciplinary action.

**Document Control**:
- **Version**: 5.0 - Enterprise Edition
- **Effective Date**: December 3, 2025
- **Review Date**: June 3, 2026
- **Approval**: Executive Management
- **Distribution**: All authorized users

*HANMARINE HIMS User Manual v5.0 - Enterprise Edition*
Dashboard → Overview sistem
├── Crewing
│   ├── Applications → Lamaran awak kapal
│   ├── Assignments → Penugasan kapal
│   ├── Contracts → Kontrak kerja
│   └── Crew List → Daftar awak aktif
├── Accounting
│   ├── Agency Fees → Biaya agen
│   ├── Billing → Penagihan
│   ├── Exchange → Kurs mata uang
│   └── Wages → Gaji & upah
├── HR
│   ├── Employees → Data karyawan
│   ├── Disciplinary → Catatan disiplin
│   └── Documents → Dokumen personal
├── Quality
│   ├── Inspections → Inspeksi kapal
│   ├── Audits → Audit internal
│   └── Reports → Laporan kualitas
└── Admin
    ├── Users → Manajemen pengguna
    ├── Permissions → Kontrol akses
    └── Settings → Konfigurasi sistem
```

---

## 📊 Modul Utama Sistem

### 1. Crewing Management

#### Applications (Lamaran Awak Kapal)
**Akses**: Crewing Department
**Fungsi**:
- Input lamaran baru dari calon awak
- Review dan approval aplikasi
- Tracking status aplikasi
- Generate laporan recruitment

#### Assignments (Penugasan Kapal)
**Akses**: Crewing Department
**Fungsi**:
- Assign awak ke kapal tertentu
- Manage rotasi dan pergantian awak
- Tracking masa kerja di kapal
- Emergency crew replacement

#### Contracts (Kontrak Kerja)
**Akses**: Crewing & Accounting
**Fungsi**:
- Generate kontrak kerja awak kapal
- Manage terms & conditions
- Salary calculation & approval
- Contract renewal & termination

### 2. Principal Management

#### Principal Agreements
**Akses**: Executive Management Only
**Fungsi**:
- Manage agreements dengan ship owners
- Track agreement expiry dates
- Financial terms & conditions
- Compliance monitoring

#### Vessel Information
**Akses**: Crewing Department
**Fungsi**:
- Vessel registry & specifications
- Crew capacity & requirements
- Maintenance schedules
- Safety compliance status

### 3. Financial Management

#### Agency Fees
**Akses**: Accounting Department
**Fungsi**:
- Calculate & track agency fees
- Payment processing & reconciliation
- Fee structure management
- Financial reporting

#### Office Expenses
**Akses**: Accounting Department
**Fungsi**:
- Expense tracking & approval
- Budget monitoring
- Cost center allocation
- Financial audit trail

### 4. HR & Disciplinary

#### Crew Records
**Akses**: HR & Crewing
**Fungsi**:
- Personal data management
- Document storage (passports, certificates)
- Training records
- Performance tracking

#### Disciplinary Actions
**Akses**: Quality & HR Management
**Fungsi**:
- Incident reporting
- Investigation process
- Disciplinary measures
- Appeal procedures

### 5. Quality Assurance

#### Inspections
**Akses**: Quality Department
**Fungsi**:
- Pre-voyage inspections
- Safety compliance checks
- Equipment verification
- Deficiency reporting

#### Document Control
**Akses**: All Departments
**Fungsi**:
- Document version control
- Approval workflows
- Audit trails
- Compliance documentation

---

## 🔒 Fitur Keamanan & Privasi

### Authentication & Authorization

1. **Multi-Factor Authentication (MFA)**
   - Wajib untuk semua Executive Management
   - Opsional untuk staff level

2. **Role-Based Access Control (RBAC)**
   - Strict permission matrix
   - Least privilege principle
   - Regular access reviews

3. **Session Management**
   - Auto-logout setelah 30 menit idle
   - Concurrent session limits
   - Session tracking & audit

### Data Protection

1. **Encryption**
   - Data in transit: TLS 1.3
   - Data at rest: AES-256 encryption
   - Database encryption

2. **Data Classification**
   - **Public**: General information
   - **Internal**: Company operational data
   - **Confidential**: Financial & personal data
   - **Restricted**: Principal agreements, executive decisions

3. **Backup & Recovery**
   - Daily automated backups
   - Offsite storage
   - Disaster recovery plan
   - Data retention policies

### Audit & Compliance

1. **Audit Logging**
   - All user actions logged
   - Change tracking
   - Compliance reporting

2. **Regulatory Compliance**
   - IMO (International Maritime Organization)
   - STCW (Standards of Training, Certification & Watchkeeping)
   - Flag State requirements
   - Local maritime regulations

---

## 🛠️ Panduan Troubleshooting

### Masalah Umum & Solusi

#### 1. Tidak Bisa Login
**Gejala**: Error "Invalid credentials"
**Solusi**:
- Periksa username & password
- Reset password melalui IT Admin
- Pastikan caps lock off
- Coba browser berbeda

#### 2. Tidak Ada Akses ke Modul
**Gejala**: Error "Insufficient permissions"
**Solusi**:
- Hubungi supervisor untuk konfirmasi role
- Request permission upgrade jika diperlukan
- Periksa permission matrix di atas

#### 3. Sistem Lambat/Tidak Responsif
**Gejala**: Loading lama atau timeout
**Solusi**:
- Refresh halaman (F5)
- Clear browser cache
- Coba koneksi internet berbeda
- Laporkan ke IT jika berlanjut

#### 4. Data Tidak Tersimpan
**Gejala**: Error saat save/update
**Solusi**:
- Periksa semua field required terisi
- Validasi format data (tanggal, angka)
- Pastikan koneksi internet stabil
- Coba save lagi setelah beberapa saat

### Emergency Contacts

| Department | Contact Person | Phone | Email |
|------------|----------------|-------|-------|
| IT Support | IT Admin | +62-21-XXXXXXX | it@hanmarine.com |
| Crewing Manager | [Name] | +62-21-XXXXXXX | crewing@hanmarine.com |
| Accounting Manager | [Name] | +62-21-XXXXXXX | accounting@hanmarine.com |
| HR Manager | [Name] | +62-21-XXXXXXX | hr@hanmarine.com |

---

## 📞 Dukungan Teknis

### Cara Mendapatkan Bantuan

1. **Self-Service**: Baca manual ini terlebih dahulu
2. **Department Support**: Hubungi supervisor department
3. **IT Helpdesk**: Email ke it@hanmarine.com
4. **Emergency**: Hubungi nomor emergency di atas

### Training & Onboarding

- **New User Training**: Wajib 4 jam untuk semua user baru
- **Role-Specific Training**: Training khusus sesuai department
- **Refresher Training**: Annual training untuk compliance
- **System Updates**: Training saat ada major updates

---

**⚠️ PENTING**: Sistem ini mengandung data sensitif. Selalu ikuti kebijakan keamanan dan jaga kerahasiaan informasi perusahaan.

**Dokumen ini bersifat rahasia dan hanya untuk internal HANMARINE. Dilarang didistribusikan ke pihak luar tanpa izin tertulis dari manajemen.**

---

*HANMARINE HIMS User Manual v1.0 - November 2025*