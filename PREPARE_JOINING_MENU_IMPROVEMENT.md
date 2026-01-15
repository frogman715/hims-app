# ✈️ PREPARE JOINING MENU IMPROVEMENT PLAN

**Date:** Jan 14, 2026  
**Status:** 🔧 READY TO IMPLEMENT  
**Priority:** 🔴 HIGH (Critical for crew departure flow)

---

## 📊 CURRENT STATE ANALYSIS

### **What's Currently Working ✅**

```
✅ Document Checklist (Passport, Seaman Book, Certificates, Visa)
✅ Medical Status Tracking (with expiry dates)
✅ Orientation Completion
✅ Travel Arrangements (Flight, Hotel, Transport)
✅ Progress Bar (visual completion status)
✅ Status Filters (8 workflow stages)
✅ Generate Letter Guarantee (PDF export)
```

### **What Needs Improvement 🔧**

```
❌ No MCU (Medical Check-up) tracking post-approval
❌ No Crew Equipment/Perlengkapan tracking
❌ No Equipment checklist before joining
❌ No Pre-Departure inspection items
❌ No Post-Approval action items
❌ Unclear flow after documents approved
❌ No emergency contact verification
❌ No crew briefing/safety training items
```

---

## 🎯 PROPOSED IMPROVEMENTS

### **SECTION 1: KEEP EXISTING (Minor Reorganization)**

**Documents Section** ✅
```
✅ Passport Valid
✅ Seaman Book Valid
✅ Certificates Valid
✅ Visa Valid

Action: Keep as-is, clear section
```

**Medical Section** ✅ (EXPAND)
```
Current:
✅ Medical Valid
✅ Expiry Date
✅ Orientation Complete

ADD:
+ Medical Check-up (MCU) Status (NEW)
+ MCU Date
+ MCU Doctor Name
+ MCU Results Received
+ Any Medical Restrictions?
+ Vaccination Records Updated?
```

**Travel Section** ✅ (Keep)
```
✅ Ticket Booked
✅ Flight Number
✅ Hotel Booked
✅ Hotel Name
✅ Transport Arranged
```

---

### **SECTION 2: NEW - POST-APPROVAL CHECKLIST**

**After Documents Approved → Add MCU Tracking:**

```
🆕 MCU (Medical Check-up) Section
─────────────────────────────────
□ MCU Appointment Scheduled
  └─ Date: [picker]
  └─ Doctor/Clinic: [text]
  └─ Location: [text]

□ MCU Completed
  └─ Date Completed: [date]
  └─ Results Received: [date]
  └─ Doctor Name: [text]

□ Medical Restrictions?
  └─ Yes/No radio
  └─ Restrictions: [textarea if yes]

□ Vaccination Records
  □ Yellow Fever Certificate
  □ Hepatitis A Certificate
  □ Hepatitis B Certificate
  □ Typhoid Certificate
  □ Others: [text]

□ Health Declaration Form Signed
  └─ Signed Date: [date]
```

---

### **SECTION 3: NEW - CREW EQUIPMENT & PERLENGKAPAN**

**Equipment tracking before crew joins:**

```
🆕 Crew Equipment & Perlengkapan Section
────────────────────────────────────────

Basic Safety Equipment:
□ Life Jacket / Life Vest provided
□ Safety Helmet provided
□ Safety Shoes provided
□ Eye Protection provided
□ Hearing Protection provided
□ Gloves (work/chemical) provided

Work Equipment (Role-specific):
□ Work Uniform provided
□ Coveralls provided
□ Technical Tools (if applicable)
□ ID Card Issued
□ Access Card Issued

Personal Items:
□ Passport in hand
□ Tickets in hand
□ Visa stamps verified
□ Medical certificate with crew
□ Insurance documents provided
□ Emergency contact forms signed

Vessel Pre-Requisites:
□ Vessel stateroom assigned
□ Vessel contract copy provided
□ Vessel procedures manual provided
□ Vessel emergency procedure briefing scheduled
□ Bridge crew briefing scheduled (if applicable)
```

---

### **SECTION 4: NEW - PRE-DEPARTURE FINAL CHECK**

**24-48 hours before departure:**

