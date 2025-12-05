# HANMARINE HIMS - Crewing System ERD & Data Flow

## 🎯 Core Crewing Components (Dashboard Quick Actions)

### 4 Main Entry Points:
1. **👤 Add New Seafarer** → Entry point for new crew members
2. **🔄 Crew Replacements** → Planning & management of crew changes
3. **📋 Monthly Checklist** → Compliance & document verification
4. **👥 Crew List** → Overview & monitoring of active crew

---

## 🔗 ERD Data Flow Connections

### **Complete System Flow:**

```
👤 Add New Seafarer
    ↓
📝 Applications (CR-02)
    ↓
📄 Documents Upload
    ↓
🚢 Assignment Creation
    ↓
👥 Crew List (Real-time)
    ↓
🔄 Crew Replacements (Planning)
    ↓
📋 Monthly Checklist (Compliance)
```

### **Detailed Component Connections:**

#### 1. **Add New Seafarer** → Applications → Documents → Assignments
```
Seafarer Entry
├── Basic Info (Name, DOB, Nationality)
├── Applications (CR-02 Form)
├── Document Upload (Passport, COC, Medical, etc.)
└── Assignment Creation (Vessel, Rank, Contract)
```

#### 2. **Crew Replacements** ← Crew List → New Assignments
```
Crew List Monitoring
├── Identify Departing Crew
├── Plan Replacement Timeline
├── Create New Assignments
└── Update Documents
```

#### 3. **Monthly Checklist** ← Assignments → Compliance Reports
```
Assignment-Based Tracking
├── Contract Expiry Monitoring
├── Document Validity Checks
├── Medical Certificate Verification
├── Training Compliance
└── Generate Reports
```

#### 4. **Crew List** ← Assignments → Biodata Details
```
Real-time Crew Overview
├── Current Active Crew per Vessel
├── Assignment Status Tracking
├── Document Expiry Alerts
├── Biodata Access (Detailed Profiles)
└── Replacement Planning Triggers
```

---

## 📊 Database Relationships (Prisma Schema)

### **Core Tables & Relations:**

```prisma
// Seafarer (Master Data)
model Seafarer {
  id          Int      @id @default(autoincrement())
  fullName    String
  dateOfBirth DateTime?
  nationality String

  // Relations
  applications Application[]
  assignments  Assignment[]
  documents    SeafarerDocument[]
}

// Applications (CR-02)
model Application {
  id          Int       @id @default(autoincrement())
  seafarerId  Int
  appliedRank String
  status      String    @default("PENDING")

  seafarer    Seafarer  @relation(fields: [seafarerId], references: [id])
  interview   Interview?
}

// Documents
model SeafarerDocument {
  id         Int      @id @default(autoincrement())
  seafarerId Int
  docType    String   // Passport, COC, Medical, etc.
  expiryDate DateTime

  seafarer   Seafarer @relation(fields: [seafarerId], references: [id])
}

// Assignments (Active Contracts)
model Assignment {
  id          Int      @id @default(autoincrement())
  seafarerId  Int
  vesselId    Int
  rank        String
  signOnDate  DateTime
  signOffPlan DateTime
  status      String   @default("PLANNED") // PLANNED/ONBOARD/COMPLETED

  seafarer    Seafarer @relation(fields: [seafarerId], references: [id])
  vessel      Vessel   @relation(fields: [vesselId], references: [id])
  principal   Principal @relation(fields: [principalId], references: [id])
}
```

---

## 🔄 Data Flow Logic

### **Automatic Updates:**
1. **New Seafarer** → Creates Application → Uploads Documents → Gets Assignment → Appears in Crew List
2. **Assignment Changes** → Updates Crew List → Triggers Replacement Planning → Updates Checklists
3. **Document Expiry** → Alerts in Crew List → Requires Action in Replacements → Updates Checklists
4. **Contract Ending** → Triggers Replacement Process → New Assignment Created → Crew List Updated

### **Real-time Synchronization:**
- Crew List always reflects current Assignment status
- Document expiry alerts update automatically
- Replacement planning based on Crew List data
- Monthly checklists generated from Assignment data

---

## 🎨 UI/UX Flow

### **Dashboard → Core Actions:**
```
Dashboard (Overview)
├── 👤 Add New Seafarer → /crewing/seafarers/new
├── 🔄 Crew Replacements → /crewing/replacements
├── 📋 Monthly Checklist → /crewing/checklist
└── 👥 Crew List → /crewing/crew-list
```

### **Navigation Connections:**
- All actions accessible from main Crewing menu
- Crew List shows detailed biodata on click
- Replacements link to specific crew members
- Checklists generated from assignment data
- All components share common data models

---

## 📋 Implementation Status

✅ **Completed Components:**
- Add New Seafarer (with biodata detail view)
- Crew Replacements (planning interface)
- Monthly Checklist (compliance tracking)
- Crew List (real-time overview with vessel breakdown)
- Dashboard integration (4 core actions)
- API endpoints for all data flows
- Database relationships established

🔄 **Data Flow:**
- Applications → Documents → Assignments → Crew List
- Real-time updates between all components
- Automatic alerts for expiring documents/contracts
- Integrated replacement planning workflow

---

## 🚀 Usage Guide

1. **Start with Dashboard** - See 4 core actions
2. **Add New Seafarer** - Entry point for crew data
3. **Monitor Crew List** - Real-time vessel crew status
4. **Plan Replacements** - When crew changes needed
5. **Run Checklists** - Monthly compliance verification

All components are interconnected through the ERD structure, ensuring data consistency and automatic updates across the entire crewing system.