-- CreateEnum
CREATE TYPE "DataSensitivity" AS ENUM ('GREEN', 'AMBER', 'RED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'HR';
ALTER TYPE "Role" ADD VALUE 'CREW_PORTAL';

-- CreateTable
CREATE TABLE "AgencyAgreement" (
    "id" TEXT NOT NULL,
    "principalName" TEXT NOT NULL,
    "principalAddress" TEXT,
    "agentName" TEXT NOT NULL DEFAULT 'PT HANMARINE GLOBAL INDONESIA',
    "agentAddress" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "agreementNumber" TEXT,
    "cbaReference" TEXT,
    "pniClub" TEXT,
    "notes" TEXT,
    "terminationConditions" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyAgreementVessel" (
    "id" TEXT NOT NULL,
    "agencyAgreementId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,

    CONSTRAINT "AgencyAgreementVessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WageScaleHeader" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "agencyAgreementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WageScaleHeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WageScaleItem" (
    "id" TEXT NOT NULL,
    "wageScaleHeaderId" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WageScaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplineRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "penalty" TEXT NOT NULL,
    "maxPenalty" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplineRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaryCase" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "disciplineRuleId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "witnesses" TEXT,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INVESTIGATING',
    "resolution" TEXT,
    "penaltyApplied" TEXT,
    "appealDate" TIMESTAMP(3),
    "appealOutcome" TEXT,
    "vesselId" TEXT,
    "reportedById" TEXT NOT NULL,
    "investigatedById" TEXT,
    "agencyAgreementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinaryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyAgreementVessel_agencyAgreementId_vesselId_key" ON "AgencyAgreementVessel"("agencyAgreementId", "vesselId");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplineRule_code_key" ON "DisciplineRule"("code");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "AgencyAgreementVessel" ADD CONSTRAINT "AgencyAgreementVessel_agencyAgreementId_fkey" FOREIGN KEY ("agencyAgreementId") REFERENCES "AgencyAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyAgreementVessel" ADD CONSTRAINT "AgencyAgreementVessel_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WageScaleHeader" ADD CONSTRAINT "WageScaleHeader_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WageScaleHeader" ADD CONSTRAINT "WageScaleHeader_agencyAgreementId_fkey" FOREIGN KEY ("agencyAgreementId") REFERENCES "AgencyAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WageScaleItem" ADD CONSTRAINT "WageScaleItem_wageScaleHeaderId_fkey" FOREIGN KEY ("wageScaleHeaderId") REFERENCES "WageScaleHeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryCase" ADD CONSTRAINT "DisciplinaryCase_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryCase" ADD CONSTRAINT "DisciplinaryCase_disciplineRuleId_fkey" FOREIGN KEY ("disciplineRuleId") REFERENCES "DisciplineRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryCase" ADD CONSTRAINT "DisciplinaryCase_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryCase" ADD CONSTRAINT "DisciplinaryCase_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryCase" ADD CONSTRAINT "DisciplinaryCase_investigatedById_fkey" FOREIGN KEY ("investigatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryCase" ADD CONSTRAINT "DisciplinaryCase_agencyAgreementId_fkey" FOREIGN KEY ("agencyAgreementId") REFERENCES "AgencyAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
