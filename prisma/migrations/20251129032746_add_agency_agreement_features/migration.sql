-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisciplinaryAction" AS ENUM ('WARNING', 'REPRIMAND', 'SUSPENSION', 'DISMISSAL', 'FINE');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('PANDI_CLUB', 'HEALTH_INSURANCE', 'ACCIDENT_INSURANCE', 'LIFE_INSURANCE');

-- CreateEnum
CREATE TYPE "WageComponent" AS ENUM ('BASIC_WAGE', 'FIXED_OVERTIME', 'MONTHLY_WAGE', 'LEAVE_PAY', 'SPECIAL_ALLOWANCE', 'BONUS');

-- CreateTable
CREATE TABLE "EmploymentContract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "vesselId" TEXT,
    "principalId" TEXT,
    "rank" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "basicWage" DOUBLE PRECISION NOT NULL,
    "fixedOvertime" DOUBLE PRECISION NOT NULL,
    "monthlyWage" DOUBLE PRECISION NOT NULL,
    "leavePay" DOUBLE PRECISION NOT NULL,
    "specialAllowance" DOUBLE PRECISION,
    "totalMonthly" DOUBLE PRECISION NOT NULL,
    "onboardAllowance" DOUBLE PRECISION,
    "homeAllotment" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "contractTerms" TEXT,
    "signedDate" TIMESTAMP(3),
    "signedByCrew" BOOLEAN NOT NULL DEFAULT false,
    "signedByAgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WageComponentDetail" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "component" "WageComponent" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WageComponentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WageScale" (
    "id" TEXT NOT NULL,
    "vesselType" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "basicWage" DOUBLE PRECISION NOT NULL,
    "fixedOvertime" DOUBLE PRECISION NOT NULL,
    "monthlyWage" DOUBLE PRECISION NOT NULL,
    "specialAllowance" DOUBLE PRECISION,
    "leavePay" DOUBLE PRECISION NOT NULL,
    "totalMonthly" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WageScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaryRecord" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "violation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action" "DisciplinaryAction" NOT NULL,
    "penalty" TEXT,
    "fineAmount" DOUBLE PRECISION,
    "suspensionDays" INTEGER,
    "warningLevel" TEXT,
    "appealStatus" TEXT,
    "appealNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyFee" (
    "id" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceRecord" (
    "id" TEXT NOT NULL,
    "crewId" TEXT,
    "vesselId" TEXT,
    "principalId" TEXT,
    "insuranceType" "InsuranceType" NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "coverageAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "premiumAmount" DOUBLE PRECISION,
    "premiumCurrency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "coverageDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationalHoliday" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'INDONESIA',
    "holidayName" TEXT NOT NULL,
    "holidayDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "paidLeave" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NationalHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentContract_contractNumber_key" ON "EmploymentContract"("contractNumber");

-- AddForeignKey
ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WageComponentDetail" ADD CONSTRAINT "WageComponentDetail_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "EmploymentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryRecord" ADD CONSTRAINT "DisciplinaryRecord_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "EmploymentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryRecord" ADD CONSTRAINT "DisciplinaryRecord_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyFee" ADD CONSTRAINT "AgencyFee_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceRecord" ADD CONSTRAINT "InsuranceRecord_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceRecord" ADD CONSTRAINT "InsuranceRecord_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceRecord" ADD CONSTRAINT "InsuranceRecord_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