```
🆕 Final Pre-Departure Verification
────────────────────────────────────

Documents:
✅ All documents collected & verified
✅ Copies filed in system
✅ Originals with crew

Health:
✅ MCU results approved
✅ Medical clearance given
✅ Vaccinations verified
✅ Any restrictions documented
✅ Medical kit provided (if needed)

Equipment:
✅ All equipment issued & packed
✅ Equipment packing list signed
✅ Emergency contacts updated

Travel:
✅ Flights confirmed
✅ Hotel checked in
✅ Transport to port arranged
✅ Port arrival time confirmed

Communication:
✅ Crew has all contact numbers
✅ Emergency contact confirmed
✅ Company contact confirmed
✅ Vessel master contact confirmed

Financial:
✅ Advance salary processed (if applicable)
✅ Per diem arranged
✅ Credit card/emergency funds

Ready to Join:
✅ Crew briefing completed
✅ All checklists signed
✅ Final approval given
✅ Status: READY TO BOARD ✅

Departure Time: [datetime picker]
```

---

## 📋 DATABASE SCHEMA CHANGES NEEDED

### **Add to PrepareJoining Model:**

```prisma
model PrepareJoining {
  // ... existing fields ...
  
  // ===== NEW MCU TRACKING =====
  mcuScheduled          Boolean   @default(false)
  mcuScheduledDate      DateTime?
  mcuClinic             String?
  mcuLocation           String?
  mcuCompleted          Boolean   @default(false)
  mcuCompletedDate      DateTime?
  mcuResultsReceived    Boolean   @default(false)
  mcuResultsReceivedDate DateTime?
  mcuDoctorName         String?
  mcuRestrictions       String? // JSON or text
  medicalRestrictions   Boolean   @default(false)
  medicalRestrictionsDetails String?
  
  // ===== VACCINATIONS =====
  yellowFeverCert       Boolean   @default(false)
  hepatitisACert        Boolean   @default(false)
  hepatitisBCert        Boolean   @default(false)
  typhoidCert           Boolean   @default(false)
  otherVaccinations     String?
  healthDeclarationSigned Boolean @default(false)
  healthDeclarationDate DateTime?
  
  // ===== CREW EQUIPMENT =====
  lifeJacketProvided    Boolean   @default(false)
  safetyHelmetProvided  Boolean   @default(false)
  safetyShoesProvided   Boolean   @default(false)
  eyeProtectionProvided Boolean   @default(false)
  hearingProtectionProvided Boolean @default(false)
  workGlovesProvided    Boolean   @default(false)
  workUniformProvided   Boolean   @default(false)
  coverallsProvided     Boolean   @default(false)
  technicalToolsProvided Boolean  @default(false)
  idCardIssued          Boolean   @default(false)
  accessCardIssued      Boolean   @default(false)
  
  // ===== PERSONAL ITEMS =====
  passportInHand        Boolean   @default(false)
  ticketsInHand         Boolean   @default(false)
  visaStampsVerified    Boolean   @default(false)
  medicalCertWithCrew   Boolean   @default(false)
  insuranceDocProvided  Boolean   @default(false)
  emergencyFormsSignedDate DateTime?
  
  // ===== VESSEL PRE-REQ =====
  stateroomAssigned     Boolean   @default(false)
  stateroomNumber       String?
  contractCopyProvided  Boolean   @default(false)
  proceduresManualProvided Boolean @default(false)
  emergencyBriefingScheduled Boolean @default(false)
  emergencyBriefingDate  DateTime?
  bridgeBriefingScheduled Boolean @default(false)
  bridgeBriefingDate    DateTime?
  
  // ===== FINAL PRE-DEPARTURE =====
  allDocumentsCollected Boolean   @default(false)
  allEquipmentIssued    Boolean   @default(false)
  equipmentPackingListSigned Boolean @default(false)
  flightConfirmed       Boolean   @default(false)
  hotelConfirmed        Boolean   @default(false)
  portTransportArranged Boolean   @default(false)
  portArrivalTime       DateTime?
  crewBriefingCompleted Boolean   @default(false)
  allChecklistsSigned   Boolean   @default(false)
  finalApprovalGiven    Boolean   @default(false)
  scheduledDepartureDate DateTime?
  
  // ===== COMMUNICATION =====
  allContactNumbersProvided Boolean @default(false)
  emergencyContactConfirmed Boolean @default(false)
  companyContactConfirmed Boolean @default(false)
  vesselMasterContactConfirmed Boolean @default(false)
  
  // ===== FINANCIAL =====
  advanceSalaryProcessed Boolean @default(false)
  perDiemArranged       Boolean @default(false)
  creditCardProvided    Boolean @default(false)
  emergencyFundsArranged Boolean @default(false)
}
```

