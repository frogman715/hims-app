# Routing Segregation Smoke Test

Use the seeded accounts below to confirm desktop/mobile isolation before every release.

## Office Scenario (DIRECTOR)
1. Sign in as `admin@hanmarine.com` / `admin123`.
2. Verify landing path is `/dashboard`.
3. Navigate through `/crewing`, `/accounting`, `/contracts`, and `/hr`.
4. Use each "Back to Dashboard" action or browser back button; ensure the app returns to `/dashboard` (never `/` or `/m/crew`).
5. Manually enter `/m/crew` in the address bar; confirm an immediate redirect back to `/dashboard`.

## Crew Scenario (CREW_PORTAL)
1. Sign in as `crew.portal@example.com` / `crew123` (or another crew-role account).
2. Verify landing path is `/m/crew`.
3. Tap Documents, Upload, and Profile from the mobile bottom navigation; ensure URLs stay under `/m/crew/**`.
4. Attempt to visit `/dashboard` or `/crewing` directly; confirm immediate redirect back to `/m/crew`.
5. Use browser back from `/m/crew/profile`; confirm you remain inside the `/m/crew` area (no hop to `/dashboard`).

If any step fails, investigate layout guards (`requireUser`, `requireCrew`) or navigation links before shipping.
