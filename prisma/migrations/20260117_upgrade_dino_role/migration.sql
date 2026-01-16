-- Upgrade Dino from ACCOUNTING to DIRECTOR role
-- This gives Dino same operational access as Rinaldy (crewing, documents, quality, etc.)
-- But NOT system admin access (isSystemAdmin remains false)

UPDATE "User" 
SET role = 'DIRECTOR' 
WHERE email = 'dino@hanmarine.co' AND role = 'ACCOUNTING';
