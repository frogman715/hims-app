# OPTION 2: TESTING & FEEDBACK GUIDE 🧪

## Server Status
✅ **Dev Server Running:** http://localhost:3000  
✅ **No TypeScript Errors**  
✅ **All New Routes Compiled Successfully**

---

## 🎯 Test Plan

### Prerequisites
1. **Login credentials:** `admin@hims.com` / `admin123` (DIRECTOR role)
2. **Browser:** Open http://localhost:3000
3. **Clear cache:** Ctrl+Shift+R (hard refresh)

---

## Test Scenario 1: Dashboard Overview ✅

**URL:** http://localhost:3000/dashboard

**Expected Features:**
- Crew statistics cards (total, active, onboard, preparing)
- Workflow stage cards (received, reviewing, interview, etc.)
- External compliance widgets (KOSMA, Dephub, Schengen)
- Recent activities timeline
- World clock with multiple time zones

**Test Actions:**
1. ✅ Verify all stats load correctly
2. ✅ Check if external compliance shows permission error (403) - expected for non-compliance roles
3. ✅ Click navigation links to other modules
4. ✅ Confirm responsive layout on different screen sizes

**Known Issues:**
- External compliance permission errors (403) - by design, requires specific permissions

---

## Test Scenario 2: Prepare Joining with Letter Guarantee 🆕

**URL:** http://localhost:3000/crewing/prepare-joining

### Part A: View Prepare Joining List
**Expected Features:**
- List of crew preparing to join vessels
- Status filtering: PENDING, DOCUMENTS, MEDICAL, TRAINING, TRAVEL, READY, DISPATCHED
- Progress percentage for each crew
- 9-item checklist with real-time updates
- **NEW:** "📄 Generate Letter Guarantee" button

**Test Actions:**
1. ✅ Navigate to prepare joining page
2. ✅ Verify crew list displays correctly
3. ✅ Test status filtering dropdown
4. ✅ Check checklist items update on checkbox click
5. ✅ Verify progress percentage updates correctly
6. ✅ **NEW:** Look for purple-pink "Generate Letter Guarantee" button

### Part B: Generate Letter Guarantee (NEW FEATURE)
**Test Actions:**
1. Find any crew in prepare joining list
2. Click "📄 Generate Letter Guarantee" button
3. Verify new tab opens with Letter Guarantee

**Expected Output:**
```html
PT HANMARINE INTERNATIONAL MARITIME SERVICE
[Company header with address, phone, email]

Date: [Today's date]
Letter No: LG/2025/01/XXXX

To: Airlines (Check-in Counter)
To: Immigration Department, Republic of Indonesia
To: Immigration Department, [Destination Country]
To: Local Handling Agent, [Port Name]

Subject: Letter of Guarantee for Seafarer Joining Vessel

[Body with vessel details]

Seafarer Details Table:
| No | Full Name | Date of Birth | Rank | Passport No | Seaman Book No |
|----|-----------|---------------|------|-------------|----------------|
| 1  | [Crew]    | [DOB]         | [AB] | [Pass]      | [Seaman]       |

Handling Agent Details:
[Editable fields for agent info]

Signature section
```

**Verify:**
- ✅ Company info auto-filled
- ✅ Today's date auto-generated
- ✅ Letter number auto-generated (format: LG/YYYY/MM/XXXX)
- ✅ Crew info auto-filled (name, DOB, rank, passport, seaman book)
- ✅ Principal and vessel info populated
- ✅ Editable fields shown with placeholders
- ✅ Professional HTML layout
- ✅ Ready for print/save as PDF

**User Editable Fields:**
- Recipients list
- Handling agent name, address, contact, email
- Destination country

---

## Test Scenario 3: Form Management Page 🆕

**URL:** http://localhost:3000/crewing/forms

### Part A: Form Management UI
**Expected Features:**
- Two tabs: "Form Submissions" and "Form Templates"
- Stats cards at top: Pending Review, Approved, Changes Requested, Draft
- Purple-pink gradient theme
- Responsive grid layout

**Test Actions:**
1. ✅ Navigate to form management page
2. ✅ Verify two tabs render correctly
3. ✅ Check stats cards display (will be 0 initially)
4. ✅ Switch between tabs
5. ✅ Verify empty state messages if no data

