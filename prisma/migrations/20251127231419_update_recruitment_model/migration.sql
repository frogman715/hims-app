/*
  Warnings:

  - You are about to drop the column `recruitmentId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `closingDate` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `postedDate` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `Recruitment` table. All the data in the column will be lost.
  - Added the required column `candidateName` to the `Recruitment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_recruitmentId_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "recruitmentId";

-- AlterTable
ALTER TABLE "Recruitment" DROP COLUMN "closingDate",
DROP COLUMN "department",
DROP COLUMN "postedDate",
DROP COLUMN "requirements",
ADD COLUMN     "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "candidateName" TEXT NOT NULL,
ADD COLUMN     "interviewDate" TIMESTAMP(3),
ADD COLUMN     "interviewer" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "result" TEXT,
ALTER COLUMN "status" SET DEFAULT 'APPLIED';
