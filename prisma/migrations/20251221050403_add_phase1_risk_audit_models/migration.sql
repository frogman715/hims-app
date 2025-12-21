-- CreateEnum
CREATE TYPE "RiskSource" AS ENUM ('REGULATORY', 'OPERATIONAL', 'STRATEGIC', 'FINANCIAL', 'ENVIRONMENTAL');

-- CreateEnum
CREATE TYPE "RiskTreatmentStrategy" AS ENUM ('MITIGATE', 'ACCEPT', 'TRANSFER', 'AVOID');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('OBSERVATION', 'MINOR_NC', 'MAJOR_NC');

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" "RiskSource" NOT NULL,
    "probability" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "treatmentStrategy" "RiskTreatmentStrategy" NOT NULL,
    "treatmentPlan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAction" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskReview" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newProbability" INTEGER,
    "newImpact" INTEGER,
    "newRiskScore" INTEGER,
    "effectiveness" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,

    CONSTRAINT "RiskReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAuditLog" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedFields" JSONB NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSchedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "auditType" "AuditType" NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "auditees" TEXT[],
    "auditors" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditChecklist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clauses" TEXT[],
    "checkpoints" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "findingNumber" TEXT NOT NULL,
    "clause" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "evidence" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditReport" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "recommendations" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "AuditReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Risk_source_idx" ON "Risk"("source");

-- CreateIndex
CREATE INDEX "Risk_status_idx" ON "Risk"("status");

-- CreateIndex
CREATE INDEX "Risk_riskScore_idx" ON "Risk"("riskScore");

-- CreateIndex
CREATE INDEX "Risk_createdById_idx" ON "Risk"("createdById");

-- CreateIndex
CREATE INDEX "Risk_createdAt_idx" ON "Risk"("createdAt");

-- CreateIndex
CREATE INDEX "RiskAction_riskId_idx" ON "RiskAction"("riskId");

-- CreateIndex
CREATE INDEX "RiskAction_status_idx" ON "RiskAction"("status");

-- CreateIndex
CREATE INDEX "RiskAction_dueDate_idx" ON "RiskAction"("dueDate");

-- CreateIndex
CREATE INDEX "RiskAction_owner_idx" ON "RiskAction"("owner");

-- CreateIndex
CREATE INDEX "RiskReview_riskId_idx" ON "RiskReview"("riskId");

-- CreateIndex
CREATE INDEX "RiskReview_reviewDate_idx" ON "RiskReview"("reviewDate");

-- CreateIndex
CREATE INDEX "RiskReview_reviewedById_idx" ON "RiskReview"("reviewedById");

-- CreateIndex
CREATE INDEX "RiskAuditLog_riskId_idx" ON "RiskAuditLog"("riskId");

-- CreateIndex
CREATE INDEX "RiskAuditLog_changedAt_idx" ON "RiskAuditLog"("changedAt");

-- CreateIndex
CREATE INDEX "RiskAuditLog_action_idx" ON "RiskAuditLog"("action");

-- CreateIndex
CREATE INDEX "RiskAuditLog_changedById_idx" ON "RiskAuditLog"("changedById");

-- CreateIndex
CREATE INDEX "AuditSchedule_auditType_idx" ON "AuditSchedule"("auditType");

-- CreateIndex
CREATE INDEX "AuditSchedule_status_idx" ON "AuditSchedule"("status");

-- CreateIndex
CREATE INDEX "AuditSchedule_startDate_idx" ON "AuditSchedule"("startDate");

-- CreateIndex
CREATE INDEX "AuditChecklist_status_idx" ON "AuditChecklist"("status");

-- CreateIndex
CREATE INDEX "AuditChecklist_version_idx" ON "AuditChecklist"("version");

-- CreateIndex
CREATE INDEX "AuditFinding_scheduleId_idx" ON "AuditFinding"("scheduleId");

-- CreateIndex
CREATE INDEX "AuditFinding_severity_idx" ON "AuditFinding"("severity");

-- CreateIndex
CREATE INDEX "AuditFinding_status_idx" ON "AuditFinding"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AuditFinding_scheduleId_findingNumber_key" ON "AuditFinding"("scheduleId", "findingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AuditReport_scheduleId_key" ON "AuditReport"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditReport_reportNumber_key" ON "AuditReport"("reportNumber");

-- CreateIndex
CREATE INDEX "AuditReport_scheduleId_idx" ON "AuditReport"("scheduleId");

-- CreateIndex
CREATE INDEX "AuditReport_status_idx" ON "AuditReport"("status");

-- CreateIndex
CREATE INDEX "AuditReport_reportDate_idx" ON "AuditReport"("reportDate");

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAction" ADD CONSTRAINT "RiskAction_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAction" ADD CONSTRAINT "RiskAction_owner_fkey" FOREIGN KEY ("owner") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAuditLog" ADD CONSTRAINT "RiskAuditLog_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAuditLog" ADD CONSTRAINT "RiskAuditLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AuditSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReport" ADD CONSTRAINT "AuditReport_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AuditSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReport" ADD CONSTRAINT "AuditReport_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
