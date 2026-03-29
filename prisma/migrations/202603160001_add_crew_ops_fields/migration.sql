CREATE TYPE "CrewOperationalStatus" AS ENUM ('AVAILABLE', 'ON_BOARD', 'STANDBY', 'MEDICAL', 'DOCUMENT_ISSUE');

ALTER TABLE "Crew"
ADD COLUMN "crewCode" TEXT,
ADD COLUMN "crewStatus" "CrewOperationalStatus" NOT NULL DEFAULT 'AVAILABLE';

WITH ordered_crews AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS row_num
  FROM "Crew"
)
UPDATE "Crew"
SET "crewCode" = 'HGI-CRW-' || LPAD(ordered_crews.row_num::text, 4, '0')
FROM ordered_crews
WHERE "Crew"."id" = ordered_crews."id"
  AND "Crew"."crewCode" IS NULL;

CREATE UNIQUE INDEX "Crew_crewCode_key" ON "Crew"("crewCode");
CREATE INDEX "Crew_crewCode_idx" ON "Crew"("crewCode");
CREATE INDEX "Crew_crewStatus_idx" ON "Crew"("crewStatus");
