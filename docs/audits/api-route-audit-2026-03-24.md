# API Route Audit

Generated: 2026-03-24T15:50:44.038Z

Total routes: 175
Unguarded routes: 0
Authenticated but weakly authorized routes: 48
Mutating routes missing schema validation: 129
Mutating routes missing audit logging: 110

## Full Matrix

| Route | Methods | Auth required | Authz enforced | Guard system | Schema validation | Sensitive response fields | Audit on mutating actions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| src/app/api/about/vision-mission/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/account/change-password/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | password | auditLog |
| src/app/api/accounting/office-expense/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/admin/audit-logs/route.ts | GET | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | N/A |
| src/app/api/admin/purchases/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/admin/seed-form-templates/route.ts | POST | Yes | Yes | getServerSession | None | email | Missing |
| src/app/api/admin/seed-users/route.ts | POST | Yes | Yes | Bearer token | None | email, password | Missing |
| src/app/api/admin/users/[id]/reset-password/route.ts | POST | Yes | Yes | getServerSession | None | email, password | auditLog |
| src/app/api/admin/users/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | auditLog |
| src/app/api/admin/users/[id]/status/route.ts | PATCH | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | auditLog |
| src/app/api/admin/users/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, password | auditLog |
| src/app/api/agency-fees/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/agency-fees/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/applications/[id]/route.ts | GET, PUT | Yes | No | getServerSession | No schema (manual/inline checks) | email, phone, passport | Missing |
| src/app/api/applications/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, phone | Missing |
| src/app/api/assignments/[id]/route.ts | GET, PUT | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/assignments/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/attendances/[id]/route.ts | GET, PUT, DELETE | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/attendances/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/audit/[id]/findings/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | createAudit helper |
| src/app/api/audit/[id]/nonconformities/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/audit/[id]/route.ts | GET, PUT | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/audit/list/route.ts | POST, GET | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | createAudit helper |
| src/app/api/audit/stats/route.ts | GET | Yes | No | getServerSession | None | None obvious | N/A |
| src/app/api/audits/[id]/findings/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/audits/[id]/report/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/audits/[id]/route.ts | GET, PUT | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/audits/dashboard/metrics/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/audits/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/auth/[...nextauth]/route.ts | - | Yes | No | NextAuth | None | None obvious | N/A |
| src/app/api/checklist/route.ts | GET | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/compliance/certifications/expiring/route.ts | GET | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/compliance/communication/[id]/route.ts | GET, PUT | Yes | Yes | withPermission | No schema (manual/inline checks) | email, phone | Missing |
| src/app/api/compliance/communication/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/compliance/enrollments/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/compliance/escalations/notify/route.ts | POST | Yes | Yes | withPermission, internal job token | None | None obvious | Missing |
| src/app/api/compliance/rest-hours/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | email | Missing |
| src/app/api/compliance/siuppak/route.ts | GET | Yes | Yes | withPermission | No schema (manual/inline checks) | email | N/A |
| src/app/api/compliance/stats/route.ts | GET | Yes | No | getServerSession | None | None obvious | N/A |
| src/app/api/compliance/trainings/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/contracts/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | passport, salary/wage | Missing |
| src/app/api/contracts/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | passport, salary/wage | Missing |
| src/app/api/crew-replacements/[id]/route.ts | PATCH | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/crew-replacements/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/crew-tasks/[id]/route.ts | GET, PATCH, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/crew-tasks/auto-create/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/crew-tasks/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/crew/[id]/route.ts | GET, PATCH, DELETE | Yes | Yes | withPermission | No schema (manual/inline checks) | email, medical | Missing |
| src/app/api/crew/bulk/route.ts | POST | Yes | Yes | withPermission | No schema (manual/inline checks) | email | Missing |
| src/app/api/crew/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | email | Missing |
| src/app/api/crewing/applications/[id]/transition/route.ts | POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | activityLog |
| src/app/api/crewing/checklists/[id]/route.ts | GET, PUT, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/crewing/checklists/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/crewing/data-quality/route.ts | GET | Yes | Yes | withPermission | None | email | N/A |
| src/app/api/crewing/documents/expiring/route.ts | GET | Yes | Yes | withPermission | No schema (manual/inline checks) | email, phone | N/A |
| src/app/api/crewing/documents/remind/route.ts | POST | Yes | Yes | withPermission | No schema (manual/inline checks) | email, phone | auditLog |
| src/app/api/crewing/form-reference/download/route.ts | GET | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/crewing/form-reference/generate/route.ts | GET | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/crewing/form-reference/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/crewing/overview/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/crewing/procedures/[id]/route.ts | GET | Yes | No | getServerSession | None | None obvious | N/A |
| src/app/api/crewing/procedures/route.ts | GET | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/crewing/reports/summary/route.ts | GET | Yes | Yes | withPermission | None | None obvious | N/A |
| src/app/api/crewing/seafarers/[id]/cv/route.ts | GET | Yes | Yes | withPermission | No schema (manual/inline checks) | email, phone | N/A |
| src/app/api/crewing/seafarers/[id]/photo/route.ts | POST | Yes | No | getServerSession | None | None obvious | Missing |
| src/app/api/crewing/seafarers/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | withPermission | zod safeParse, manual/inline checks | email | Missing |
| src/app/api/crewing/seafarers/route.ts | GET, POST | Yes | Yes | withPermission | zod safeParse, manual/inline checks | email | Missing |
| src/app/api/crewing/sign-off/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | phone | Missing |
| src/app/api/crewing/workflow/stats/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/dashboard/stats/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/disciplinary/[id]/route.ts | GET, PUT, DELETE | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/disciplinary/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/dispatches/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/document-receipts/route.ts | GET | Yes | Yes | withPermission | No schema (manual/inline checks) | email | N/A |
| src/app/api/documents/[id]/acknowledge/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/documents/[id]/approvals/[approvalId]/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/documents/[id]/delete/route.ts | DELETE | Yes | No | getServerSession | None | None obvious | Missing |
| src/app/api/documents/[id]/distribute/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/documents/[id]/history/route.ts | GET | Yes | No | getServerSession | None | None obvious | N/A |
| src/app/api/documents/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | None | None obvious | Missing |
| src/app/api/documents/[id]/submit-approval/route.ts | POST | Yes | No | getServerSession | None | None obvious | Missing |
| src/app/api/documents/[id]/update/route.ts | PUT | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/documents/create/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/documents/generate/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/documents/list/route.ts | GET | Yes | No | getServerSession | No schema (manual/inline checks) | email | N/A |
| src/app/api/documents/route.ts | GET, POST | Yes | Yes | withPermission | None | None obvious | Missing |
| src/app/api/employees/route.ts | GET | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/external-compliance/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/external-compliance/[id]/verify/route.ts | POST | Yes | No | getServerSession | None | None obvious | Missing |
| src/app/api/external-compliance/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/external-compliance/stats/route.ts | GET | Yes | Yes | withPermission | None | None obvious | N/A |
| src/app/api/files/[...path]/route.ts | GET | Yes | Yes | requireUserApi | None | email | N/A |
| src/app/api/form-submissions/[id]/approve/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/form-submissions/[id]/reject/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/form-submissions/[id]/request-changes/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/form-submissions/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, phone, passport | Missing |
| src/app/api/form-submissions/route.ts | GET | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/form-templates/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/forms/ac-01/[id]/route.ts | GET | Yes | No | getServerSession | None | email | N/A |
| src/app/api/forms/cr-01/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/forms/cr-02/[id]/route.ts | GET | Yes | No | getServerSession | None | email | N/A |
| src/app/api/forms/cr-02/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | activityLog |
| src/app/api/forms/cr-07/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/forms/cr-08/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/forms/cr-09/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/forms/cr-15/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/forms/cr-16/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, phone, passport | Missing |
| src/app/api/health/route.ts | GET | No | No | none | None | None obvious | N/A |
| src/app/api/hgf/documents/upload/route.ts | POST, GET | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | submission audit |
| src/app/api/hgf/forms/[formCode]/route.ts | GET, PUT, DELETE | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/hgf/forms/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/hgf/submissions/[submissionId]/approve/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | email | submission audit |
| src/app/api/hgf/submissions/[submissionId]/reject/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | email | submission audit |
| src/app/api/hgf/submissions/[submissionId]/route.ts | GET, PUT, DELETE | Yes | No | getServerSession | No schema (manual/inline checks) | email | submission audit |
| src/app/api/hgf/submissions/[submissionId]/submit/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | email | submission audit |
| src/app/api/hgf/submissions/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/hr/appraisals/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/hr/requisitions/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/insurance/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/insurance/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/integrations/link-finding-cpar/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/integrations/link-risk-nonconformance/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/integrations/qms-status/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/interviews/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | phone | Missing |
| src/app/api/mobile/crew/upload/route.ts | POST | Yes | Yes | requireUserApi | None | email | Missing |
| src/app/api/national-holidays/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/national-holidays/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/nonconformity/[id]/corrective-actions/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/nonconformity/[id]/route.ts | GET, GET, PUT, PUT | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/nonconformity/list/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/orientations/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/prepare-joining/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, phone, passport | Missing |
| src/app/api/prepare-joining/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, phone | Missing |
| src/app/api/principals/[id]/route.ts | PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/principals/[id]/vessels/route.ts | GET | Yes | No | getServerSession | None | None obvious | N/A |
| src/app/api/principals/route.ts | GET, POST, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/qms/analytics/alerts/route.ts | GET | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/qms/analytics/dashboard/route.ts | GET | Yes | Yes | requireQmsApiAccess | None | None obvious | N/A |
| src/app/api/qms/analytics/trends/route.ts | GET | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/qms/audit-trail/route.ts | GET, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | auditTrail |
| src/app/api/qms/documents/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | auditTrail |
| src/app/api/qms/documents/route.ts | GET, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | auditTrail |
| src/app/api/qms/metrics/route.ts | GET, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/qms/nonconformities/[id]/route.ts | GET, PUT, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | auditTrail, nonconformityAuditLog |
| src/app/api/qms/nonconformities/route.ts | GET, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | auditTrail |
| src/app/api/qms/reports/[id]/distributions/route.ts | GET, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | Missing |
| src/app/api/qms/reports/[id]/export/route.ts | GET, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | Missing |
| src/app/api/qms/reports/execute-distributions/route.ts | GET, POST | Yes | No | Bearer token, internal job token | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/qms/reports/route.ts | GET, POST | Yes | Yes | requireQmsApiAccess | No schema (manual/inline checks) | email | auditTrail |
| src/app/api/quality/forms/generate/route.ts | POST | Yes | No | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/quality/qmr/stats/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/quality/qmr/tasks/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/recruitments/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, phone | Missing |
| src/app/api/recruitments/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email, phone | Missing |
| src/app/api/risks/[id]/actions/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/risks/[id]/review/route.ts | POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/risks/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/risks/dashboard/metrics/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/risks/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/seafarers/[id]/biodata/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/seafarers/[id]/document-receipts/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/seafarers/[id]/documents/route.ts | GET | Yes | Yes | getServerSession | None | None obvious | N/A |
| src/app/api/seafarers/[id]/route.ts | GET, PUT | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/seafarers/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/seafarers/search/route.ts | GET | Yes | Yes | withPermission | No schema (manual/inline checks) | email | N/A |
| src/app/api/supplier/[id]/audits/route.ts | POST, GET | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/supplier/[id]/compliance/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/supplier/[id]/route.ts | GET, PUT | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/supplier/list/route.ts | GET, POST | Yes | No | getServerSession | No schema (manual/inline checks) | email | Missing |
| src/app/api/supplier/performance/route.ts | GET | Yes | No | getServerSession | No schema (manual/inline checks) | None obvious | N/A |
| src/app/api/supplier/stats/route.ts | GET | Yes | No | getServerSession | None | None obvious | N/A |
| src/app/api/vessels/[id]/route.ts | GET, PUT, DELETE | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/vessels/route.ts | GET, POST | Yes | Yes | getServerSession | No schema (manual/inline checks) | None obvious | Missing |
| src/app/api/wage-scales/route.ts | GET, POST | Yes | Yes | withPermission | No schema (manual/inline checks) | None obvious | Missing |

