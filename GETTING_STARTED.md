# CREW DATA INPUT - GETTING STARTED GUIDE

**Status**: ✅ Production Ready  
**Last Updated**: December 27, 2025  
**For**: Hanmarine App - Real Crew Data Input

---

## 🎯 WHAT IS THIS?

This is the production system for **importing your actual crew data** into the HIMS app. It's built for:
- ✅ Speed (import 10 crews in 1 minute)
- ✅ Accuracy (strict validation catches errors early)
- ✅ No dummy data (real crew data only)
- ✅ Easy to use (simple CSV format)

---

## 🚀 QUICK START - 5 MINUTES

### Step 1: Prepare Your Crew Data

Create an **Excel file** with your crew information:

| Full Name | Rank | Email | Phone | Other Info |
|-----------|------|-------|-------|------------|
| Ahmad Kusuma | Captain | ahmad@hanmarine.co | +62812-1234567 | ... |
| John Smith | Chief Officer | john@example.com | +63917-555-0001 | ... |

### Step 2: Convert to CSV

Save as CSV format (comma-separated values):
```
crew-data.csv
```

### Step 3: Run Import

```bash
npx ts-node scripts/bulk-import-crew.ts crew-data.csv --dry-run
```

This **tests** without creating anything. You'll see:
- ✅ Green: Valid crew records (ready to create)
- ❌ Red: Invalid crew records (needs fixing)

### Step 4: Fix & Import

Fix any errors, then run without `--dry-run`:

```bash
npx ts-node scripts/bulk-import-crew.ts crew-data.csv
```

Done! Your crews are now in the system! ✅

---

## 📋 CSV FORMAT - YOUR FIELDS

Download or use this template:

```
crew-bulk-import-template.csv
```

### Required Fields (MUST have)
1. **fullName** - e.g., "Ahmad Kusuma"
2. **rank** - e.g., "Captain", "Chief Officer"

### Optional Fields (nice to have)
- email
- phone
- nationality
- dateOfBirth (YYYY-MM-DD)
- placeOfBirth
- passportNumber
- passportExpiry (YYYY-MM-DD)
- seamanBookNumber
- seamanBookExpiry (YYYY-MM-DD)
- address
- emergencyContactName
- emergencyContactPhone
- emergencyContactRelation
- bloodType (O+, A+, B+, AB+, O-, A-, B-, AB-)
- heightCm
- weightKg
- status (STANDBY, ONBOARD, OFF_SIGNED, BLOCKED)

---

## ✅ FIELD RULES - SIMPLE CHECKLIST

### Always Check Before Import

- [ ] **Full Name**: 3+ characters, letters only (no numbers/symbols)
  - Example: "Ahmad Kusuma" ✅
  - Example: "Jo" ❌ (too short)

- [ ] **Rank**: Not empty, any format allowed
  - Example: "Captain" ✅
  - Example: "Chief Officer" ✅

- [ ] **Email** (if provided): Must be valid email
  - Example: "ahmad@hanmarine.co" ✅
  - Example: "ahmad@" ❌

- [ ] **Phone** (if provided): International format (+CC-XXXXX)
  - Example: "+62812-1234567" ✅
  - Example: "0812-1234567" ❌ (missing country code)

- [ ] **Date of Birth** (if provided): YYYY-MM-DD format, age 18-70
  - Example: "1985-06-15" ✅
  - Example: "06-15-1985" ❌ (wrong format)

- [ ] **Passport Expiry** (if provided): YYYY-MM-DD, must be in future
  - Example: "2028-12-31" ✅
  - Example: "2023-12-31" ❌ (expired)

- [ ] **Seaman Book Expiry** (if provided): YYYY-MM-DD, must be in future
  - Example: "2027-12-31" ✅

- [ ] **Blood Type** (if provided): O+, O-, A+, A-, B+, B-, AB+, AB-
  - Example: "A+" ✅
  - Example: "AB" ❌ (incomplete)

