# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS)
## Struktur Aplikasi & Permission Matrix

### 📋 **OVERVIEW**
HANMARINE HIMS adalah sistem manajemen terintegrasi untuk operasi maritim yang mengikuti standar internasional dan regulasi maritim.

---

## 🏗️ **STRUKTUR APLIKASI BERDASARKAN KATEGORI**

### 1. **EXECUTIVE MANAGEMENT** 👑
**Akses:** CEO, COO, CFO, CTO
**Tujuan:** Oversight strategis dan pengambilan keputusan

| Modul | Deskripsi | Yang Bisa Edit | Yang Bisa Lihat |
|-------|-----------|----------------|-----------------|
| **Dashboard** | KPI & Business Intelligence | CEO, COO, CFO, CTO | Department Heads |

---

### 2. **PRINCIPAL & BUSINESS RELATIONS** 🤝
**Akses:** CEO, COO, Principal Manager, Business Development
**Tujuan:** Manajemen hubungan dengan ship owners

| Modul | Deskripsi | Yang Bisa Edit | Yang Bisa Lihat |
|-------|-----------|----------------|-----------------|
| **Principals** | Data ship owners & agreements | CEO, COO, Principal Manager | Fleet Manager, Crewing Manager |
| **Agency Fees** | Komisi & biaya layanan | CEO, CFO, Accounting Head | COO, Principal Manager |

**🔒 BUSINESS RULE:** Agreement antara kantor HANMARINE dan owner kapal
- **Bisa Buat/Edit:** CEO, COO, Principal Manager
- **Bisa Lihat:** Business Development, Accounting Head
- **Tidak Bisa Akses:** Operational staff (Crewing Officer, dll)

---

### 3. **CREW MANAGEMENT** 👥
**Akses:** CEO, COO, Crewing Manager, HR Manager
**Tujuan:** Manajemen awak kapal dan data personal

| Modul | Deskripsi | Yang Bisa Edit | Yang Bisa Lihat |
|-------|-----------|----------------|-----------------|
| **Crew Database** | Data personal awak | Crewing Manager, HR Manager | Fleet Manager, Quality Manager |
| **Employment Contracts** | Kontrak kerja | Crewing Officer, HR Officer | Principal (view only) |
| **Disciplinary** | Tindakan disiplin | HR Manager, Quality Manager | Compliance Head (approve) |

**🔒 BUSINESS RULE:** Data personal awak kapal
- **Bisa Edit:** Crewing & HR Department
- **Crew Member:** Hanya bisa lihat data sendiri
- **External:** Principal hanya view kontrak

---

### 4. **FINANCIAL MANAGEMENT** 💰
**Akses:** CEO, CFO, Accounting Head
**Tujuan:** Manajemen keuangan dan kompensasi

| Modul | Deskripsi | Yang Bisa Edit | Yang Bisa Lihat |
|-------|-----------|----------------|-----------------|
| **Accounting** | Payroll & financial reports | Accounting Head, CFO | COO, Crewing Manager |
| **Wage Scales** | Standar gaji berdasarkan rank | HR Manager, Accounting Head | Semua department |

**🔒 BUSINESS RULE:** Data keuangan sensitif
- **Full Access:** CEO, CFO, Accounting Head
- **Edit:** Accounting Officer (limited)
- **View:** Department heads untuk planning

---

### 5. **OPERATIONAL MODULES** ⚓
**Akses:** CEO, COO, Fleet Manager, Operations Head
**Tujuan:** Operasi kapal dan deployment awak

| Modul | Deskripsi | Yang Bisa Edit | Yang Bisa Lihat |
|-------|-----------|----------------|-----------------|
| **Crewing Operations** | Assignment & deployment | Crewing Manager, Fleet Manager | Operations Head |
| **Insurance** | P&I Club & crew insurance | Accounting Head, Compliance Head | Principal (view only) |

---

### 6. **COMPLIANCE & QUALITY** ✅
**Akses:** CEO, COO, Quality Manager, Compliance Head
**Tujuan:** Kepatuhan regulasi dan quality assurance

| Modul | Deskripsi | Yang Bisa Edit | Yang Bisa Lihat |
|-------|-----------|----------------|-----------------|
| **Quality Management** | Audits & compliance | Quality Manager, Compliance Head | Semua department heads |
| **Document Control** | Sertifikasi & records | Document Officer | Crew members (own docs) |
| **National Holidays** | Kalender libur untuk payroll | HR Manager, Admin | Accounting, Crewing |

---

### 7. **SYSTEM ADMINISTRATION** 🔧
**Akses:** CEO, CTO, Admin, IT Support
**Tujuan:** Manajemen sistem dan user accounts