### Part B: Form Templates Tab
**Expected Display:**
- Templates grouped by principal name
- Category badges (MEDICAL, TRAINING, DECLARATION, SAFETY)
- Required flag display
- Display order visible
- Template path and description

**Test Actions:**
1. ✅ Click "Form Templates" tab
2. ✅ Verify empty state or templates (if seeded)
3. ✅ Check grouping by principal
4. ✅ Verify category badge colors:
   - Red: MEDICAL
   - Blue: TRAINING
   - Green: DECLARATION
   - Yellow: SAFETY

### Part C: Form Submissions Tab
**Expected Display:**
- Form name and category badge
- Status badge (DRAFT, SUBMITTED, UNDER_REVIEW, etc.)
- Crew name and rank
- Principal name
- Version number
- "Review Form" button

**Test Actions:**
1. ✅ Click "Form Submissions" tab
2. ✅ Verify empty state message (no submissions yet)
3. ✅ Check status badge colors:
   - Gray: DRAFT
   - Blue: SUBMITTED
   - Yellow: UNDER_REVIEW
   - Orange: CHANGES_REQUESTED
   - Green: APPROVED
   - Red: REJECTED

---

## Test Scenario 4: Individual Form Review Page 🆕

**URL:** http://localhost:3000/crewing/forms/[id]

**⚠️ Note:** Requires existing form submission to test. Will show "Form not found" if no forms exist yet.

**Expected Features:**
- Header with form name, status, category, version badges
- Back button to return to form management
- Crew Information card (auto-filled)
- Form Data card (editable in edit mode)
- Approval Timeline card (chronological history)
- Action buttons based on status and user role
- Modal dialogs for reject and request changes

**Test Actions (Once form exists):**
1. ✅ Navigate to individual form (if available)
2. ✅ Verify crew information displays correctly
3. ✅ Check form data section
4. ✅ Verify approval timeline shows history
5. ✅ Test action buttons based on status:

**For DRAFT status:**
- ✅ "Edit Form" button available
- ✅ "Submit for Review" button available
- ✅ Click edit, modify field, save
- ✅ Submit for review, verify status changes to SUBMITTED

**For SUBMITTED status (as CDMO/DIRECTOR):**
- ✅ "Approve" button available
- ✅ "Request Changes" button available
- ✅ "Reject" button available
- ✅ Test approve: verify status → APPROVED
- ✅ Test request changes: verify modal, input required
- ✅ Test reject: verify modal, reason required

**For CHANGES_REQUESTED status:**
- ✅ "Edit Form" button available
- ✅ Make changes, save, resubmit

**For APPROVED status:**
- ✅ "Download PDF" button available (PDF generation TODO)

---

## Test Scenario 5: API Endpoints Testing 🔧

### A. Form Templates API
```bash
# Get all templates
curl http://localhost:3000/api/form-templates

# Get templates by principal
curl http://localhost:3000/api/form-templates?principalId=PRINCIPAL_ID

# Create new template (requires FULL_ACCESS)
curl -X POST http://localhost:3000/api/form-templates \
  -H "Content-Type: application/json" \
  -d '{
    "principalId": "PRINCIPAL_ID",
    "formName": "Test Form",
    "formCategory": "MEDICAL",
    "templatePath": "test/path.docx",
    "isRequired": true,
    "displayOrder": 10,
    "description": "Test template"
  }'
```

### B. Form Submissions API
```bash
# Get all submissions
curl http://localhost:3000/api/form-submissions

# Get by status
curl http://localhost:3000/api/form-submissions?status=DRAFT

# Get single submission
curl http://localhost:3000/api/form-submissions/[ID]

# Update submission
curl -X PUT http://localhost:3000/api/form-submissions/[ID] \
  -H "Content-Type: application/json" \
  -d '{"formData": {"field1": "value1"}}'

# Approve (CDMO/DIRECTOR only)
curl -X POST http://localhost:3000/api/form-submissions/[ID]/approve \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved"}'

# Reject (CDMO/DIRECTOR only)
curl -X POST http://localhost:3000/api/form-submissions/[ID]/reject \
  -H "Content-Type: application/json" \
  -d '{"reason": "Missing information"}'

# Request Changes (CDMO/DIRECTOR only)
curl -X POST http://localhost:3000/api/form-submissions/[ID]/request-changes \
  -H "Content-Type: application/json" \
  -d '{"changes": "Please update dates"}'
```

