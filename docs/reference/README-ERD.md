# HIMS - FULL TEXTUAL ERD (SUPER DETAIL)

(VERSI RESMI UNTUK DEVELOPER & CODE AI)
(COCOK UNTUK .cursorrules, README, atau prompt perintah AI)

## 1. SECURITY MODULE
**User**
- id (PK, int, autoincrement)
- email (string, unique)
- name (string)
- passwordHash (string)
- createdAt (datetime)
- updatedAt (datetime)

**Role**
- id (PK)
- name (string, unique)

**UserRole**
- userId (FK → User.id)
- roleId (FK → Role.id)
- PRIMARY KEY (userId, roleId)

## 2. PRINCIPAL & VESSEL MODULE
**Principal**
- id (PK)
- name (string)
- address (string)

**Vessel**
- id (PK)
- name (string)
- principalId (FK → Principal.id)

## 3. SEAFARER MASTER MODULE
**Seafarer**
- id (PK)
- fullName (string)
- dateOfBirth (datetime, optional)
- nationality (string)
- createdAt (datetime)
- updatedAt (datetime)

## 4. SEAFARER DOCUMENT MODULE
**SeafarerDocument**
- id (PK)
- seafarerId (FK → Seafarer.id)
- docType (string) - examples: Passport, COC, COP, BST, GOC, Medical, Visa, Buku Pelaut, etc
- docNumber (string)
- issueDate (datetime)
- expiryDate (datetime)
- remarks (string)

## 5. APPLICATION MODULE (CR-02)
**Application**
- id (PK)
- seafarerId (FK → Seafarer.id)
- appliedRank (string)
- appliedOn (datetime)
- status (string: PENDING / APPROVED / REJECTED)

## 6. INTERVIEW MODULE (CR-09)
**Interview**
- id (PK)
- applicationId (FK → Application.id, unique)
- interviewedOn (datetime)
- result (string)
- comments (string)

## 7. ASSIGNMENT MODULE (ONBOARD CONTRACT)
**Assignment**
- id (PK)
- seafarerId (FK → Seafarer.id)
- vesselId (FK → Vessel.id)
- principalId (FK → Principal.id)
- rank (string)
- signOnDate (datetime)
- signOffPlan (datetime)
- signOffDate (datetime, optional)
- status (string: PLANNED / ONBOARD / COMPLETED)

## 8. ON/OFF SIGNING (CR-17)
**OnOffNotice**
- id (PK)
- assignmentId (FK → Assignment.id)
- type (string: ON / OFF)
- date (datetime)
- location (string)

## 9. COMPLAINT MODULE (CR-11)
**Complaint**
- id (PK)
- assignmentId (FK → Assignment.id)
- seafarerId (FK → Seafarer.id)
- description (string)
- createdAt (datetime)

## 🟦 QUICK RELATION SUMMARY (UNTUK AI)
```
User 1---N UserRole N---1 Role
Principal 1---N Vessel
Principal 1---N Assignment
Vessel 1---N Assignment
Seafarer 1---N SeafarerDocument
Seafarer 1---N Application
Seafarer 1---N Assignment
Seafarer 1---N Complaint
Application 1---1 Interview
Assignment 1---N OnOffNotice
Assignment 1---N Complaint
```

## 🟩 Suitable USE CASES

Gunakan ini saat AI perlu:
- membuat API (Next.js route handlers)
- page Index / List / Details
- query Prisma
- migrasi schema
- dashboard logic
- CRUD crewing/HR modules
- validation (Zod/Yup)
- Tailwind table components

## 🟪 AUTO PROMPT UNTUK AI (VERSI SINGKAT)

This project uses the following ERD:
```
User ↔ Role (many-to-many)
Principal → Vessel → Assignment → Seafarer
Seafarer → Documents, Applications → Interview
Assignment → OnOffNotice, Complaint
```
Refer to textual ERD in project root for all field definitions.
All code must respect this structure and naming.

## 📊 DASHBOARD METRICS

Based on this ERD, the dashboard shows:
- **Crew Ready**: Assignments with status = 'PLANNED'
- **Crew On Board**: Assignments with status = 'ONBOARD'
- **Expired Documents**: SeafarerDocuments with expiryDate < today
- **Expired Contracts**: Assignments with status = 'ONBOARD' AND signOffPlan < today
- **Pending Tasks**: Applications with status = 'PENDING' + total Complaints

## 🚀 DEVELOPMENT NOTES

- All dates are stored as DateTime in database
- Required fields: signOnDate, signOffPlan (Assignment), issueDate, expiryDate (SeafarerDocument)
- Optional fields: dateOfBirth (Seafarer), signOffDate (Assignment), remarks (SeafarerDocument)
- Status enums are validated in application code
- Foreign key relationships must be maintained for data integrity