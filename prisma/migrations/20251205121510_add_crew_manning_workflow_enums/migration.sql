/*
  Warnings:

  - The `status` column on the `Application` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `interviewDate` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `ticketReady` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `transportReady` on the `PrepareJoining` table. All the data in the column will be lost.
  - The `status` column on the `PrepareJoining` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `scheduledDate` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('RECEIVED', 'REVIEWING', 'INTERVIEW', 'PASSED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'CONDUCTED', 'PASSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrepareJoiningStatus" AS ENUM ('PENDING', 'DOCUMENTS', 'MEDICAL', 'TRAINING', 'TRAVEL', 'READY', 'DISPATCHED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "principalId" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "vesselType" TEXT,
ALTER COLUMN "applicationDate" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'RECEIVED';

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "interviewDate",
DROP COLUMN "result",
ADD COLUMN     "applicationId" TEXT,
ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "attitudeScore" INTEGER,
ADD COLUMN     "conductedDate" TIMESTAMP(3),
ADD COLUMN     "englishScore" INTEGER,
ADD COLUMN     "recommendation" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "technicalScore" INTEGER;

-- AlterTable
ALTER TABLE "PrepareJoining" DROP COLUMN "ticketReady",
DROP COLUMN "transportReady",
ADD COLUMN     "arrivalPort" TEXT,
ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "certificatesValid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "departureDate" TIMESTAMP(3),
ADD COLUMN     "departurePort" TEXT,
ADD COLUMN     "flightNumber" TEXT,
ADD COLUMN     "hotelName" TEXT,
ADD COLUMN     "medicalCheckDate" TIMESTAMP(3),
ADD COLUMN     "medicalExpiry" TIMESTAMP(3),
ADD COLUMN     "medicalRemarks" TEXT,
ADD COLUMN     "medicalValid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orientationCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orientationDate" TIMESTAMP(3),
ADD COLUMN     "passportValid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "principalId" TEXT,
ADD COLUMN     "seamanBookValid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ticketBooked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ticketBookedDate" TIMESTAMP(3),
ADD COLUMN     "trainingRemarks" TEXT,
ADD COLUMN     "transportArranged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportDetails" TEXT,
ADD COLUMN     "visaValid" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "status",
ADD COLUMN     "status" "PrepareJoiningStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepareJoining" ADD CONSTRAINT "PrepareJoining_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepareJoining" ADD CONSTRAINT "PrepareJoining_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