## 1. Unguarded Routes

- None

## 2. Authenticated But Weakly Authorized Routes

-   src/app/api/account/change-password/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=auditLog :: sensitive=password
-   src/app/api/applications/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/attendances/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audit/[id]/findings/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=createAudit helper :: sensitive=none obvious
-   src/app/api/audit/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audit/stats/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/certifications/expiring/route.ts :: methods=GET :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/enrollments/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/stats/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/trainings/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-replacements/[id]/route.ts :: methods=PATCH :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-replacements/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/checklists/[id]/route.ts :: methods=GET, PUT, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/checklists/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/procedures/[id]/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/procedures/route.ts :: methods=GET :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/seafarers/[id]/photo/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/disciplinary/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/acknowledge/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/approvals/[approvalId]/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/delete/route.ts :: methods=DELETE :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/distribute/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/history/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/submit-approval/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/update/route.ts :: methods=PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/create/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/list/route.ts :: methods=GET :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/external-compliance/[id]/verify/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/ac-01/[id]/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=email
-   src/app/api/forms/cr-02/[id]/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=email
-   src/app/api/hgf/documents/upload/route.ts :: methods=POST, GET :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=none obvious
-   src/app/api/hgf/forms/[formCode]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hgf/forms/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hgf/submissions/[submissionId]/approve/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/[submissionId]/reject/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/[submissionId]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/[submissionId]/submit/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/principals/[id]/vessels/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/qms/reports/execute-distributions/route.ts :: methods=GET, POST :: guard=Bearer token, internal job token :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/quality/forms/generate/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/quality/qmr/tasks/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/[id]/audits/route.ts :: methods=POST, GET :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/[id]/compliance/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/list/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/supplier/performance/route.ts :: methods=GET :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/stats/route.ts :: methods=GET :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious

