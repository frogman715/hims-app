/*
  Warnings:

  - You are about to drop the column `typeId` on the `CrewDocument` table. All the data in the column will be lost.
  - You are about to drop the column `vesselName` on the `PKLContract` table. All the data in the column will be lost.
  - Added the required column `docNumber` to the `CrewDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docType` to the `CrewDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vesselId` to the `PKLContract` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VesselType" AS ENUM ('GENERAL_CARGO', 'TANKER', 'BULK_CARRIER', 'CONTAINER', 'PASSENGER');

-- CreateEnum
CREATE TYPE "ReplacementStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PLANNED', 'ASSIGNED', 'ONBOARD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- DropForeignKey
ALTER TABLE "CrewDocument" DROP CONSTRAINT "CrewDocument_typeId_fkey";

-- AlterTable
ALTER TABLE "Crew" ADD COLUMN     "nationality" TEXT;

-- AlterTable
ALTER TABLE "CrewDocument" DROP COLUMN "typeId",
ADD COLUMN     "docNumber" TEXT NOT NULL,
ADD COLUMN     "docType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PKLContract" DROP COLUMN "vesselName",
ADD COLUMN     "vesselId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PrepareJoining" (
    "id" TEXT NOT NULL,
    "replacementId" TEXT NOT NULL,
    "vesselType" "VesselType" NOT NULL,
    "visaRequired" BOOLEAN NOT NULL DEFAULT false,
    "flagCertificate" BOOLEAN NOT NULL DEFAULT true,
    "medicalCheck" BOOLEAN NOT NULL DEFAULT true,
    "cocCertificate" BOOLEAN NOT NULL DEFAULT true,
    "copCertificate" BOOLEAN NOT NULL DEFAULT true,
    "bstCertificate" BOOLEAN NOT NULL DEFAULT true,
    "gocCertificate" BOOLEAN NOT NULL DEFAULT true,
    "koreaLicense" BOOLEAN NOT NULL DEFAULT false,
    "kmlCertificate" BOOLEAN NOT NULL DEFAULT false,
    "visaCompleted" BOOLEAN NOT NULL DEFAULT false,
    "flagCompleted" BOOLEAN NOT NULL DEFAULT false,
    "medicalCompleted" BOOLEAN NOT NULL DEFAULT false,
    "cocCompleted" BOOLEAN NOT NULL DEFAULT false,
    "copCompleted" BOOLEAN NOT NULL DEFAULT false,
    "bstCompleted" BOOLEAN NOT NULL DEFAULT false,
    "gocCompleted" BOOLEAN NOT NULL DEFAULT false,
    "koreaCompleted" BOOLEAN NOT NULL DEFAULT false,
    "kmlCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrepareJoining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewReplacement" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "replacementCrewId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReplacementStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewReplacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "hireDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vessel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imoNumber" TEXT,
    "flag" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dwt" DOUBLE PRECISION,
    "gt" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Principal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Principal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "assignedRank" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "appliedRank" TEXT,
    "appliedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "conductedAt" TIMESTAMP(3),
    "interviewerId" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orientation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "orientationDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "conductedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orientation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrepareJoining_replacementId_key" ON "PrepareJoining"("replacementId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_applicationId_key" ON "Interview"("applicationId");

-- AddForeignKey
ALTER TABLE "PKLContract" ADD CONSTRAINT "PKLContract_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepareJoining" ADD CONSTRAINT "PrepareJoining_replacementId_fkey" FOREIGN KEY ("replacementId") REFERENCES "CrewReplacement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewReplacement" ADD CONSTRAINT "CrewReplacement_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewReplacement" ADD CONSTRAINT "CrewReplacement_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewReplacement" ADD CONSTRAINT "CrewReplacement_replacementCrewId_fkey" FOREIGN KEY ("replacementCrewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewReplacement" ADD CONSTRAINT "CrewReplacement_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewReplacement" ADD CONSTRAINT "CrewReplacement_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orientation" ADD CONSTRAINT "Orientation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
