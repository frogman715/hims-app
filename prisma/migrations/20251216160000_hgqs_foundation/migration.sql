-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. Create separate steps if needed.

ALTER TYPE "Role" ADD VALUE 'QMR';
ALTER TYPE "Role" ADD VALUE 'HR_ADMIN';
ALTER TYPE "Role" ADD VALUE 'SECTION_HEAD';
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "currentStatus" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Workflow_resourceType_resourceId_idx" ON "Workflow"("resourceType", "resourceId");

ALTER TABLE "Workflow"
ADD CONSTRAINT "Workflow_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
