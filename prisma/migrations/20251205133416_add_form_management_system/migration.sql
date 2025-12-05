-- CreateEnum
CREATE TYPE "FormApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PrincipalFormTemplate" (
    "id" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "formCategory" TEXT NOT NULL,
    "templatePath" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrincipalFormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepareJoiningForm" (
    "id" TEXT NOT NULL,
    "prepareJoiningId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "status" "FormApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "finalPdfPath" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrepareJoiningForm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrincipalFormTemplate" ADD CONSTRAINT "PrincipalFormTemplate_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepareJoiningForm" ADD CONSTRAINT "PrepareJoiningForm_prepareJoiningId_fkey" FOREIGN KEY ("prepareJoiningId") REFERENCES "PrepareJoining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepareJoiningForm" ADD CONSTRAINT "PrepareJoiningForm_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrincipalFormTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