### C. Letter Guarantee API
```bash
# Generate Letter Guarantee
curl http://localhost:3000/api/forms/letter-guarantee/[PREPARE_JOINING_ID]

# Response includes:
# - data: JSON with all fields
# - html: HTML document ready for display

# Save Letter Guarantee as form submission
curl -X POST http://localhost:3000/api/forms/letter-guarantee/[PREPARE_JOINING_ID] \
  -H "Content-Type: application/json" \
  -d '{"formData": {"date": "2025-01-01", "recipients": [...]}}'
```

---

## Test Scenario 6: Seed Form Templates (Option 3) 🌱

**URL:** POST http://localhost:3000/api/admin/seed-form-templates

**Prerequisites:**
- Must be logged in as DIRECTOR role
- admin@hims.com / admin123

**Test Actions:**
1. ✅ Login as admin
2. ✅ Open browser console or use curl:

```bash
curl -X POST http://localhost:3000/api/admin/seed-form-templates \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Form templates seeded successfully",
  "results": {
    "principalsCreated": 2,  // or 0 if already exist
    "principalsFound": 0,    // or 2 if already exist
    "templatesCreated": 9,   // 5 INTEGRIS + 4 LUNDQVIST
    "errors": []
  }
}
```

**Verify:**
3. ✅ Go to /crewing/forms
4. ✅ Click "Form Templates" tab
5. ✅ Verify templates grouped by principal:
   - INTEGRIS CO.,LTD (5 templates)
   - LUNDQVIST REDERIERNA (4 templates)
6. ✅ Check category badges and display order
7. ✅ Verify descriptions display correctly

---

## 🐛 Known Issues & Expected Behaviors

### 1. External Compliance Permission Errors (403)
**Status:** Expected behavior  
**Reason:** Dashboard tries to load external compliance stats but user doesn't have compliance module permissions  
**Impact:** No impact on other functionality  
**Fix:** Will be resolved when compliance permissions are properly configured

### 2. Empty Form Lists
**Status:** Expected initially  
**Reason:** No form submissions created yet  
**Solution:** Run seeding endpoint (Option 3) to populate templates

### 3. PDF Download Not Working
**Status:** TODO (noted in code)  
**Reason:** PDF generation library not implemented yet  
**Workaround:** Use browser Print → Save as PDF for Letter Guarantee

### 4. Form Auto-Fill Logic
**Status:** Partially implemented  
**Implemented:** Letter Guarantee auto-fills crew data  
**TODO:** Auto-fill logic for other form types (Medical History, Next of Kin, etc.)

---

## 📊 Test Results Tracking

### Dashboard (/dashboard)
- [ ] Stats cards load correctly
- [ ] Workflow stage cards display
- [ ] External compliance widgets (403 expected)
- [ ] Navigation links work
- [ ] Responsive layout

### Prepare Joining (/crewing/prepare-joining)
- [ ] Crew list displays
- [ ] Status filtering works
- [ ] Checklist updates work
- [ ] Progress percentage updates
- [ ] Letter Guarantee button visible
- [ ] Letter Guarantee generates correctly
- [ ] Letter Guarantee data auto-filled
- [ ] Letter Guarantee HTML formatted properly

### Form Management (/crewing/forms)
- [ ] Two tabs render
- [ ] Stats cards display
- [ ] Tab switching works
- [ ] Empty states display
- [ ] Templates grouped by principal
- [ ] Category badges correct colors
- [ ] Status badges correct colors

### Form Review (/crewing/forms/[id])
- [ ] Form details display
- [ ] Crew information correct
- [ ] Form data editable
- [ ] Approval timeline shows
- [ ] Edit mode works
- [ ] Submit for review works
- [ ] Approve/Reject/Request Changes work (CDMO/DIRECTOR)
- [ ] Modals display correctly

### API Endpoints
- [ ] Form templates GET
- [ ] Form templates POST
- [ ] Form submissions GET
- [ ] Form submissions single GET
- [ ] Form submissions PUT
- [ ] Form submissions approve
- [ ] Form submissions reject
- [ ] Form submissions request-changes
- [ ] Letter Guarantee GET
- [ ] Letter Guarantee POST
- [ ] Admin seed templates

### Seeding (Option 3)
- [ ] Principals created/found
- [ ] Templates created
- [ ] Templates display in UI
- [ ] No errors in response