- [ ] **Height & Weight** (if provided): Reasonable numbers
  - Example: height=180 (cm), weight=82 (kg) ✅

- [ ] **Status** (if provided): STANDBY, ONBOARD, OFF_SIGNED, or BLOCKED
  - Default: STANDBY (if not provided)

---

## 🔍 COMMON MISTAKES TO AVOID

### ❌ Phone Number Mistakes

```
WRONG: 0812-1234567          RIGHT: +62812-1234567
WRONG: +62 812 1234567       RIGHT: +62812-1234567
WRONG: 62812-1234567         RIGHT: +62812-1234567
```

**Remember**: Always start with **+** and **country code**!

### ❌ Date Mistakes

```
WRONG: 06-15-1990            RIGHT: 1990-06-15
WRONG: 1990/06/15            RIGHT: 1990-06-15
WRONG: 15-Jun-1990           RIGHT: 1990-06-15
```

**Remember**: Use **YYYY-MM-DD** format always!

### ❌ Email Mistakes

```
WRONG: ahmad@                RIGHT: ahmad@hanmarine.co
WRONG: ahmad@hanmarine       RIGHT: ahmad@hanmarine.co
WRONG: ahmad.hanmarine.co    RIGHT: ahmad@hanmarine.co
```

**Remember**: Email **must have @ and domain**!

### ❌ Status Mistakes

```
WRONG: ACTIVE                RIGHT: STANDBY
WRONG: On Board              RIGHT: ONBOARD
WRONG: Off-Signed            RIGHT: OFF_SIGNED
```

**Remember**: Status is **case-sensitive**, use capitals!

---

## 📊 INPUT COMPARISON - WHICH METHOD?

### 1️⃣ Bulk Import Script (FASTEST)
**When**: You have 5+ crews to add  
**Speed**: 1 minute for 10 crews  
**Effort**: Low (prepare CSV, run script)
```bash
npx ts-node scripts/bulk-import-crew.ts crews.csv
```

### 2️⃣ Form Pre-fill Link (QUICK)
**When**: Adding 1-2 crews quickly  
**Speed**: 3 minutes per crew  
**Effort**: Medium (create URL, fill form)
```
/crewing/crew-list/new?fullName=Ahmad&rank=Captain&phone=%2B62...
```

### 3️⃣ Manual Form (SLOWEST)
**When**: Only 1 crew, no rush  
**Speed**: 10 minutes per crew  
**Effort**: High (fill each field)
```
Click "New Crew" → Fill form → Submit
```

---

## 📝 CREATING YOUR CSV FILE

### In Microsoft Excel

1. Open Excel
2. Create headers in Row 1:
   ```
   fullName | rank | email | phone | ...
   ```
3. Enter your crew data starting Row 2
4. **Save As** → Select **CSV** format
5. Use in import script

### In Google Sheets

1. Create new sheet
2. Add headers and data
3. **File** → **Download** → **CSV**
4. Use in import script

### In Text Editor (Simple Method)

Create file `crews.csv`:
```csv
fullName,rank,email,phone,nationality,dateOfBirth
Ahmad Kusuma,Captain,ahmad@example.com,+62812-1234567,Indonesian,1980-03-15
John Smith,Chief Officer,john@example.com,+63917-555-0001,Filipino,1985-06-20
```

---

## 🧪 TESTING YOUR DATA

### Step 1: Dry-Run (No Import)

```bash
# Test your CSV without creating data
npx ts-node scripts/bulk-import-crew.ts crews.csv --dry-run
```

**Output Examples**:

✅ **All valid**:
```
📂 Reading file: crews.csv
📋 Found 10 crew records
🔍 Mode: DRY-RUN
✅ All 10 crew records are VALID!
✓ Ready for import - remove --dry-run to actually create
```

❌ **Some invalid**:
```
📂 Reading file: crews.csv
📋 Found 10 crew records
🔍 Mode: DRY-RUN
❌ VALIDATION FAILED!

Invalid records:
Row 3 (Ahmad Kusuma)
  ❌ Phone: Must be in international format
  ❌ Date of Birth: Crew must be at least 18 years old

Row 7 (Maria Garcia)
  ❌ Email: Invalid email format
```

