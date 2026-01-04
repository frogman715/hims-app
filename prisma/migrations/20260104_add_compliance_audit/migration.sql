-- CreateEnum
CREATE TYPE "ComplianceAuditStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditFindingType" AS ENUM ('NON_CONFORMITY', 'OBSERVATION', 'BEST_PRACTICE');

-- CreateEnum
CREATE TYPE "AuditFindingSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "AuditFindingStatus" AS ENUM ('OPEN', 'ADDRESSED', 'VERIFIED_CLOSED', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "ComplianceAudit" (
    "id" TEXT NOT NULL,
    "auditNumber" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "status" "ComplianceAuditStatus" NOT NULL DEFAULT 'PLANNED',
    "auditType" TEXT NOT NULL,
    "scope" TEXT,
    "objectives" TEXT,
    "auditCriteria" TEXT,
    "leadAuditorId" TEXT,
    "assistantAuditors" TEXT,
    "auditeeContactPerson" TEXT,
    "auditeeContactEmail" TEXT,
    "auditeeContactPhone" TEXT,
    "estimatedDuration" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "findings" INTEGER NOT NULL DEFAULT 0,
    "nonConformities" INTEGER NOT NULL DEFAULT 0,
    "observations" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAuditFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "findingType" "AuditFindingType" NOT NULL,
    "severity" "AuditFindingSeverity" NOT NULL,
    "status" "AuditFindingStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "requirement" TEXT,
    "evidence" TEXT,
    "rootCause" TEXT,
    "correctionAction" TEXT,
    "preventionAction" TEXT,
    "responsiblePersonId" TEXT,
    "targetCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "verificationDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceAuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonConformity" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "findingId" TEXT,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctionAction" TEXT,
    "preventionAction" TEXT,
    "targetDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "responsiblePersonId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NonConformity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceAudit_auditNumber_key" ON "ComplianceAudit"("auditNumber");

-- CreateIndex
CREATE INDEX "ComplianceAudit_status_idx" ON "ComplianceAudit"("status");

-- CreateIndex
CREATE INDEX "ComplianceAudit_auditType_idx" ON "ComplianceAudit"("auditType");

-- CreateIndex
CREATE INDEX "ComplianceAudit_leadAuditorId_idx" ON "ComplianceAudit"("leadAuditorId");

-- CreateIndex
CREATE INDEX "ComplianceAuditFinding_auditId_idx" ON "ComplianceAuditFinding"("auditId");

-- CreateIndex
CREATE INDEX "ComplianceAuditFinding_status_idx" ON "ComplianceAuditFinding"("status");

-- CreateIndex
CREATE INDEX "NonConformity_auditId_idx" ON "NonConformity"("auditId");

-- CreateIndex
CREATE INDEX "NonConformity_findingId_idx" ON "NonConformity"("findingId");

-- CreateIndex
CREATE INDEX "NonConformity_status_idx" ON "NonConformity"("status");

-- AddForeignKey
ALTER TABLE "ComplianceAuditFinding" ADD CONSTRAINT "ComplianceAuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "ComplianceAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "ComplianceAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "ComplianceAuditFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
