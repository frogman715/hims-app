# CREW VALIDATION RULES - PRODUCTION REFERENCE

**Status**: ✅ Production-Ready  
**Last Updated**: December 27, 2025  
**Used By**: Bulk Import API, CSV Script, Form Pre-fill

---

## QUICK VALIDATION SUMMARY

| Field | Required | Format | Rules |
|-------|----------|--------|-------|
| **Full Name** | ✅ YES | Text | 3-100 chars, letters/spaces/hyphens/apostrophes only |
| **Rank** | ✅ YES | Text | 1-50 chars, any format |
| Email | NO | Text | RFC 5322 format, max 255 chars |
| Phone | NO | International | +CC-XXXXXX format, 10+ digits |
| Date of Birth | NO | ISO Date | YYYY-MM-DD, age 18-70 years |
| Nationality | NO | Text | 2-50 chars, letters/spaces only |
| Place of Birth | NO | Text | Max 100 chars |
| Passport Number | NO | Text | Max 50 chars |
| Passport Expiry | NO | ISO Date | YYYY-MM-DD, must be future date |
| Seaman Book Number | NO | Text | Max 50 chars |
| Seaman Book Expiry | NO | ISO Date | YYYY-MM-DD, must be future date |
| Address | NO | Text | Max 255 chars |
| Emergency Contact Name | NO | Text | 3-100 chars (if provided) |
| Emergency Contact Phone | NO | International | +CC-XXXXXX format |
| Emergency Contact Relation | NO | Text | Max 50 chars |
| Blood Type | NO | Enum | O+, O-, A+, A-, B+, B-, AB+, AB- |
| Height (cm) | NO | Number | 140-220 cm |
| Weight (kg) | NO | Number | 40-180 kg |
| Status | NO | Enum | STANDBY, ONBOARD, OFF_SIGNED, BLOCKED |

---

## DETAILED VALIDATION RULES

### 1. FULL NAME ✅ REQUIRED

**Rule**: `3-100 characters, letters/spaces/hyphens/apostrophes only`

**Validation**:
```
✅ VALID:     "John Smith"
✅ VALID:     "Maria Sofia Garcia"
✅ VALID:     "Jean-Paul Dupont"
✅ VALID:     "O'Connor"
❌ INVALID:   "Jo" (too short)
❌ INVALID:   "John123" (numbers not allowed)
❌ INVALID:   "John@Smith" (special chars not allowed)
```

**Error Messages**:
- "Full Name: Required field"
- "Full Name: Must be at least 3 characters"
- "Full Name: Use only letters, spaces, hyphens, apostrophes (max 100 chars)"

---

### 2. RANK ✅ REQUIRED

**Rule**: `1-50 characters, non-empty`

**Validation**:
```
✅ VALID:     "Captain"
✅ VALID:     "Chief Officer"
✅ VALID:     "Bosun"
✅ VALID:     "Chief Cook"
✅ VALID:     "Able Seaman"
❌ INVALID:   "" (empty)
❌ INVALID:   "   " (spaces only)
```

**Error Messages**:
- "Rank: Required field (Captain, Chief Officer, etc)"
- "Rank: Maximum 50 characters"

---

### 3. EMAIL ⚪ OPTIONAL

**Rule**: `RFC 5322 standard format, max 255 characters`

**Validation**:
```
✅ VALID:     "john.smith@company.com"
✅ VALID:     "maria.garcia+marine@domain.co.uk"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "john@" (incomplete domain)
❌ INVALID:   "@company.com" (missing local part)
❌ INVALID:   "john smith@company.com" (space not allowed)
```

**Error Messages**:
- "Email: Invalid email format (name@domain.com)"
- "Email: Exceeds maximum length (255 characters)"

---

### 4. PHONE ⚪ OPTIONAL

**Rule**: `International format (+CC-XXXXXXX), min 10 digits`

**Valid Formats**:
```
✅ +62812-1234567 (Indonesia, 10 digits)
✅ +63917-555-0001 (Philippines, 10 digits)
✅ +971-50-123-4567 (UAE, 10 digits)
✅ +44-20-7123-4567 (UK, 10+ digits)
✅ +1-800-555-0123 (USA)
✅ (empty/null - optional)
❌ 0812-1234567 (missing country code)
❌ +62 812 1234567 (incorrect format - use hyphens)
❌ +6281 (too short - needs 10+ digits)
```

**Error Messages**:
- "Phone: Must be in international format (+CC-XXXXXXX, e.g., +62812-1234567)"
- "Phone: Must have at least 10 digits (including country code)"