---

## 🔄 WORKFLOW FLOW CHART

```
┌─────────────────────────────────────────┐
│ STEP 1: APPLICATION APPROVED            │
│ (Crew passes initial screening)         │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ STEP 2: PREPARE JOINING CREATED         │
│ Status: PENDING                         │
│ Actions: Assign to CDMO                 │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ STEP 3: DOCUMENTS SECTION               │
│ ✅ Passport Valid                       │
│ ✅ Seaman Book Valid                    │
│ ✅ Certificates Valid                   │
│ ✅ Visa Valid                           │
│ Status: DOCUMENTS                       │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ STEP 4: MCU SECTION (NEW)               │
│ ✅ MCU Appointment Scheduled             │
│ ✅ MCU Completed                        │
│ ✅ Results Received                     │
│ ✅ Vaccinations Verified                │
│ ✅ Medical Restrictions Noted           │
│ Status: MEDICAL                         │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ STEP 5: CREW EQUIPMENT (NEW)            │
│ ✅ Safety Equipment Provided            │
│ ✅ Work Equipment Provided              │
│ ✅ Personal Items Verified              │
│ ✅ Vessel Pre-reqs Scheduled            │
│ Status: TRAINING                        │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ STEP 6: TRAVEL ARRANGEMENTS             │
│ ✅ Ticket Booked                        │
│ ✅ Hotel Booked                         │
│ ✅ Transport Arranged                   │
│ Status: TRAVEL                          │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ STEP 7: FINAL PRE-DEPARTURE CHECK (NEW) │
│ ✅ 48 hours before departure            │
│ ✅ All checklists verified              │
│ ✅ Final approval given                 │
│ Status: READY                           │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ STEP 8: DISPATCHED                      │
│ ✅ Crew departed to vessel              │
│ ✅ Sign-in date recorded                │
│ Status: DISPATCHED → SIGNED IN          │
└─────────────────────────────────────────┘
```

---

## 🎨 UI/UX IMPROVEMENTS

### **Current Issues:**
```
❌ Too many checkboxes without context
❌ Unclear which items are REQUIRED vs optional
❌ No indication of what comes after medical approval
❌ No equipment visibility
❌ No pre-departure emergency checks
```

### **Proposed Improvements:**

**1. Add Status Indicators:**
```
🔴 Required (blocking progression)
🟡 Important (should complete)
🟢 Optional (nice-to-have)
```

**2. Add Section Completion:**
```
Documents: ███████░░░ 70% complete
Medical:   █████░░░░░ 50% complete  (MCU pending)
Equipment: ██░░░░░░░░ 20% complete
Travel:    ████████░░ 80% complete
```

**3. Add Timeline View:**
```
Today:           Complete Documents ← You are here
Next 3 days:     Schedule & Complete MCU
Next 5 days:     Receive Equipment
Day 10:          Final Travel Arrangements
Day 13:          Final Pre-Departure Check
Day 14:          DEPART ✅
```

**4. Add Alerts:**
```
⚠️  Medical expires in 30 days - Plan MCU soon
⏰ Departure in 5 days - Confirm all equipment
✅ All checklists complete - Ready to depart
```

---

## 📱 UI CARD LAYOUT (NEW)

