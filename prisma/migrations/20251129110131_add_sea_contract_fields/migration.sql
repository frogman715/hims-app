-- CreateEnum
CREATE TYPE "SeaType" AS ENUM ('KOREA', 'BAHAMAS_PANAMA', 'TANKER_LUNDQVIST', 'OTHER');

-- AlterTable
ALTER TABLE "EmploymentContract" ADD COLUMN     "cbaReference" TEXT,
ADD COLUMN     "guaranteedOTHours" INTEGER,
ADD COLUMN     "homeAllotment" DOUBLE PRECISION,
ADD COLUMN     "maritimeLaw" TEXT,
ADD COLUMN     "onboardAllowance" DOUBLE PRECISION,
ADD COLUMN     "overtimeRate" TEXT,
ADD COLUMN     "seaType" "SeaType",
ADD COLUMN     "specialAllowance" DOUBLE PRECISION,
ADD COLUMN     "templateVersion" TEXT,
ADD COLUMN     "wageScaleHeaderId" TEXT;

-- AddForeignKey
ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_wageScaleHeaderId_fkey" FOREIGN KEY ("wageScaleHeaderId") REFERENCES "WageScaleHeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;
