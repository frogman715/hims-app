-- CreateEnum
CREATE TYPE "HGFFormType" AS ENUM ('CHECKLIST', 'APPLICATION', 'VERIFICATION', 'TRAINING', 'DECLARATION');

-- CreateEnum
CREATE TYPE "HGFSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'REVISIONS_NEEDED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "HGFForm" (
    "id" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "procedureId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formType" "HGFFormType" NOT NULL,
    "fieldsJson" JSONB NOT NULL,
    "sectionsJson" JSONB,
    "validationJson" JSONB,
    "requiredDocs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HGFForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HGFSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "crewId" TEXT,
    "applicationId" TEXT,
    "submittedData" JSONB NOT NULL,
    "status" "HGFSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "approvalStep" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "revisionReason" TEXT,
    "revisionsAskedAt" TIMESTAMP(3),
    "revisionsAskedById" TEXT,
    "remarks" TEXT,
    "approvalRemarks" TEXT,
    "allDocsVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HGFSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentUpload" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "crewId" TEXT,
    "documentType" TEXT NOT NULL,
    "documentCode" TEXT,
    "documentTitle" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "documentNumber" TEXT,
    "issuingCountry" TEXT,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verificationNotes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormValidationRule" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleValue" TEXT,
    "errorMessage" TEXT NOT NULL,
    "dependsOnField" TEXT,
    "dependsOnValue" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formType" "HGFFormType" NOT NULL,
    "category" TEXT,
    "baseFieldsJson" JSONB NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HGFSubmissionAuditLog" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedFields" JSONB,
    "performedById" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HGFSubmissionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailNotificationLog" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HGFForm_formCode_key" ON "HGFForm"("formCode");

-- CreateIndex
CREATE INDEX "HGFForm_formCode_idx" ON "HGFForm"("formCode");

-- CreateIndex
CREATE INDEX "HGFForm_formType_idx" ON "HGFForm"("formType");

-- CreateIndex
CREATE INDEX "HGFForm_isActive_idx" ON "HGFForm"("isActive");

-- CreateIndex
CREATE INDEX "HGFSubmission_formCode_idx" ON "HGFSubmission"("formCode");

-- CreateIndex
CREATE INDEX "HGFSubmission_status_idx" ON "HGFSubmission"("status");

-- CreateIndex
CREATE INDEX "HGFSubmission_crewId_idx" ON "HGFSubmission"("crewId");

-- CreateIndex
CREATE INDEX "HGFSubmission_applicationId_idx" ON "HGFSubmission"("applicationId");

-- CreateIndex
CREATE INDEX "HGFSubmission_submittedAt_idx" ON "HGFSubmission"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HGFSubmission_formId_crewId_applicationId_key" ON "HGFSubmission"("formId", "crewId", "applicationId");

-- CreateIndex
CREATE INDEX "DocumentUpload_submissionId_idx" ON "DocumentUpload"("submissionId");

-- CreateIndex
CREATE INDEX "DocumentUpload_crewId_idx" ON "DocumentUpload"("crewId");

-- CreateIndex
CREATE INDEX "DocumentUpload_documentCode_idx" ON "DocumentUpload"("documentCode");

-- CreateIndex
CREATE INDEX "DocumentUpload_verificationStatus_idx" ON "DocumentUpload"("verificationStatus");

-- CreateIndex
CREATE INDEX "FormValidationRule_formId_idx" ON "FormValidationRule"("formId");

-- CreateIndex
CREATE INDEX "FormValidationRule_fieldName_idx" ON "FormValidationRule"("fieldName");

-- CreateIndex
CREATE UNIQUE INDEX "FormValidationRule_formId_fieldName_ruleType_key" ON "FormValidationRule"("formId", "fieldName", "ruleType");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_name_key" ON "FormTemplate"("name");

-- CreateIndex
CREATE INDEX "FormTemplate_formType_idx" ON "FormTemplate"("formType");

-- CreateIndex
CREATE INDEX "FormTemplate_isActive_idx" ON "FormTemplate"("isActive");

-- CreateIndex
CREATE INDEX "HGFSubmissionAuditLog_submissionId_idx" ON "HGFSubmissionAuditLog"("submissionId");

-- CreateIndex
CREATE INDEX "HGFSubmissionAuditLog_action_idx" ON "HGFSubmissionAuditLog"("action");

-- CreateIndex
CREATE INDEX "HGFSubmissionAuditLog_performedAt_idx" ON "HGFSubmissionAuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_recipientEmail_idx" ON "EmailNotificationLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_emailType_idx" ON "EmailNotificationLog"("emailType");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_status_idx" ON "EmailNotificationLog"("status");

-- AddForeignKey
ALTER TABLE "HGFSubmission" ADD CONSTRAINT "HGFSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "HGFForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmission" ADD CONSTRAINT "HGFSubmission_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmission" ADD CONSTRAINT "HGFSubmission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmission" ADD CONSTRAINT "HGFSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmission" ADD CONSTRAINT "HGFSubmission_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmission" ADD CONSTRAINT "HGFSubmission_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmission" ADD CONSTRAINT "HGFSubmission_revisionsAskedById_fkey" FOREIGN KEY ("revisionsAskedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "HGFSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormValidationRule" ADD CONSTRAINT "FormValidationRule_formId_fkey" FOREIGN KEY ("formId") REFERENCES "HGFForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmissionAuditLog" ADD CONSTRAINT "HGFSubmissionAuditLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "HGFSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HGFSubmissionAuditLog" ADD CONSTRAINT "HGFSubmissionAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