```
┌─────────────────────────────────────────┐
│ ✈️ PREPARE JOINING - [Crew Name]       │
├─────────────────────────────────────────┤
│                                         │
│ TIMELINE: [■■■■■□□□] 62% Complete    │
│                                         │
├─────────────────────────────────────────┤
│ 📄 DOCUMENTS (100% ✅)                 │
│ ✅ Passport Valid                      │
│ ✅ Seaman Book Valid                   │
│ ✅ Certificates Valid                  │
│ ✅ Visa Valid                          │
├─────────────────────────────────────────┤
│ 🏥 MCU & MEDICAL (30% ⏳)              │
│ ⏳ MCU Not Yet Scheduled               │
│   [Schedule MCU Button]                │
│ □ MCU Completed                        │
│ □ Results Received                     │
│ □ Vaccinations Verified               │
│                                         │
│ Next Action: Schedule MCU within 3 days│
├─────────────────────────────────────────┤
│ 👕 CREW EQUIPMENT (0% ⏳)              │
│ □ Safety Equipment Issued             │
│ □ Work Equipment Issued               │
│ □ Personal Items Verified             │
│ □ Vessel Pre-reqs Scheduled           │
│                                         │
│ Next Action: Arrange equipment pickup │
├─────────────────────────────────────────┤
│ ✈️ TRAVEL (80% ✅)                     │
│ ✅ Ticket Booked - UA123 (Jan 20)     │
│ ✅ Hotel Booked - Marina Hotel        │
│ □ Transport to Port Arranged          │
│                                         │
│ Next Action: Confirm port transport  │
├─────────────────────────────────────────┤
│ ✅ FINAL PRE-DEPARTURE (0% ⏳)         │
│ [Only available 48 hours before]      │
│ □ All Documents Collected             │
│ □ All Equipment Issued                │
│ □ Emergency Contacts Confirmed        │
│ □ Final Approval Given                │
│                                         │
│ [GENERATE LETTER GUARANTEE]            │
└─────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **PHASE 1: Database Migration (1 day)**
```
[ ] Add new fields to PrepareJoining model
[ ] Run prisma migrate
[ ] Create migration file
[ ] Test migration locally
```

### **PHASE 2: Backend API (1-2 days)**
```
[ ] Create API endpoint for MCU data
[ ] Create API endpoint for equipment tracking
[ ] Create API endpoint for final pre-departure check
[ ] Add validation rules
[ ] Add authorization checks
[ ] Test all endpoints
```

### **PHASE 3: Frontend Update (2-3 days)**
```
[ ] Add MCU section to UI
[ ] Add Equipment section to UI
[ ] Add Final Pre-Departure section to UI
[ ] Add timeline progress view
[ ] Add status indicators
[ ] Add alert messages
[ ] Update styles to match theme
[ ] Test all interactions
```

### **PHASE 4: Testing & Documentation (1 day)**
```
[ ] Unit tests for new fields
[ ] Integration tests for workflow
[ ] User acceptance testing
[ ] Documentation updates
[ ] Team training
```

---

## 🔑 KEY REQUIREMENTS

### **Must-Haves:**
```
✅ MCU tracking (appointment, completion, results)
✅ Equipment checklist (safety, work, personal)
✅ Pre-departure final check (48 hours before)
✅ Clear workflow stages
✅ Progress visualization
✅ Required vs optional indicators
```

### **Nice-to-Haves:**
```
⭐ Timeline view
⭐ Alert notifications
⭐ Email reminders for pending items
⭐ Document upload for MCU results
⭐ Equipment PDF checkout list
⭐ Integration with SMS notifications
```

---

## 🚀 QUICK START

**To implement, follow these steps:**

1. **Update Prisma Schema** (prisma/schema.prisma)
   - Add MCU fields
   - Add Equipment fields
   - Add Pre-departure fields
   - Run: `npx prisma migrate dev --name add_prepare_joining_fields`

2. **Update API Route** (src/app/api/prepare-joining/[id]/route.ts)
   - Add handlers for new fields
   - Add validation logic

3. **Update UI** (src/app/crewing/prepare-joining/page.tsx)
   - Add MCU section
   - Add Equipment section
   - Add Pre-departure section
   - Update progress calculation

4. **Test & Deploy**
   - Test locally: `npm run dev`
   - Build: `npm run build`
   - Deploy to staging
   - Deploy to production

---

## 📞 QUESTIONS?

**What should we prioritize?**
1. MCU tracking (blocking medical check)
2. Equipment checklist (crew needs before joining)
3. Final pre-departure (safety verification)

**All 3 are critical for crew departure! ✅**

---

**Status:** 🔧 Ready to implement  
**Timeline:** 4-5 days total  
**Complexity:** Medium (database + UI updates)  
**Impact:** High (critical crew workflow improvement)

**Let's improve the crew joining process! 🚀⚓🌊**
