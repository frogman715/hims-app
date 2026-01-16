-- Fix user names - remove role suffixes from names
-- Keep names clean, role display handled by getRoleDisplayName function

UPDATE "User" 
SET "name" = 'Arief' 
WHERE email = 'arief@hanmarine.co' AND "name" = 'Arief (Director)';

UPDATE "User" 
SET "name" = 'Rinaldy' 
WHERE email = 'rinaldy@hanmarine.co' AND "name" = 'Rinaldy (Director)';

UPDATE "User" 
SET "name" = 'Dino' 
WHERE email = 'dino@hanmarine.co' AND "name" = 'Dino (Accounting)';

UPDATE "User" 
SET "name" = 'CDMO' 
WHERE email = 'cdmo@hanmarine.co' AND "name" = 'CDMO (Crew Document Management)';
