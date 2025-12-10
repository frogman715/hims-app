-- Add measurement and detailed emergency contact fields to Crew
ALTER TABLE "Crew"
    ADD COLUMN "heightCm" INTEGER,
    ADD COLUMN "weightKg" INTEGER,
    ADD COLUMN "coverallSize" TEXT,
    ADD COLUMN "shoeSize" TEXT,
    ADD COLUMN "waistSize" TEXT,
    ADD COLUMN "emergencyContactName" TEXT,
    ADD COLUMN "emergencyContactRelation" TEXT,
    ADD COLUMN "emergencyContactPhone" TEXT;