---

## 💡 User Feedback Needed

### 1. Letter Guarantee
- ✅ Is the auto-filled data correct?
- ✅ Are editable fields sufficient?
- ✅ Is the HTML layout professional enough?
- ❓ Should we add more fields (flight details, arrival date, etc.)?
- ❓ Do you want PDF generation now or browser print is OK?

### 2. Form Management UI
- ✅ Is the purple-pink gradient theme acceptable?
- ✅ Are status and category badges clear enough?
- ❓ Should we add search/filter for forms?
- ❓ Do you want bulk actions (approve multiple forms)?
- ❓ Should we add form history/version tracking UI?

### 3. Form Review Page
- ✅ Is the approval workflow clear?
- ✅ Are action buttons intuitive?
- ❓ Should we add comment threads for reviews?
- ❓ Do you want email notifications on status changes?
- ❓ Should we add form preview before submission?

### 4. Form Templates
- ✅ Are the seeded templates correct?
- ❓ Do you need UI to manage templates (add/edit/delete)?
- ❓ Should we support template file uploads?
- ❓ Do you want template versioning?

### 5. Auto-Fill Logic
- ✅ Letter Guarantee auto-fill is sufficient?
- ❓ What fields should auto-fill for Medical History form?
- ❓ What fields should auto-fill for Next of Kin form?
- ❓ Should we support custom field mappings per principal?

### 6. Permissions
- ✅ Are current permission levels correct?
- ❓ Should OPERATIONAL role have direct approve access?
- ❓ Should we add form template manager role?
- ❓ Do you want principal-specific form access?

### 7. Missing Features
- ❓ Form deadline/due date tracking?
- ❓ Form completion reminders?
- ❓ Form analytics/reports?
- ❓ Form export (Excel, CSV)?
- ❓ Form archiving?

---

## 🚀 Next Steps After Testing

### If Everything Works:
1. ✅ Run seeding endpoint (Option 3)
2. ✅ Populate form templates
3. ✅ Test complete workflow end-to-end
4. ✅ Provide feedback on UX/UI
5. ✅ Identify missing features
6. ✅ Move to production deployment

### If Issues Found:
1. 🐛 Document bugs with steps to reproduce
2. 🐛 Take screenshots of errors
3. 🐛 Check browser console for errors
4. 🐛 Test on different browsers (Chrome, Firefox, Safari)
5. 🐛 Test on mobile devices

---

## 📝 Testing Checklist Summary

**Quick Test (5 minutes):**
- [ ] Login as admin
- [ ] Visit dashboard
- [ ] Visit prepare joining
- [ ] Click Letter Guarantee button
- [ ] Visit form management page
- [ ] Run seeding endpoint

**Comprehensive Test (30 minutes):**
- [ ] All Quick Test items
- [ ] Test each tab in form management
- [ ] Create sample form submission (via API)
- [ ] Test form review page
- [ ] Test approval workflow
- [ ] Test reject workflow
- [ ] Test request changes workflow
- [ ] Verify permissions for different roles
- [ ] Test on mobile device
- [ ] Test with multiple crew members

**Production Ready Test (1 hour):**
- [ ] All Comprehensive Test items
- [ ] Load test with 50+ forms
- [ ] Security audit (try accessing APIs without auth)
- [ ] Cross-browser testing
- [ ] Performance testing (page load times)
- [ ] Database query optimization check
- [ ] Error handling verification
- [ ] Edge cases testing (missing data, invalid inputs)

---

## 📞 Support & Feedback

**How to Report Issues:**
1. Describe what you were trying to do
2. What actually happened
3. Any error messages (screenshot)
4. Browser and device used
5. Steps to reproduce

**How to Request Features:**
1. Describe the feature
2. Explain the use case
3. Priority (critical, nice-to-have)
4. Any specific requirements

---

**OPTION 2 TESTING GUIDE READY! ✅**

Please test the system and provide feedback before proceeding to Option 3 (seeding).

**Current Status:**
- ✅ Option 1: Form approval workflow UI - COMPLETE
- 🧪 Option 2: Testing & feedback - IN PROGRESS
- ⏳ Option 3: Manual seeding via API - READY TO RUN

**Next Command (after testing):**
```bash
# Run this when ready to seed templates
curl -X POST http://localhost:3000/api/admin/seed-form-templates
```
