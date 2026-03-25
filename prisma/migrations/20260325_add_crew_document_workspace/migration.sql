-- CreateEnum
CREATE TYPE "CrewDocumentWorkspaceStatus" AS ENUM ('NOT_LINKED', 'LINKED', 'REVIEW_PENDING', 'REVIEWED');

-- CreateTable
CREATE TABLE "CrewDocumentWorkspace" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "officeFolderPath" TEXT,
    "nextcloudUrl" TEXT,
    "folderStatus" "CrewDocumentWorkspaceStatus",
    "folderTemplateVersion" TEXT,
    "lastDocumentReviewAt" TIMESTAMP(3),
    "lastDocumentReviewBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewDocumentWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrewDocumentWorkspace_crewId_key" ON "CrewDocumentWorkspace"("crewId");

-- CreateIndex
CREATE INDEX "CrewDocumentWorkspace_folderStatus_idx" ON "CrewDocumentWorkspace"("folderStatus");

-- CreateIndex
CREATE INDEX "CrewDocumentWorkspace_lastDocumentReviewAt_idx" ON "CrewDocumentWorkspace"("lastDocumentReviewAt");

-- CreateIndex
CREATE INDEX "CrewDocumentWorkspace_lastDocumentReviewBy_idx" ON "CrewDocumentWorkspace"("lastDocumentReviewBy");

-- AddForeignKey
ALTER TABLE "CrewDocumentWorkspace" ADD CONSTRAINT "CrewDocumentWorkspace_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewDocumentWorkspace" ADD CONSTRAINT "CrewDocumentWorkspace_lastDocumentReviewBy_fkey" FOREIGN KEY ("lastDocumentReviewBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
