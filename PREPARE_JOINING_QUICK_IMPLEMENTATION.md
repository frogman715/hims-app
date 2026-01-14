# 🔧 PREPARE JOINING - QUICK IMPLEMENTATION GUIDE

**Status:** Ready to code  
**Time:** 4-5 days  
**Complexity:** Medium

---

## **STEP 1: UPDATE PRISMA SCHEMA (30 min)**

Edit: `prisma/schema.prisma`

Add these fields to the `PrepareJoining` model (around line 940):

```prisma
model PrepareJoining {
  id           String               @id @default(cuid())
  crewId       String
  vesselId     String?
  principalId  String?
  assignmentId String?
  status       PrepareJoiningStatus @default(PENDING)

  // Existing document fields
  passportValid     Boolean @default(false)
  seamanBookValid   Boolean @default(false)
  certificatesValid Boolean @default(false)
  medicalValid      Boolean @default(false)
  visaValid         Boolean @default(false)

  // Existing medical fields
  medicalCheckDate DateTime?
  medicalExpiry    DateTime?
  medicalRemarks   String?

  // Existing training fields
  orientationDate      DateTime?
  orientationCompleted Boolean   @default(false)
  trainingRemarks      String?

  // Existing travel fields
  departureDate     DateTime?
  departurePort     String?
  arrivalPort       String?
  flightNumber      String?
  ticketBooked      Boolean   @default(false)
  ticketBookedDate  DateTime?
  hotelBooked       Boolean   @default(false)
  hotelName         String?
  transportArranged Boolean   @default(false)
  transportDetails  String?

  remarks     String?
  attachments String?

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
  mcuRestrictions       String?
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

  crew      Crew                 @relation(fields: [crewId], references: [id])
  vessel    Vessel?              @relation(fields: [vesselId], references: [id])
  principal Principal?           @relation(fields: [principalId], references: [id])
  forms     PrepareJoiningForm[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run migration:
```bash
cd /home/frogman715/projects/hims-app
npx prisma migrate dev --name add_mcu_equipment_preparedeparture
npx prisma generate
```

---

## **STEP 2: UPDATE UI COMPONENT (2-3 days)**

Replace content in: `src/app/crewing/prepare-joining/page.tsx`

Key changes:
1. Add MCU section (after Medical)
2. Add Equipment section (after Travel)
3. Add Final Pre-Departure section (after Equipment)
4. Update `getProgressPercentage()` to include new fields
5. Update checklist items

**New section example:**

```typescript
// MCU & MEDICAL SECTION
<div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4">
  <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
    <span className="badge-soft bg-emerald-500/10 text-emerald-600">🏥</span>
    <span>MCU & Medical Clearance</span>
  </div>
  <div className="space-y-3">
    {/* MCU Appointment */}
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={pj.mcuScheduled}
        onChange={(e) =>
          updateChecklistItem(pj.id, "mcuScheduled", e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-emerald-500"
      />
      <span>MCU Appointment Scheduled</span>
    </label>
    
    {pj.mcuScheduled && (
      <input
        type="date"
        value={pj.mcuScheduledDate?.toISOString().split('T')[0] || ''}
        onChange={(e) =>
          updateChecklistItem(pj.id, "mcuScheduledDate", new Date(e.target.value))
        }
        className="ml-7 text-xs border rounded px-2 py-1"
      />
    )}

    {/* MCU Completed */}
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={pj.mcuCompleted}
        onChange={(e) =>
          updateChecklistItem(pj.id, "mcuCompleted", e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-emerald-500"
      />
      <span>MCU Completed</span>
    </label>

    {/* Results Received */}
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={pj.mcuResultsReceived}
        onChange={(e) =>
          updateChecklistItem(pj.id, "mcuResultsReceived", e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-emerald-500"
      />
      <span>MCU Results Received</span>
    </label>

    {/* Vaccinations */}
    <div className="ml-7 space-y-2 border-l-2 border-emerald-200 pl-3">
      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={pj.yellowFeverCert}
          onChange={(e) =>
            updateChecklistItem(pj.id, "yellowFeverCert", e.target.checked)
          }
          className="h-4 w-4 rounded border-slate-300 text-emerald-500"
        />
        <span>Yellow Fever Certificate</span>
      </label>
      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={pj.hepatitisACert}
          onChange={(e) =>
            updateChecklistItem(pj.id, "hepatitisACert", e.target.checked)
          }
          className="h-4 w-4 rounded border-slate-300 text-emerald-500"
        />
        <span>Hepatitis A Certificate</span>
      </label>
      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={pj.hepatitisBCert}
          onChange={(e) =>
            updateChecklistItem(pj.id, "hepatitisBCert", e.target.checked)
          }
          className="h-4 w-4 rounded border-slate-300 text-emerald-500"
        />
        <span>Hepatitis B Certificate</span>
      </label>
    </div>

    {/* Medical Restrictions */}
    {pj.medicalRestrictions && (
      <div className="ml-7 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
        <p className="font-semibold mb-1">⚠️ Medical Restrictions:</p>
        <p>{pj.medicalRestrictionsDetails}</p>
      </div>
    )}
  </div>
</div>
```

**Equipment Section:**

```typescript
// CREW EQUIPMENT SECTION
<div className="rounded-xl border border-purple-200/70 bg-purple-50/60 p-4">
  <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
    <span className="badge-soft bg-purple-500/10 text-purple-600">👕</span>
    <span>Crew Equipment & Perlengkapan</span>
  </div>
  <div className="space-y-4">
    
    {/* Safety Equipment */}
    <div>
      <p className="text-xs font-semibold text-purple-700 mb-2">🛡️ Safety Equipment</p>
      <div className="space-y-2 ml-3">
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.lifeJacketProvided}
            onChange={(e) =>
              updateChecklistItem(pj.id, "lifeJacketProvided", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>Life Jacket Provided</span>
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.safetyHelmetProvided}
            onChange={(e) =>
              updateChecklistItem(pj.id, "safetyHelmetProvided", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>Safety Helmet Provided</span>
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.safetyShoesProvided}
            onChange={(e) =>
              updateChecklistItem(pj.id, "safetyShoesProvided", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>Safety Shoes Provided</span>
        </label>
      </div>
    </div>

    {/* Work Equipment */}
    <div>
      <p className="text-xs font-semibold text-purple-700 mb-2">🔧 Work Equipment</p>
      <div className="space-y-2 ml-3">
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.workUniformProvided}
            onChange={(e) =>
              updateChecklistItem(pj.id, "workUniformProvided", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>Work Uniform Provided</span>
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.idCardIssued}
            onChange={(e) =>
              updateChecklistItem(pj.id, "idCardIssued", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>ID Card Issued</span>
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.accessCardIssued}
            onChange={(e) =>
              updateChecklistItem(pj.id, "accessCardIssued", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>Access Card Issued</span>
        </label>
      </div>
    </div>

    {/* Vessel Pre-requisites */}
    <div>
      <p className="text-xs font-semibold text-purple-700 mb-2">🚢 Vessel Pre-requisites</p>
      <div className="space-y-2 ml-3">
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.stateroomAssigned}
            onChange={(e) =>
              updateChecklistItem(pj.id, "stateroomAssigned", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>Stateroom Assigned</span>
        </label>
        {pj.stateroomAssigned && (
          <input
            type="text"
            placeholder="Stateroom #"
            value={pj.stateroomNumber || ''}
            onChange={(e) =>
              updateChecklistItem(pj.id, "stateroomNumber", e.target.value)
            }
            className="ml-7 text-xs border rounded px-2 py-1 w-full"
          />
        )}
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pj.emergencyBriefingScheduled}
            onChange={(e) =>
              updateChecklistItem(pj.id, "emergencyBriefingScheduled", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-purple-500"
          />
          <span>Emergency Briefing Scheduled</span>
        </label>
      </div>
    </div>
  </div>
</div>
```

**Final Pre-Departure Section:**

```typescript
// FINAL PRE-DEPARTURE SECTION
<div className="rounded-xl border border-red-200/70 bg-red-50/60 p-4">
  <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
    <span className="badge-soft bg-red-500/10 text-red-600">⏰</span>
    <span>Final Pre-Departure Check (48 hours before)</span>
  </div>
  <div className="space-y-3">
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={pj.allDocumentsCollected}
        onChange={(e) =>
          updateChecklistItem(pj.id, "allDocumentsCollected", e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-red-500"
      />
      <span>All Documents Collected & Verified</span>
    </label>
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={pj.allEquipmentIssued}
        onChange={(e) =>
          updateChecklistItem(pj.id, "allEquipmentIssued", e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-red-500"
      />
      <span>All Equipment Issued & Packed</span>
    </label>
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={pj.emergencyContactConfirmed}
        onChange={(e) =>
          updateChecklistItem(pj.id, "emergencyContactConfirmed", e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-red-500"
      />
      <span>Emergency Contacts Confirmed</span>
    </label>
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={pj.finalApprovalGiven}
        onChange={(e) =>
          updateChecklistItem(pj.id, "finalApprovalGiven", e.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-red-500"
      />
      <span>Final Approval Given - Ready to Board ✅</span>
    </label>
    
    <div className="ml-7 pt-2">
      <label className="text-xs font-semibold text-slate-600">Scheduled Departure:</label>
      <input
        type="datetime-local"
        value={pj.scheduledDepartureDate?.toISOString().slice(0, 16) || ''}
        onChange={(e) =>
          updateChecklistItem(pj.id, "scheduledDepartureDate", new Date(e.target.value))
        }
        className="w-full text-xs border rounded px-2 py-1 mt-1"
      />
    </div>
  </div>
</div>
```

---

## **STEP 3: TEST LOCALLY (1 day)**

```bash
# Build & test
npm run build
npm run dev

# Visit:
http://localhost:3000/crewing/prepare-joining

# Test:
✅ Open a prepare joining record
✅ Fill MCU section
✅ Fill Equipment section
✅ Fill Final Pre-Departure section
✅ Check progress bar updates
✅ Refresh page - data persists
```

---

## **STEP 4: DEPLOY (1 day)**

```bash
# Commit changes
git add .
git commit -m "feat: add MCU, equipment, and pre-departure sections to prepare joining"

# Create PR
git push origin feature/prepare-joining-improvement

# On GitHub: Create Pull Request
# Title: "feat: enhance prepare joining with MCU and equipment tracking"

# After review & approval:
git checkout main
git pull origin main
npm install
npm run build

# Test build
npm run dev

# Deploy to staging
# Test on staging
# Deploy to production
```

---

## **QUICK CHECKLIST**

```
✅ Update Prisma schema (30 min)
   [ ] Add all new fields
   [ ] Run migration
   [ ] Verify schema.prisma

✅ Update UI Component (2-3 days)
   [ ] Add MCU section
   [ ] Add Equipment section
   [ ] Add Final Pre-Departure section
   [ ] Update progress calculation
   [ ] Test all interactions

✅ Testing (1 day)
   [ ] Local testing
   [ ] Data persistence
   [ ] All fields working
   [ ] Progress calculation correct

✅ Deployment (1 day)
   [ ] Build passes
   [ ] Tests pass
   [ ] Code review approved
   [ ] Deploy to staging
   [ ] Deploy to production
```

---

**Total Time:** 4-5 days  
**Complexity:** Medium  
**Impact:** High ✅

**Ready to implement bro? Let's improve the crew joining flow! 🚀⚓**
