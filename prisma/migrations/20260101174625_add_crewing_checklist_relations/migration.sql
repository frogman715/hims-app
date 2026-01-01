-- CreateEnum
CREATE TYPE "CrewingChecklistStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CrewingProcedure" (
    "id" TEXT NOT NULL,
    "procId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'Crewing',
    "phase" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stepsJson" JSONB NOT NULL,
    "responsibilities" TEXT[],
    "timeline" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "complianceStandards" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "CrewingProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewingChecklist" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "applicationId" TEXT,
    "crewId" TEXT,
    "checklistCode" TEXT NOT NULL,
    "status" "CrewingChecklistStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "itemsJson" JSONB NOT NULL,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewingDocumentRequirement" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "documentCode" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "minValidity" INTEGER,
    "acceptableIssuingCountries" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewingDocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrewingProcedure_procId_key" ON "CrewingProcedure"("procId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewingProcedure_code_key" ON "CrewingProcedure"("code");

-- CreateIndex
CREATE INDEX "CrewingProcedure_phase_idx" ON "CrewingProcedure"("phase");

-- CreateIndex
CREATE INDEX "CrewingProcedure_procId_idx" ON "CrewingProcedure"("procId");

-- CreateIndex
CREATE INDEX "CrewingProcedure_isActive_idx" ON "CrewingProcedure"("isActive");

-- CreateIndex
CREATE INDEX "CrewingChecklist_status_idx" ON "CrewingChecklist"("status");

-- CreateIndex
CREATE INDEX "CrewingChecklist_procedureId_idx" ON "CrewingChecklist"("procedureId");

-- CreateIndex
CREATE INDEX "CrewingChecklist_applicationId_idx" ON "CrewingChecklist"("applicationId");

-- CreateIndex
CREATE INDEX "CrewingChecklist_crewId_idx" ON "CrewingChecklist"("crewId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewingChecklist_procedureId_applicationId_crewId_key" ON "CrewingChecklist"("procedureId", "applicationId", "crewId");

-- CreateIndex
CREATE INDEX "CrewingDocumentRequirement_procedureId_idx" ON "CrewingDocumentRequirement"("procedureId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewingDocumentRequirement_procedureId_documentCode_key" ON "CrewingDocumentRequirement"("procedureId", "documentCode");

-- AddForeignKey
ALTER TABLE "CrewingProcedure" ADD CONSTRAINT "CrewingProcedure_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewingChecklist" ADD CONSTRAINT "CrewingChecklist_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "CrewingProcedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewingChecklist" ADD CONSTRAINT "CrewingChecklist_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewingChecklist" ADD CONSTRAINT "CrewingChecklist_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewingChecklist" ADD CONSTRAINT "CrewingChecklist_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewingChecklist" ADD CONSTRAINT "CrewingChecklist_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
