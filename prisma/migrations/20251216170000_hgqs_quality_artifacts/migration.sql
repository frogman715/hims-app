-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QualityDocumentStatus') THEN
        CREATE TYPE "QualityDocumentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSOLETE');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AcknowledgementStatus') THEN
        CREATE TYPE "AcknowledgementStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'REVOKED');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
        CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'SICK', 'EMERGENCY_LEAVE', 'ABSENT', 'WORK_FROM_HOME', 'ON_LEAVE');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveType') THEN
        CREATE TYPE "LeaveType" AS ENUM ('SICK', 'EMERGENCY', 'ANNUAL', 'UNPAID', 'OTHER');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveStatus') THEN
        CREATE TYPE "LeaveStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisciplinarySeverity') THEN
        CREATE TYPE "DisciplinarySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisciplinaryCaseStatus') THEN
        CREATE TYPE "DisciplinaryCaseStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PermissionAccessLevel') THEN
        CREATE TYPE "PermissionAccessLevel" AS ENUM ('NO_ACCESS', 'VIEW_ACCESS', 'EDIT_ACCESS', 'FULL_ACCESS');
    END IF;
END $$;

-- AlterEnum
DO $$
BEGIN
    ALTER TYPE "ComplianceSystemType" ADD VALUE 'KOSMA_CERTIFICATE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromStatus" "WorkflowStatus",
    "toStatus" "WorkflowStatus" NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadataJson" JSONB,
    "oldValuesJson" JSONB,
    "newValuesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleModulePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "level" "PermissionAccessLevel" NOT NULL DEFAULT 'NO_ACCESS',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsManualVersion" (
    "id" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revisionNumber" TEXT NOT NULL,
    "status" "QualityDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveDate" TIMESTAMP(3),
    "fileUrl" TEXT NOT NULL,
    "summary" TEXT,
    "createdById" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "workflowId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsManualVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsProcedure" (
    "id" TEXT NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "controlNumber" TEXT,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "status" "QualityDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "workflowId" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsGuideline" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "QualityDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "acknowledgementRequired" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsGuidelineAssignment" (
    "id" TEXT NOT NULL,
    "guidelineId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "assignedToRole" "Role",
    "dueDate" TIMESTAMP(3),
    "note" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsGuidelineAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsPolicyAcknowledgement" (
    "id" TEXT NOT NULL,
    "guidelineId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "status" "AcknowledgementStatus" NOT NULL DEFAULT 'PENDING',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "signature" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsPolicyAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsAttendanceLog" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsAttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsLeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedById" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HgqsDisciplinaryCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reportedAgainstId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentSummary" TEXT NOT NULL,
    "severity" "DisciplinarySeverity" NOT NULL DEFAULT 'LOW',
    "status" "DisciplinaryCaseStatus" NOT NULL DEFAULT 'OPEN',
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "visibleToRoles" "Role"[],
    "attachments" TEXT[],
    "resolution" TEXT,
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HgqsDisciplinaryCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowTransition_workflowId_idx" ON "WorkflowTransition"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_actorId_idx" ON "WorkflowTransition"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RoleModulePermission_moduleKey_idx" ON "RoleModulePermission"("moduleKey");

-- CreateIndex
CREATE INDEX "RoleModulePermission_role_idx" ON "RoleModulePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RoleModulePermission_role_moduleKey_key" ON "RoleModulePermission"("role", "moduleKey");

-- CreateIndex
CREATE INDEX "HgqsManualVersion_status_idx" ON "HgqsManualVersion"("status");

-- CreateIndex
CREATE INDEX "HgqsManualVersion_createdById_idx" ON "HgqsManualVersion"("createdById");

-- CreateIndex
CREATE INDEX "HgqsManualVersion_workflowId_idx" ON "HgqsManualVersion"("workflowId");

-- CreateIndex
CREATE INDEX "HgqsManualVersion_effectiveDate_idx" ON "HgqsManualVersion"("effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "HgqsManualVersion_docNumber_revisionNumber_key" ON "HgqsManualVersion"("docNumber", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HgqsProcedure_procedureCode_key" ON "HgqsProcedure"("procedureCode");

-- CreateIndex
CREATE INDEX "HgqsProcedure_status_idx" ON "HgqsProcedure"("status");

-- CreateIndex
CREATE INDEX "HgqsProcedure_createdById_idx" ON "HgqsProcedure"("createdById");

-- CreateIndex
CREATE INDEX "HgqsProcedure_workflowId_idx" ON "HgqsProcedure"("workflowId");

-- CreateIndex
CREATE INDEX "HgqsProcedure_relatedEntityType_relatedEntityId_idx" ON "HgqsProcedure"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "HgqsGuideline_slug_key" ON "HgqsGuideline"("slug");

-- CreateIndex
CREATE INDEX "HgqsGuideline_status_idx" ON "HgqsGuideline"("status");

-- CreateIndex
CREATE INDEX "HgqsGuideline_createdById_idx" ON "HgqsGuideline"("createdById");

-- CreateIndex
CREATE INDEX "HgqsGuideline_workflowId_idx" ON "HgqsGuideline"("workflowId");

-- CreateIndex
CREATE INDEX "HgqsGuidelineAssignment_guidelineId_idx" ON "HgqsGuidelineAssignment"("guidelineId");

-- CreateIndex
CREATE INDEX "HgqsGuidelineAssignment_assignedToRole_idx" ON "HgqsGuidelineAssignment"("assignedToRole");

-- CreateIndex
CREATE INDEX "HgqsGuidelineAssignment_assignedToUserId_idx" ON "HgqsGuidelineAssignment"("assignedToUserId");

-- CreateIndex
CREATE INDEX "HgqsGuidelineAssignment_status_idx" ON "HgqsGuidelineAssignment"("status");

-- CreateIndex
CREATE INDEX "HgqsGuidelineAssignment_createdById_idx" ON "HgqsGuidelineAssignment"("createdById");

-- CreateIndex
CREATE INDEX "HgqsPolicyAcknowledgement_assignmentId_idx" ON "HgqsPolicyAcknowledgement"("assignmentId");

-- CreateIndex
CREATE INDEX "HgqsPolicyAcknowledgement_status_idx" ON "HgqsPolicyAcknowledgement"("status");

-- CreateIndex
CREATE INDEX "HgqsPolicyAcknowledgement_createdById_idx" ON "HgqsPolicyAcknowledgement"("createdById");

-- CreateIndex
CREATE INDEX "HgqsPolicyAcknowledgement_workflowId_idx" ON "HgqsPolicyAcknowledgement"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "HgqsPolicyAcknowledgement_guidelineId_assigneeId_key" ON "HgqsPolicyAcknowledgement"("guidelineId", "assigneeId");

-- CreateIndex
CREATE INDEX "HgqsAttendanceLog_status_idx" ON "HgqsAttendanceLog"("status");

-- CreateIndex
CREATE INDEX "HgqsAttendanceLog_createdById_idx" ON "HgqsAttendanceLog"("createdById");

-- CreateIndex
CREATE INDEX "HgqsAttendanceLog_recordedById_idx" ON "HgqsAttendanceLog"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "HgqsAttendanceLog_employeeId_attendanceDate_key" ON "HgqsAttendanceLog"("employeeId", "attendanceDate");

-- CreateIndex
CREATE INDEX "HgqsLeaveRequest_employeeId_idx" ON "HgqsLeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "HgqsLeaveRequest_status_idx" ON "HgqsLeaveRequest"("status");

-- CreateIndex
CREATE INDEX "HgqsLeaveRequest_createdById_idx" ON "HgqsLeaveRequest"("createdById");

-- CreateIndex
CREATE INDEX "HgqsLeaveRequest_workflowId_idx" ON "HgqsLeaveRequest"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "HgqsDisciplinaryCase_caseNumber_key" ON "HgqsDisciplinaryCase"("caseNumber");

-- CreateIndex
CREATE INDEX "HgqsDisciplinaryCase_status_idx" ON "HgqsDisciplinaryCase"("status");

-- CreateIndex
CREATE INDEX "HgqsDisciplinaryCase_createdById_idx" ON "HgqsDisciplinaryCase"("createdById");

-- CreateIndex
CREATE INDEX "HgqsDisciplinaryCase_workflowId_idx" ON "HgqsDisciplinaryCase"("workflowId");

-- CreateIndex
CREATE INDEX "HgqsDisciplinaryCase_reportedAgainstId_idx" ON "HgqsDisciplinaryCase"("reportedAgainstId");

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleModulePermission" ADD CONSTRAINT "RoleModulePermission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsManualVersion" ADD CONSTRAINT "HgqsManualVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsManualVersion" ADD CONSTRAINT "HgqsManualVersion_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsManualVersion" ADD CONSTRAINT "HgqsManualVersion_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsManualVersion" ADD CONSTRAINT "HgqsManualVersion_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsProcedure" ADD CONSTRAINT "HgqsProcedure_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsProcedure" ADD CONSTRAINT "HgqsProcedure_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsProcedure" ADD CONSTRAINT "HgqsProcedure_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsGuideline" ADD CONSTRAINT "HgqsGuideline_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsGuideline" ADD CONSTRAINT "HgqsGuideline_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsGuideline" ADD CONSTRAINT "HgqsGuideline_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsGuidelineAssignment" ADD CONSTRAINT "HgqsGuidelineAssignment_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "HgqsGuideline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsGuidelineAssignment" ADD CONSTRAINT "HgqsGuidelineAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsGuidelineAssignment" ADD CONSTRAINT "HgqsGuidelineAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsGuidelineAssignment" ADD CONSTRAINT "HgqsGuidelineAssignment_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsPolicyAcknowledgement" ADD CONSTRAINT "HgqsPolicyAcknowledgement_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "HgqsGuideline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsPolicyAcknowledgement" ADD CONSTRAINT "HgqsPolicyAcknowledgement_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsPolicyAcknowledgement" ADD CONSTRAINT "HgqsPolicyAcknowledgement_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "HgqsGuidelineAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsPolicyAcknowledgement" ADD CONSTRAINT "HgqsPolicyAcknowledgement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsPolicyAcknowledgement" ADD CONSTRAINT "HgqsPolicyAcknowledgement_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsPolicyAcknowledgement" ADD CONSTRAINT "HgqsPolicyAcknowledgement_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsAttendanceLog" ADD CONSTRAINT "HgqsAttendanceLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsAttendanceLog" ADD CONSTRAINT "HgqsAttendanceLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsAttendanceLog" ADD CONSTRAINT "HgqsAttendanceLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsLeaveRequest" ADD CONSTRAINT "HgqsLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsLeaveRequest" ADD CONSTRAINT "HgqsLeaveRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsLeaveRequest" ADD CONSTRAINT "HgqsLeaveRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsLeaveRequest" ADD CONSTRAINT "HgqsLeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsLeaveRequest" ADD CONSTRAINT "HgqsLeaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsLeaveRequest" ADD CONSTRAINT "HgqsLeaveRequest_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsDisciplinaryCase" ADD CONSTRAINT "HgqsDisciplinaryCase_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsDisciplinaryCase" ADD CONSTRAINT "HgqsDisciplinaryCase_reportedAgainstId_fkey" FOREIGN KEY ("reportedAgainstId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsDisciplinaryCase" ADD CONSTRAINT "HgqsDisciplinaryCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsDisciplinaryCase" ADD CONSTRAINT "HgqsDisciplinaryCase_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HgqsDisciplinaryCase" ADD CONSTRAINT "HgqsDisciplinaryCase_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