## 3. Routes Missing Schema Validation

-   src/app/api/about/vision-mission/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/account/change-password/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=auditLog :: sensitive=password
-   src/app/api/accounting/office-expense/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/admin/purchases/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/admin/seed-form-templates/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=email
-   src/app/api/admin/seed-users/route.ts :: methods=POST :: guard=Bearer token :: validation=none :: audit=missing :: sensitive=email, password
-   src/app/api/admin/users/[id]/reset-password/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=auditLog :: sensitive=email, password
-   src/app/api/admin/users/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=auditLog :: sensitive=email
-   src/app/api/admin/users/[id]/status/route.ts :: methods=PATCH :: guard=getServerSession :: validation=manual/inline checks :: audit=auditLog :: sensitive=email
-   src/app/api/admin/users/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=auditLog :: sensitive=email, password
-   src/app/api/agency-fees/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/agency-fees/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/applications/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/applications/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/assignments/[id]/route.ts :: methods=GET, PUT :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/assignments/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/attendances/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/attendances/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audit/[id]/findings/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=createAudit helper :: sensitive=none obvious
-   src/app/api/audit/[id]/nonconformities/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audit/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audit/list/route.ts :: methods=POST, GET :: guard=getServerSession :: validation=manual/inline checks :: audit=createAudit helper :: sensitive=none obvious
-   src/app/api/audits/[id]/findings/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audits/[id]/report/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/audits/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audits/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/communication/[id]/route.ts :: methods=GET, PUT :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/compliance/communication/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/enrollments/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/escalations/notify/route.ts :: methods=POST :: guard=withPermission, internal job token :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/rest-hours/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/compliance/trainings/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/contracts/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=passport, salary/wage
-   src/app/api/contracts/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=passport, salary/wage
-   src/app/api/crew-replacements/[id]/route.ts :: methods=PATCH :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-replacements/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-tasks/[id]/route.ts :: methods=GET, PATCH, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-tasks/auto-create/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-tasks/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crew/[id]/route.ts :: methods=GET, PATCH, DELETE :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email, medical
-   src/app/api/crew/bulk/route.ts :: methods=POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crew/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crewing/applications/[id]/transition/route.ts :: methods=POST :: guard=withPermission :: validation=manual/inline checks :: audit=activityLog :: sensitive=none obvious
-   src/app/api/crewing/checklists/[id]/route.ts :: methods=GET, PUT, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/checklists/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/documents/remind/route.ts :: methods=POST :: guard=withPermission :: validation=manual/inline checks :: audit=auditLog :: sensitive=email, phone
-   src/app/api/crewing/seafarers/[id]/photo/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/sign-off/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=phone
-   src/app/api/disciplinary/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/disciplinary/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/acknowledge/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/approvals/[approvalId]/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/delete/route.ts :: methods=DELETE :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/distribute/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/submit-approval/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/update/route.ts :: methods=PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/create/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/generate/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/route.ts :: methods=GET, POST :: guard=withPermission :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/external-compliance/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/external-compliance/[id]/verify/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/external-compliance/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/form-submissions/[id]/approve/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/form-submissions/[id]/reject/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/form-submissions/[id]/request-changes/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/form-submissions/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/form-templates/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-01/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-02/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=activityLog :: sensitive=email
-   src/app/api/forms/cr-07/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/forms/cr-08/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-09/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/forms/cr-15/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-16/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/hgf/documents/upload/route.ts :: methods=POST, GET :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=none obvious
-   src/app/api/hgf/forms/[formCode]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hgf/forms/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hgf/submissions/[submissionId]/approve/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/[submissionId]/reject/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/[submissionId]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/[submissionId]/submit/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=submission audit :: sensitive=email
-   src/app/api/hgf/submissions/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hr/appraisals/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hr/requisitions/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/insurance/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/insurance/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/integrations/link-finding-cpar/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/integrations/link-risk-nonconformance/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/interviews/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=phone
-   src/app/api/mobile/crew/upload/route.ts :: methods=POST :: guard=requireUserApi :: validation=none :: audit=missing :: sensitive=email
-   src/app/api/national-holidays/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/national-holidays/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/nonconformity/[id]/corrective-actions/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/nonconformity/[id]/route.ts :: methods=GET, GET, PUT, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/orientations/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/prepare-joining/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/prepare-joining/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/principals/[id]/route.ts :: methods=PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/principals/route.ts :: methods=GET, POST, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/qms/audit-trail/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=auditTrail :: sensitive=email
-   src/app/api/qms/documents/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=auditTrail :: sensitive=email
-   src/app/api/qms/documents/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=auditTrail :: sensitive=email
-   src/app/api/qms/metrics/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/qms/nonconformities/[id]/route.ts :: methods=GET, PUT, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=auditTrail, nonconformityAuditLog :: sensitive=email
-   src/app/api/qms/nonconformities/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=auditTrail :: sensitive=email
-   src/app/api/qms/reports/[id]/distributions/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/qms/reports/[id]/export/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/qms/reports/execute-distributions/route.ts :: methods=GET, POST :: guard=Bearer token, internal job token :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/qms/reports/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=auditTrail :: sensitive=email
-   src/app/api/quality/forms/generate/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/quality/qmr/tasks/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/recruitments/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/recruitments/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/risks/[id]/actions/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/risks/[id]/review/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/risks/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/risks/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/seafarers/[id]/document-receipts/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/seafarers/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/seafarers/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/supplier/[id]/audits/route.ts :: methods=POST, GET :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/[id]/compliance/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/list/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/vessels/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/vessels/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/wage-scales/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious

