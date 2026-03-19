# User Matrix - 2026-03-19

Source of truth: live PostgreSQL database on VPS.

## Active Accounts

| Email | Name | Role | System Admin | Login Status | Access Summary |
| --- | --- | --- | --- | --- | --- |
| `rinaldy@hanmarine.co` | Rinaldy (Director) | `DIRECTOR` | Yes | Active | Full access across all modules |
| `admin@hanmarine.co` | Admin HGI | `HR_ADMIN` | No | Active | HR administration and user management |
| `cdmo@hanmarine.co` | CDMO | `CDMO` | No | Active | Crewing, documents, contracts, compliance |
| `document@hanmarine.co` | Document Staff HGI | `CDMO` | No | Active | Crew document control and mobilization workflow |
| `operational@hanmarine.co` | Operational Staff HGI | `OPERATIONAL` | No | Active | Operations, dispatch, vessel workflow |
| `accounting@hanmarine.co` | Accounting HGI | `ACCOUNTING` | No | Active | Accounting, wage, financial workflow |
| `hr@hanmarine.co` | HR Officer | `HR` | No | Active | HR workflow and employee administration |
| `crew@hanmarine.co` | Crew Portal | `CREW_PORTAL` | No | Active | Crew self-service only |
| `auditor@hanmarine.co` | Quality Auditor | `QMR` | No | Active | Quality, audit, compliance oversight |

## Disabled Accounts

| Email | Name | Previous/Current Role | Login Status | Reason |
| --- | --- | --- | --- | --- |
| `arief@hanmarine.co` | Arief | `DIRECTOR` | Disabled | Duplicate leadership account |
| `director@hanmarine.co` | Director HGI | `DIRECTOR` | Disabled | Duplicate leadership account |
| `owner@hanmarine.co` | Owner HGI | `DIRECTOR` | Disabled | Duplicate leadership account |
| `dino@hanmarine.co` | Dino (Accounting) | `ACCOUNTING` | Disabled | Duplicate accounting account |

## Cleanup Summary

- Rotated passwords for all retained active accounts.
- Verified active accounts no longer match the known seeded default passwords.
- Changed `auditor@hanmarine.co` from `OPERATIONAL` to `QMR`.
- Kept only one primary accounting login and one primary director login plus one non-superadmin HR admin account.

## Notes

- Plaintext temporary passwords were intentionally not stored in this file.
- Role labels are based on the application permission model in `src/lib/permissions.ts`.
