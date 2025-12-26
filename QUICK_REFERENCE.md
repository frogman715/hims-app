# ⚡ QUICK REFERENCE CARD - Crew Input System
## ✅ Production-Ready | Strict Validation | No Dummy Data

Simpan file ini untuk quick lookup!

---

## 🎯 4 CARA INPUT CREW

### 1️⃣ MANUAL INPUT (5-10 min per crew)
```
Navigate: Crewing → Crew List → + New Crew Member
Isi form → Submit ✓
```

### 2️⃣ PRE-FILL VIA URL (2-3 min per crew)
```
Link: /crewing/crew-list/new?fullName=Ahmad+Kusuma&rank=Captain
Isi sisa fields → Submit ✓
```

### 3️⃣ BULK IMPORT (1 min untuk 10+ crew)
```bash
# Dry run dulu
npx ts-node scripts/bulk-import-crew.ts my-crew.csv --dry-run

# Jika OK, import
npx ts-node scripts/bulk-import-crew.ts my-crew.csv
```

### 4️⃣ API DIRECT (For integrations)
```bash
curl -X POST http://localhost:3000/api/crew/bulk \
  -H "Content-Type: application/json" \
  -d '{"crews": [{...}], "dryRun": false}'
```

---

## 📋 REQUIRED FIELDS (Harus diisi!)

```
✅ fullName         (min 3 chars)
✅ rank             (Captain, Chief Officer, etc)
✅ email            (valid format)
✅ phone            (+CC format, ex: +62812...)
✅ nationality      (Indonesian, Filipino, etc)
```

**Optional tapi recommended:**
```
dateOfBirth        (YYYY-MM-DD)
passportNumber     + passportExpiry
seamanBookNumber   + seamanBookExpiry
emergencyContactName + emergencyContactPhone
address
```

---

## 🔗 URL PRE-FILL EXAMPLES

```
Captain:
/crewing/crew-list/new?fullName=Ahmad+Kusuma&rank=Captain

Chief Officer:
/crewing/crew-list/new?fullName=John+Smith&rank=Chief+Officer&nationality=Filipino

Crew Member:
/crewing/crew-list/new?rank=Able+Seaman&status=STANDBY

Special chars encoding:
Space     → +
@         → %40
+         → %2B
-         → - (no encoding needed)
```

---

## 📊 CSV TEMPLATE COLUMNS

```
fullName | rank | email | phone | nationality | dateOfBirth | 
placeOfBirth | passportNumber | passportExpiry | 
seamanBookNumber | seamanBookExpiry | address | 
emergencyContactName | emergencyContactPhone | 
emergencyContactRelation | bloodType | heightCm | weightKg | status
```

**Min columns (required only):**
```
fullName,rank,email,phone,nationality
```

---

## ✅ VALIDATION RULES

| Field | Rule | Example |
|-------|------|---------|
| fullName | >= 3 chars | Ahmad Kusuma |
| rank | Must exist | Captain, Chief Officer |
| email | Valid format | ahmad@hanmarine.co |
| phone | +CC format | +62812-5555-0001 |
| dateOfBirth | >= 18 yo | 1978-03-22 |
| passport expiry | Future date | 2028-05-10 |
| seaman book expiry | Future date | 2027-12-31 |

---

## 🚀 BULK IMPORT WORKFLOW

```
1. Prepare CSV
   ↓
2. Dry run test
   npx ts-node scripts/bulk-import-crew.ts crew.csv --dry-run
   ↓
3. Check errors (if any, fix CSV)
   ↓
4. Actual import
   npx ts-node scripts/bulk-import-crew.ts crew.csv
   ↓
5. Verify in UI
   https://app.hanmarine.co/crewing/crew-list
```

---

## 📁 FILES REFERENCE

| File | Purpose | Location |
|------|---------|----------|
| Form component | Pre-population logic | `src/app/crewing/crew-list/new/page.tsx` |
| Bulk API | Create multiple crew | `src/app/api/crew/bulk/route.ts` |
| Import script | CSV to API | `scripts/bulk-import-crew.ts` |
| CSV template | Data template | `crew-bulk-import-template.csv` |
| This guide | Implementation details | `IMPLEMENTATION_GUIDE.md` |
| Advanced guide | Full details | `CREW_ADVANCED_GUIDE.md` |

---

## 🔐 PERMISSIONS

All crew input features require:
```
✅ HR (Human Resources)
✅ HR_ADMIN
✅ DIRECTOR
✅ SUPER_ADMIN
```

Non-HR users akan redirect ke dashboard.

---

## 🐛 TROUBLESHOOTING

### Error: "Full Name must be at least 3 characters"
**Fix:** Pastikan fullName punya >= 3 karakter
```
❌ Jo
✅ John Michael Smith
```

### Error: "Invalid email format"
**Fix:** Email harus valid (ada @, ada domain)
```
❌ john.hanmarine.co
✅ john@hanmarine.co
```

### Error: "Phone must start with country code"
**Fix:** Gunakan format +CC
```
❌ 0812-3456-7890
✅ +62812-3456-7890
```

### Error: "Passport is expired"
**Fix:** Expiry date harus masa depan (> hari ini)
```
❌ 2025-12-25 (udah lewat)
✅ 2028-05-10 (masih 2+ tahun)
```

### Script error: "File not found"
**Fix:** Pastikan CSV file di current directory
```bash
# Check file exists
ls -la crew.csv

# Run dari directory yang tepat
cd ~/projects/hims-app
npx ts-node scripts/bulk-import-crew.ts crew.csv
```

---

## 💡 TIPS & TRICKS

### Tip 1: Generate Pre-fill Link
```javascript
// Dari crew data object:
const crew = { 
  fullName: "Ahmad Kusuma", 
  rank: "Captain",
  email: "ahmad@hanmarine.co"
};

const params = new URLSearchParams(crew);
const link = `/crewing/crew-list/new?${params}`;
// Output: /crewing/crew-list/new?fullName=Ahmad+Kusuma&rank=Captain...
```

### Tip 2: Bulk Import dari Excel
1. Save Excel as CSV
2. Run: `npx ts-node scripts/bulk-import-crew.ts file.csv`
3. Done!

### Tip 3: Validate before import
Selalu run dry-run dulu sebelum actual import:
```bash
npx ts-node scripts/bulk-import-crew.ts crew.csv --dry-run
```

### Tip 4: Custom API URL
```bash
export API_URL="https://app.hanmarine.co"
npx ts-node scripts/bulk-import-crew.ts crew.csv
```

---

## 📞 SUPPORT

Jika ada masalah, check:
1. CREW_DATA_INPUT_GUIDE.md (basic guide)
2. CREW_ADVANCED_GUIDE.md (detailed validation rules)
3. IMPLEMENTATION_GUIDE.md (full implementation details)
4. Look at API response error messages (sudah jelas)

---

**Version:** 1.0  
**Last Updated:** Dec 27, 2025  
**Status:** ✅ Production Ready
