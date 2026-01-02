-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'EXPIRING_SOON', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NonconformityStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditCategoryType" AS ENUM ('DOCUMENT_VERIFICATION', 'PROCESS_COMPLIANCE', 'CREW_RECORD', 'TRAINING_REQUIREMENT', 'SAFETY_PROTOCOL', 'REGULATORY');

-- CreateTable
CREATE TABLE "QMSDocument" (
    "id" TEXT NOT NULL,
    "crewId" TEXT,
    "documentId" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "riskLevel" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "category" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QMSDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonconformityRecord" (
    "id" TEXT NOT NULL,
    "crewId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" "NonconformityStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "findings" TEXT,
    "correctiveAction" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "verifiedBy" TEXT,
    "verificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonconformityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonconformityAuditLog" (
    "id" TEXT NOT NULL,
    "nonconformityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "comment" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NonconformityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" TEXT NOT NULL,
    "category" "AuditCategoryType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "event" TEXT NOT NULL,
    "description" TEXT,
    "changesSummary" TEXT,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "formula" TEXT,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trend" TEXT,
    "trendDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceMetricHistory" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceMetricHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QMSReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "sections" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metricsSnapshot" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QMSReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QMSDocument_crewId_idx" ON "QMSDocument"("crewId");

-- CreateIndex
CREATE INDEX "QMSDocument_status_idx" ON "QMSDocument"("status");

-- CreateIndex
CREATE INDEX "QMSDocument_riskLevel_idx" ON "QMSDocument"("riskLevel");

-- CreateIndex
CREATE INDEX "QMSDocument_expiresAt_idx" ON "QMSDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "NonconformityRecord_crewId_idx" ON "NonconformityRecord"("crewId");

-- CreateIndex
CREATE INDEX "NonconformityRecord_status_idx" ON "NonconformityRecord"("status");

-- CreateIndex
CREATE INDEX "NonconformityRecord_severity_idx" ON "NonconformityRecord"("severity");

-- CreateIndex
CREATE INDEX "NonconformityRecord_dueDate_idx" ON "NonconformityRecord"("dueDate");

-- CreateIndex
CREATE INDEX "NonconformityAuditLog_nonconformityId_idx" ON "NonconformityAuditLog"("nonconformityId");

-- CreateIndex
CREATE INDEX "NonconformityAuditLog_action_idx" ON "NonconformityAuditLog"("action");

-- CreateIndex
CREATE INDEX "NonconformityAuditLog_performedBy_idx" ON "NonconformityAuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "AuditTrail_entityType_idx" ON "AuditTrail"("entityType");

-- CreateIndex
CREATE INDEX "AuditTrail_category_idx" ON "AuditTrail"("category");

-- CreateIndex
CREATE INDEX "AuditTrail_severity_idx" ON "AuditTrail"("severity");

-- CreateIndex
CREATE INDEX "AuditTrail_createdAt_idx" ON "AuditTrail"("createdAt");

-- CreateIndex
CREATE INDEX "AuditTrail_userId_idx" ON "AuditTrail"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceMetric_name_key" ON "ComplianceMetric"("name");

-- CreateIndex
CREATE INDEX "ComplianceMetric_category_idx" ON "ComplianceMetric"("category");

-- CreateIndex
CREATE INDEX "ComplianceMetric_isActive_idx" ON "ComplianceMetric"("isActive");

-- CreateIndex
CREATE INDEX "ComplianceMetricHistory_metricId_idx" ON "ComplianceMetricHistory"("metricId");

-- CreateIndex
CREATE INDEX "ComplianceMetricHistory_calculatedAt_idx" ON "ComplianceMetricHistory"("calculatedAt");

-- CreateIndex
CREATE INDEX "QMSReport_reportType_idx" ON "QMSReport"("reportType");

-- CreateIndex
CREATE INDEX "QMSReport_status_idx" ON "QMSReport"("status");

-- CreateIndex
CREATE INDEX "QMSReport_periodStart_idx" ON "QMSReport"("periodStart");

-- CreateIndex
CREATE INDEX "QMSReport_approvedBy_idx" ON "QMSReport"("approvedBy");

-- AddForeignKey
ALTER TABLE "QMSDocument" ADD CONSTRAINT "QMSDocument_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QMSDocument" ADD CONSTRAINT "QMSDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CrewDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QMSDocument" ADD CONSTRAINT "QMSDocument_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonconformityRecord" ADD CONSTRAINT "NonconformityRecord_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonconformityRecord" ADD CONSTRAINT "NonconformityRecord_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonconformityRecord" ADD CONSTRAINT "NonconformityRecord_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonconformityAuditLog" ADD CONSTRAINT "NonconformityAuditLog_nonconformityId_fkey" FOREIGN KEY ("nonconformityId") REFERENCES "NonconformityRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonconformityAuditLog" ADD CONSTRAINT "NonconformityAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceMetricHistory" ADD CONSTRAINT "ComplianceMetricHistory_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "ComplianceMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QMSReport" ADD CONSTRAINT "QMSReport_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