**Country Code Reference**:
- Indonesia: +62
- Philippines: +63
- Singapore: +65
- Malaysia: +60
- Thailand: +66
- Myanmar: +95
- UAE: +971
- India: +91
- Bangladesh: +880
- Ukraine: +380

---

### 5. DATE OF BIRTH ⚪ OPTIONAL

**Rule**: `ISO format (YYYY-MM-DD), age 18-70 years`

**Validation**:
```
✅ VALID:     "1990-06-15" (age 35, within range)
✅ VALID:     "2005-12-31" (age 19, minimum)
✅ VALID:     "1955-01-01" (age 70, maximum)
✅ VALID:     (empty/null - optional)
❌ INVALID:   "06-15-1990" (wrong format)
❌ INVALID:   "1990/06/15" (use hyphens, not slashes)
❌ INVALID:   "2010-06-15" (age 15, too young)
❌ INVALID:   "1950-06-15" (age 75, too old)
```

**Age Calculation**:
- Minimum: Born at least 18 years ago
- Maximum: Born at most 70 years ago
- Examples (as of Dec 27, 2025):
  - Born 2007-12-27: Age = 18 ✅
  - Born 1955-12-27: Age = 70 ✅
  - Born 2007-12-28: Age = 17 ❌

**Error Messages**:
- "Date of Birth: Invalid format (use YYYY-MM-DD)"
- "Date of Birth: Crew must be at least 18 years old"
- "Date of Birth: Age exceeds typical maximum (70 years) - verify data"

---

### 6. NATIONALITY ⚪ OPTIONAL

**Rule**: `2-50 characters, letters/spaces/hyphens/apostrophes only`

**Validation**:
```
✅ VALID:     "Indonesian"
✅ VALID:     "Filipino"
✅ VALID:     "British"
✅ VALID:     "South African"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "ID" (too short - needs 2+ chars)
❌ INVALID:   "Indonesia123" (numbers not allowed)
```

**Error Messages**:
- "Nationality: Use only letters and spaces (2-50 characters)"

---

### 7. PLACE OF BIRTH ⚪ OPTIONAL

**Rule**: `Max 100 characters, any text`

**Validation**:
```
✅ VALID:     "Jakarta, Indonesia"
✅ VALID:     "Manila, Philippines"
✅ VALID:     "Port of Singapore"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "[text exceeding 100 chars...]" (too long)
```

**Error Messages**:
- "Place of Birth: Maximum 100 characters"

---

### 8. PASSPORT NUMBER ⚪ OPTIONAL

**Rule**: `Max 50 characters, any format`

**Validation**:
```
✅ VALID:     "N1234567"
✅ VALID:     "P-2024-001"
✅ VALID:     "ABC123XYZ"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "" (empty if passport number provided - cannot be whitespace-only)
```

**Error Messages**:
- "Passport Number: Cannot be empty if provided"
- "Passport Number: Maximum 50 characters"

---

### 9. PASSPORT EXPIRY ⚪ OPTIONAL (but expiry must be future)

**Rule**: `ISO format (YYYY-MM-DD), must be future date`

**Validation**:
```
✅ VALID:     "2028-12-31" (expires in future)
✅ VALID:     "2027-06-15" (expires in future)
✅ VALID:     (empty/null - optional)
❌ INVALID:   "2023-12-31" (expired)
❌ INVALID:   "2025-12-27" (expired or today)
❌ INVALID:   "12/31/2028" (wrong format)
```