### Step 2: Fix Errors

Look at the errors and fix your CSV:
- Row 3: Change phone to `+62812-1234567`
- Row 3: Change DOB to `1980-03-15` (instead of `2010-03-15`)
- Row 7: Change email to valid format

### Step 3: Import (Actually Create)

```bash
# Now import for real
npx ts-node scripts/bulk-import-crew.ts crews.csv
```

**Success Output**:
```
📂 Reading file: crews.csv
📋 Found 10 crew records
🔍 Mode: ACTUAL IMPORT
✅ SUCCESS!
✓ Created 10 crews

📊 Created Crews:
  • Ahmad Kusuma (Captain)
    ID: clmxyz123
    Email: ahmad@example.com
  • John Smith (Chief Officer)
    ID: clmxyz124
    Email: john@example.com
```

---

## 🎓 EXAMPLES - COPY & MODIFY

### Example 1: Minimal Data

```csv
fullName,rank
Ahmad Kusuma,Captain
John Smith,Chief Officer
```

✅ Valid! Only needs name and rank.  
Other fields can be added later.

### Example 2: Complete Data

```csv
fullName,rank,email,phone,nationality,dateOfBirth,passportNumber,passportExpiry
Ahmad Kusuma,Captain,ahmad@hanmarine.co,+62812-1234567,Indonesian,1980-03-15,N1234567,2028-05-10
```

✅ Full crew profile ready for use.

### Example 3: With Emergency Contact

```csv
fullName,rank,email,phone,emergencyContactName,emergencyContactPhone,emergencyContactRelation
Ahmad Kusuma,Captain,ahmad@hanmarine.co,+62812-1234567,Siti Kusuma,+62812-5555-0002,Wife
```

✅ Emergency contact included.

---

## 📞 TROUBLESHOOTING

### Problem: "fullName and rank required"
**Solution**: Make sure row has at least:
- Column 1 (fullName): Not empty, 3+ chars
- Column 2 (rank): Not empty

### Problem: "Invalid email format"
**Solution**: Email must have @ and domain:
- ✅ john@company.com
- ❌ john@
- ❌ john.company

### Problem: "Phone: Must be in international format"
**Solution**: Phone must start with + and have country code:
- ✅ +62812-1234567 (Indonesia)
- ✅ +63917-555-0001 (Philippines)
- ❌ 0812-1234567 (missing +CC)

### Problem: "Age exceeds typical maximum"
**Solution**: Date of Birth person must be 18-70 years old:
- ✅ 1985-06-15 (age 40)
- ❌ 2010-06-15 (age 15, too young)
- ❌ 1950-06-15 (age 75, too old)

### Problem: "Must not be expired"
**Solution**: Passport/Seaman Book must be in future:
- ✅ 2028-12-31 (future)
- ❌ 2023-12-31 (past)
- ❌ 2025-12-27 (today or earlier)

### Problem: CSV file not found
**Solution**: Make sure file is in right directory:
```bash
# If file is in current directory:
npx ts-node scripts/bulk-import-crew.ts crews.csv

# If file is in different folder:
npx ts-node scripts/bulk-import-crew.ts ../data/crews.csv
```

---

## 📚 LEARN MORE

| Topic | Document |
|-------|----------|
| Full validation rules | [VALIDATION_RULES.md](VALIDATION_RULES.md) |
| API details | [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) |
| Quick commands | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) |
| Advanced topics | [CREW_ADVANCED_GUIDE.md](CREW_ADVANCED_GUIDE.md) |

---

## ✨ YOU'RE READY!

You now have everything to:
1. ✅ Create crew data (manual or Excel)
2. ✅ Test it (dry-run)
3. ✅ Import it (bulk script)
4. ✅ View it in app

**Questions?** Check the validation rules guide or implementation guide above.

**Let's go! Import your crew data! 🚀**
