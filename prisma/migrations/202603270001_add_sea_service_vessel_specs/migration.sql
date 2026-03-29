-- Add structured vessel specification fields for sea service history completeness
ALTER TABLE "SeaServiceHistory"
ADD COLUMN "grt" INTEGER,
ADD COLUMN "engineOutput" TEXT;
