-- CreateEnum
CREATE TYPE "ComplianceSystemType" AS ENUM ('KOSMA_CERTIFICATE', 'DEPHUB_CERTIFICATE', 'SCHENGEN_VISA_NL');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentTypeCode" ADD VALUE 'SCHENGEN_VISA_NL';
ALTER TYPE "DocumentTypeCode" ADD VALUE 'DEPHUB_CERTIFICATE';

-- CreateTable
CREATE TABLE "ExternalCompliance" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "systemType" "ComplianceSystemType" NOT NULL,
    "certificateId" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "verificationUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalCompliance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExternalCompliance" ADD CONSTRAINT "ExternalCompliance_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