**Important**: Must be strictly in future (today's date and earlier not allowed)

**Error Messages**:
- "Passport Expiry: Invalid format (use YYYY-MM-DD)"
- "Passport Expiry: Must not be expired (must be in future)"

---

### 10. SEAMAN BOOK NUMBER ⚪ OPTIONAL

**Rule**: `Max 50 characters, any format`

**Validation**:
```
✅ VALID:     "SB-IND-2024-001"
✅ VALID:     "SB-PHL-2024-002"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "" (empty if seaman book number provided)
```

**Error Messages**:
- "Seaman Book Number: Cannot be empty if provided"
- "Seaman Book Number: Maximum 50 characters"

---

### 11. SEAMAN BOOK EXPIRY ⚪ OPTIONAL (but expiry must be future)

**Rule**: `ISO format (YYYY-MM-DD), must be future date`

**Validation**:
```
✅ VALID:     "2027-12-31" (expires in future)
✅ VALID:     "2026-06-30" (expires in future)
✅ VALID:     (empty/null - optional)
❌ INVALID:   "2024-12-31" (expired)
❌ INVALID:   "2025-12-27" (expired or today)
```

**Important**: Must be strictly in future (today's date and earlier not allowed)

**Error Messages**:
- "Seaman Book Expiry: Invalid format (use YYYY-MM-DD)"
- "Seaman Book Expiry: Must not be expired (must be in future)"

---

### 12. ADDRESS ⚪ OPTIONAL

**Rule**: `Max 255 characters, any text`

**Validation**:
```
✅ VALID:     "Jl Sudirman 456, Jakarta Selatan 12940"
✅ VALID:     "123 Port Street, Manila, 1000"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "[text exceeding 255 chars...]" (too long)
```

**Error Messages**:
- "Address: Maximum 255 characters"

---

### 13. EMERGENCY CONTACT NAME ⚪ OPTIONAL

**Rule**: `3-100 characters if provided, letters/spaces only`

**Validation**:
```
✅ VALID:     "Siti Kusuma"
✅ VALID:     "Mary Smith"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "Jo" (too short)
❌ INVALID:   "Siti123" (numbers not allowed)
```

**Error Messages**:
- "Emergency Contact Name: Must be at least 3 characters"
- "Emergency Contact Name: Maximum 100 characters"

---

### 14. EMERGENCY CONTACT PHONE ⚪ OPTIONAL

**Rule**: `International format (+CC-XXXXXXX) if provided`

**Validation**:
```
✅ VALID:     "+62812-5555-0002" (Indonesia)
✅ VALID:     "+63917-555-0002" (Philippines)
✅ VALID:     (empty/null - optional)
❌ INVALID:   "0812-5555-0002" (missing country code)
❌ INVALID:   "+62 812 5555 0002" (incorrect format)
```

**Error Messages**:
- "Emergency Contact Phone: Must be in international format (+CC-XXXXXXX)"

---

### 15. EMERGENCY CONTACT RELATION ⚪ OPTIONAL

**Rule**: `Max 50 characters, any text`

**Validation**:
```
✅ VALID:     "Wife"
✅ VALID:     "Father"
✅ VALID:     "Sister"
✅ VALID:     "Brother"
✅ VALID:     "Mother"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "[text exceeding 50 chars...]" (too long)
```

**Error Messages**:
- "Emergency Contact Relation: Maximum 50 characters"

---

### 16. BLOOD TYPE ⚪ OPTIONAL

**Rule**: `Valid blood type if provided: O+, O-, A+, A-, B+, B-, AB+, AB-`

**Validation**:
```
✅ VALID:     "O+"
✅ VALID:     "A-"
✅ VALID:     "AB+"
✅ VALID:     (empty/null - optional)
❌ INVALID:   "O" (incomplete)
❌ INVALID:   "AB" (must include +/-)
❌ INVALID:   "AB-neg" (wrong format)
```

**Valid Values**:
- O+, O-
- A+, A-
- B+, B-
- AB+, AB-

**Error Messages**:
- "Blood Type: Invalid (must be one of: O+, O-, A+, A-, B+, B-, AB+, AB-)"

---

### 17. HEIGHT (cm) ⚪ OPTIONAL

**Rule**: `Number 140-220 cm if provided`

**Validation**:
```
✅ VALID:     180 (adult height)
✅ VALID:     162 (shorter adult)
✅ VALID:     220 (maximum reasonable)
✅ VALID:     (empty/null - optional)
❌ INVALID:   135 (too short)
❌ INVALID:   250 (unrealistic)
❌ INVALID:   "180 cm" (must be number only)
```

**Range**: 140-220 cm (typical adult range)

**Error Messages**:
- "Height: Must be between 140-220 cm"

---

### 18. WEIGHT (kg) ⚪ OPTIONAL

**Rule**: `Number 40-180 kg if provided`

**Validation**:
```
✅ VALID:     82 (typical adult)
✅ VALID:     65 (lighter adult)
✅ VALID:     150 (heavier adult)
✅ VALID:     (empty/null - optional)
❌ INVALID:   35 (too light)
❌ INVALID:   250 (unrealistic)
❌ INVALID:   "82 kg" (must be number only)
```

**Range**: 40-180 kg (typical adult range)

**Error Messages**:
- "Weight: Must be between 40-180 kg"

---

### 19. STATUS ⚪ OPTIONAL

**Rule**: `Valid status enum if provided`

**Validation**:
```
✅ VALID:     "STANDBY" (default)
✅ VALID:     "ONBOARD" (on vessel)
✅ VALID:     "OFF_SIGNED" (off signed from vessel)
✅ VALID:     "BLOCKED" (cannot work)
✅ VALID:     (empty/null - defaults to STANDBY)
❌ INVALID:   "ACTIVE" (not valid status)
❌ INVALID:   "On Leave" (case sensitive, use uppercase)
```

**Valid Values**:
- **STANDBY** - Available for assignment (default)
- **ONBOARD** - Currently on vessel
- **OFF_SIGNED** - Recently signed off vessel
- **BLOCKED** - Cannot work (hold, legal issue, etc)

**Error Messages**:
- "Status: Invalid (must be one of: STANDBY, ONBOARD, OFF_SIGNED, BLOCKED)"

---

## ERROR RESPONSE FORMAT

When validation fails, you'll receive:

```json
{
  "error": "Validation failed - please fix errors and retry",
  "summary": {
    "totalRows": 10,
    "validRows": 8,
    "invalidRows": 2,
    "successRate": "80%"
  },
  "failures": [
    {
      "row": 3,
      "fullName": "Jo",
      "errors": [
        "Full Name: Must be at least 3 characters"
      ]
    },
    {
      "row": 5,
      "fullName": "Maria Garcia",
      "errors": [
        "Phone: Must have at least 10 digits (including country code)",
        "Passport Expiry: Must not be expired (must be in future)"
      ]
    }
  ]
}
```

---

## CSV IMPORT EXAMPLES

### ✅ VALID ROW

```csv
John Smith,Captain,john@company.com,+44-20-7123-4567,British,1985-06-15,London,P1234567,2028-12-31,SB-GBR-2024-001,2027-12-31,123 Port Street London,Mary Smith,+44-20-1234-5678,Wife,O+,180,82,STANDBY
```

### ❌ INVALID ROWS

```csv
# Row 2: Full Name too short
Jo,Captain,jo@company.com,+62812-1234567,Indonesian,1985-06-15,,,,,,,,,,,,
# Error: "Full Name: Must be at least 3 characters"

# Row 3: Missing Rank
Ahmad Kusuma,,ahmad@company.com,+62812-1234567,Indonesian,1985-06-15,,,,,,,,,,,,
# Error: "Rank: Required field"

# Row 4: Invalid phone format (missing country code)
Maria Garcia,Officer,maria@company.com,0812-1234567,Indonesian,1990-09-20,,,,,,,,,,,,
# Error: "Phone: Must be in international format (+CC-XXXXXXX)"

# Row 5: Age too young
Ahmad Junior,Apprentice,ahmad.jr@company.com,+62812-1234567,Indonesian,2010-12-27,,,,,,,,,,,,
# Error: "Date of Birth: Crew must be at least 18 years old"

# Row 6: Passport expired
Sarah Johnson,Officer,sarah@company.com,+1-800-555-0001,American,1980-03-15,,P1234567,2023-12-31,,,,,,,,,,
# Error: "Passport Expiry: Must not be expired (must be in future)"
```

---

## TESTING VALIDATION

### Using API (cURL)

```bash
# Test with invalid data (dry-run)
curl -X POST http://localhost:3000/api/crew/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "crews": [
      {
        "fullName": "Jo",
        "rank": "Captain",
        "email": "invalid-email",
        "phone": "123456"
      }
    ],
    "dryRun": true
  }'

# Response shows validation errors:
# - Full Name: Must be at least 3 characters
# - Email: Invalid email format
# - Phone: Must be in international format
```

### Using CSV Script

```bash
# Test CSV with dry-run (no actual import)
npx ts-node scripts/bulk-import-crew.ts crews.csv --dry-run

# Output shows which rows are valid/invalid
# ❌ Row 3: Full Name too short
# ❌ Row 5: Invalid email format
```

---

## PRODUCTION DEPLOYMENT CHECKLIST

- [x] Validation rules implemented in API
- [x] Error messages are user-friendly
- [x] All enum values verified against Prisma schema
- [x] Date calculations correct
- [x] No dummy data in templates
- [x] TypeScript types strict (no `any`)
- [x] Build succeeds without errors
- [x] Code tested locally
- [x] Production-ready commit: `07760bb`

---

## COMMON MISTAKES & FIXES

| Problem | Wrong | Right |
|---------|-------|-------|
| Phone format | `0812-1234567` | `+62812-1234567` |
| Date format | `06-15-1990` | `1990-06-15` |
| Status | `ACTIVE` | `STANDBY` or `ONBOARD` |
| Blood Type | `AB` | `AB+` or `AB-` |
| Email validation | `john@company` | `john@company.com` |
| Height/Weight | `"180 cm"` | `180` (number) |

---

## QUESTIONS?

- **For API errors**: Check [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- **For CSV format**: See [CREW_DATA_INPUT_GUIDE.md](CREW_DATA_INPUT_GUIDE.md)
- **For examples**: Review [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

**Last Updated**: December 27, 2025  
**Status**: ✅ Production Ready  
**Next Review**: After first 100 crew imports