## 4. Routes Missing Audit Logging

-   src/app/api/about/vision-mission/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/accounting/office-expense/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/admin/purchases/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/admin/seed-form-templates/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=email
-   src/app/api/admin/seed-users/route.ts :: methods=POST :: guard=Bearer token :: validation=none :: audit=missing :: sensitive=email, password
-   src/app/api/agency-fees/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/agency-fees/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/applications/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/applications/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/assignments/[id]/route.ts :: methods=GET, PUT :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/assignments/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/attendances/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/attendances/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audit/[id]/nonconformities/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audit/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audits/[id]/findings/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audits/[id]/report/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/audits/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/audits/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/communication/[id]/route.ts :: methods=GET, PUT :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/compliance/communication/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/enrollments/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/escalations/notify/route.ts :: methods=POST :: guard=withPermission, internal job token :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/compliance/rest-hours/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/compliance/trainings/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/contracts/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=passport, salary/wage
-   src/app/api/contracts/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=passport, salary/wage
-   src/app/api/crew-replacements/[id]/route.ts :: methods=PATCH :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-replacements/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-tasks/[id]/route.ts :: methods=GET, PATCH, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-tasks/auto-create/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crew-tasks/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crew/[id]/route.ts :: methods=GET, PATCH, DELETE :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email, medical
-   src/app/api/crew/bulk/route.ts :: methods=POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crew/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crewing/checklists/[id]/route.ts :: methods=GET, PUT, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/checklists/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/seafarers/[id]/photo/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/crewing/seafarers/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=withPermission :: validation=zod safeParse, manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crewing/seafarers/route.ts :: methods=GET, POST :: guard=withPermission :: validation=zod safeParse, manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/crewing/sign-off/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=phone
-   src/app/api/disciplinary/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/disciplinary/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/acknowledge/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/approvals/[approvalId]/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/delete/route.ts :: methods=DELETE :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/distribute/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/submit-approval/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/[id]/update/route.ts :: methods=PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/create/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/generate/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/documents/route.ts :: methods=GET, POST :: guard=withPermission :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/external-compliance/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/external-compliance/[id]/verify/route.ts :: methods=POST :: guard=getServerSession :: validation=none :: audit=missing :: sensitive=none obvious
-   src/app/api/external-compliance/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/form-submissions/[id]/approve/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/form-submissions/[id]/reject/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/form-submissions/[id]/request-changes/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/form-submissions/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/form-templates/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-01/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-07/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/forms/cr-08/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-09/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/forms/cr-15/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/cr-16/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/hgf/forms/[formCode]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hgf/forms/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hgf/submissions/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hr/appraisals/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/hr/requisitions/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/insurance/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/insurance/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/integrations/link-finding-cpar/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/integrations/link-risk-nonconformance/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/interviews/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=phone
-   src/app/api/mobile/crew/upload/route.ts :: methods=POST :: guard=requireUserApi :: validation=none :: audit=missing :: sensitive=email
-   src/app/api/national-holidays/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/national-holidays/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/nonconformity/[id]/corrective-actions/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/nonconformity/[id]/route.ts :: methods=GET, GET, PUT, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/orientations/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/prepare-joining/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone, passport
-   src/app/api/prepare-joining/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/principals/[id]/route.ts :: methods=PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/principals/route.ts :: methods=GET, POST, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/qms/metrics/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/qms/reports/[id]/distributions/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/qms/reports/[id]/export/route.ts :: methods=GET, POST :: guard=requireQmsApiAccess :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/qms/reports/execute-distributions/route.ts :: methods=GET, POST :: guard=Bearer token, internal job token :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/quality/forms/generate/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/quality/qmr/tasks/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/recruitments/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/recruitments/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email, phone
-   src/app/api/risks/[id]/actions/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/risks/[id]/review/route.ts :: methods=POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/risks/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/risks/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/seafarers/[id]/document-receipts/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/seafarers/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/seafarers/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/supplier/[id]/audits/route.ts :: methods=POST, GET :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/[id]/compliance/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/[id]/route.ts :: methods=GET, PUT :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/supplier/list/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=email
-   src/app/api/vessels/[id]/route.ts :: methods=GET, PUT, DELETE :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/vessels/route.ts :: methods=GET, POST :: guard=getServerSession :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious
-   src/app/api/wage-scales/route.ts :: methods=GET, POST :: guard=withPermission :: validation=manual/inline checks :: audit=missing :: sensitive=none obvious