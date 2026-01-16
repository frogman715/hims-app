-- Final fix: ensure user names are clean without role suffixes
-- This corrects the display to show just names, with role handled by getRoleDisplayName function

UPDATE "User" 
SET "name" = 'Arief' 
WHERE "name" LIKE 'Arief%' AND "name" != 'Arief';

UPDATE "User" 
SET "name" = 'Rinaldy' 
WHERE "name" LIKE 'Rinaldy%' AND "name" != 'Rinaldy';

UPDATE "User" 
SET "name" = 'Dino' 
WHERE "name" LIKE 'Dino%' AND "name" != 'Dino';

UPDATE "User" 
SET "name" = 'CDMO' 
WHERE "name" LIKE 'CDMO%' AND "name" != 'CDMO';