| Modul | Deskripsi | Yang Bisa Edit | Yang Bisa Lihat |
|-------|-----------|----------------|-----------------|
| **User Management** | User accounts & roles | CEO, CTO, Admin | IT Support (limited) |
| **System Config** | System settings | CTO, Admin | CEO |

---

## 👥 **ROLE-BASED ACCESS CONTROL (RBAC)**

### **EXECUTIVE LEVEL** 👑
```typescript
CEO, COO, CFO, CTO
// Access: All modules with admin rights
// Purpose: Strategic oversight and final approval
```

### **DEPARTMENT HEADS** 🏢
```typescript
FLEET_MANAGER, CREWING_MANAGER, HR_MANAGER,
QUALITY_MANAGER, ACCOUNTING_HEAD, OPERATIONS_HEAD,
COMPLIANCE_HEAD
// Access: Department modules + executive dashboard
// Purpose: Department management and reporting
```

### **OPERATIONAL STAFF** 👷
```typescript
CREWING_OFFICER, ACCOUNTING_OFFICER, HR_OFFICER,
QUALITY_OFFICER, DOCUMENT_OFFICER
// Access: Specific department functions
// Purpose: Daily operations and data entry
```

### **BUSINESS RELATIONS** 🤝
```typescript
PRINCIPAL_MANAGER, BUSINESS_DEVELOPMENT
// Access: Principal data, agency fees, contracts
// Purpose: Client relationship management
```

### **EXTERNAL USERS** 🌐
```typescript
PRINCIPAL_VIEWER
// Access: Limited view of their contracts and fees
// Purpose: Client transparency

CREW_MEMBER
// Access: Personal data, own contracts, wage scales
// Purpose: Self-service information
```

---

## 🔒 **BUSINESS RULES KRITIS**

### **1. PRINCIPAL AGREEMENTS** 🤝
**Siapa yang bisa akses agreement antara kantor dan owner:**
- ✅ **Bisa Buat/Edit:** CEO, COO, Principal Manager
- ✅ **Bisa Lihat:** Business Development, Accounting Head
- ❌ **Tidak Bisa:** Operational staff (crewing officer, dll)

**Alasan:** Agreement adalah kontrak bisnis sensitif yang hanya boleh diakses oleh management level.

### **2. FINANCIAL DATA** 💰
**Siapa yang bisa edit wage scales & agency fees:**
- ✅ **Full Control:** CEO, CFO, Accounting Head
- ✅ **Edit:** Accounting Officer (limited)
- ✅ **View:** Department heads untuk planning
- ❌ **No Access:** External users

**Alasan:** Data keuangan mempengaruhi cost structure perusahaan.

### **3. CREW PERSONAL DATA** 👥
**Siapa yang bisa edit data awak:**
- ✅ **Edit:** Crewing Manager, HR Manager, Officers
- ✅ **View:** Department heads, Quality Manager
- ✅ **Limited:** Crew member (own data only)
- ❌ **No Access:** External principals

**Alasan:** Privacy protection sesuai GDPR dan employment law.

### **4. DISCIPLINARY ACTIONS** ⚖️
**Siapa yang bisa approve disciplinary:**
- ✅ **Create:** HR Officer, Crewing Officer
- ✅ **Approve:** Quality Manager, Compliance Head
- ✅ **View:** Executive management
- ❌ **No Access:** Crew members, external users

**Alasan:** Disciplinary actions perlu approval untuk fairness dan legal compliance.

---

## 📋 **IMPLEMENTATION STATUS**

### ✅ **COMPLETED MODULES**
- [x] Executive Dashboard
- [x] Principal Management
- [x] Crew Database
- [x] Employment Contracts (with edit capability)
- [x] Wage Scales (with edit capability)
- [x] Disciplinary Management
- [x] Insurance Management
- [x] Agency Fees Management
- [x] National Holidays
- [x] Document Management
- [x] Quality Management

### 🔄 **PERMISSION SYSTEM**
- [x] Role-based access control
- [x] Module-level permissions
- [x] Business rules implementation
- [x] Permission checking utilities

---

## 🚀 **DEPLOYMENT GUIDELINES**

### **Production Access Matrix**
```
Executive Level: Full system access
Department Heads: Department + executive dashboard
Operational Staff: Department functions only
Business Relations: Client-related modules
External Users: Limited view access
```

### **Security Considerations**
- Multi-factor authentication untuk executive access
- Audit logging untuk semua changes
- Data encryption untuk sensitive information
- Regular access reviews

---

## 📞 **SUPPORT & MAINTENANCE**

**System Administrator:** CEO, CTO, Admin
**Module Owners:**
- Crewing: Crewing Manager
- Finance: CFO, Accounting Head
- Quality: Quality Manager
- IT: CTO, IT Support

---

**HANMARINE HIMS - Enterprise Maritime Management Solution**
*Version 1.0 - November 2025*