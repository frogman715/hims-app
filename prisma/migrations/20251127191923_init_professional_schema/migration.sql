-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTOR', 'CDMO', 'OPERATIONAL', 'ACCOUNTING');

-- CreateEnum
CREATE TYPE "CrewStatus" AS ENUM ('STANDBY', 'ONBOARD', 'OFF_SIGNED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PERSONAL', 'CERTIFICATE', 'MEDICAL', 'VISA', 'CONTRACT', 'TRAINING', 'DISPATCH', 'FINANCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentTypeCode" AS ENUM ('PASSPORT', 'SEAMAN_BOOK', 'STCW_BST', 'STCW_AFF', 'STCW_MEFA', 'STCW_SCRB', 'COP_TANKER', 'KOSMA', 'MEDICAL_RESULT', 'VISA', 'PKL_CONTRACT', 'SEA', 'TRAINING_NOK', 'TRAINING_SAFETY_DECL', 'TRAINING_MEDICAL_HISTORY', 'TRAINING_GENERAL_EDU', 'TRAINING_RECORD', 'TRAINING_SCHEDULE', 'OWNER_SMS_CONFIRM');

-- CreateEnum
CREATE TYPE "VisaStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PKLStatus" AS ENUM ('DRAFT', 'PENDING_DIRECTOR_APPROVAL', 'APPROVED_BY_DIRECTOR', 'SUBMITTED_TO_SYAHBANDAR', 'APPROVED_SYAHBANDAR', 'REJECTED');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PLANNING', 'READY_FOR_DEPARTURE', 'AT_AIRPORT', 'CHECKED_IN', 'BOARDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FlightLegType" AS ENUM ('OUTBOUND', 'RETURN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('OFFICE', 'CREW_EXCHANGE', 'MEDICAL', 'HOTEL', 'TRANSPORT', 'VISA', 'TICKET', 'AGENT_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'CONTRACT_BASED');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('KOREA_NOK', 'KOREA_SAFETY_DECL', 'KOREA_MEDICAL_HISTORY', 'KOREA_GENERAL_EDU', 'KOREA_RECORD', 'KOREA_SCHEDULE', 'TANKER_NOK', 'TANKER_OWNER_SMS_CONFIRM', 'TANKER_MEDICAL_HISTORY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "lastVessel" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "workClothesSize" TEXT,
    "waistSize" TEXT,
    "shoeSize" TEXT,
    "lastSignOffDate" TIMESTAMP(3),
    "status" "CrewStatus" NOT NULL DEFAULT 'STANDBY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "code" "DocumentTypeCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "DocumentCategory" NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewDocument" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "remarks" TEXT,
    "fileUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentReceiving" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "receivedByUserId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "lastVessel" TEXT,
    "workClothesSize" TEXT,
    "waistSize" TEXT,
    "shoeSize" TEXT,
    "signOffDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentReceiving_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCheck" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "referralDocUrl" TEXT,
    "clinicName" TEXT,
    "checkDate" TIMESTAMP(3),
    "resultDocUrl" TEXT,
    "isFit" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaApplication" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "status" "VisaStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "notes" TEXT,
    "visaFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisaApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PKLContract" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "vesselName" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "salaryCurrency" TEXT,
    "salaryAmount" DOUBLE PRECISION,
    "salaryType" "SalaryType",
    "status" "PKLStatus" NOT NULL DEFAULT 'DRAFT',
    "pklFileUrl" TEXT,
    "seaFileUrl" TEXT,
    "submittedToSyahbandarAt" TIMESTAMP(3),
    "approvedSyahbandarAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PKLContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingTemplate" (
    "id" TEXT NOT NULL,
    "type" "TrainingType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateFileUrl" TEXT,

    CONSTRAINT "TrainingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAssignment" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "signedByCrew" BOOLEAN NOT NULL DEFAULT false,
    "signedByDirector" BOOLEAN NOT NULL DEFAULT false,
    "signedDocUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "pklContractId" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PLANNING',
    "primaryFlightId" TEXT,
    "ticketFileUrl" TEXT,
    "joinInstructionUrl" TEXT,
    "dispatchChecklistUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "legType" "FlightLegType" NOT NULL DEFAULT 'OUTBOUND',
    "airline" TEXT NOT NULL,
    "flightNo" TEXT NOT NULL,
    "departAirport" TEXT NOT NULL,
    "arriveAirport" TEXT NOT NULL,
    "departTime" TIMESTAMP(3) NOT NULL,
    "arriveTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LetterGuarantee" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "letterNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "airlineName" TEXT NOT NULL,
    "immigrationFrom" TEXT NOT NULL,
    "immigrationTo" TEXT,
    "handlingAgent" TEXT,
    "handlingAgentContact" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "LetterGuarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "crewId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeExpense" (
    "id" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewSalary" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "pklContractId" TEXT,
    "periodFrom" TIMESTAMP(3),
    "periodTo" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePay" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "pklContractId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeExpense" (
    "id" TEXT NOT NULL,
    "crewId" TEXT,
    "pklContractId" TEXT,
    "type" "ExpenseType" NOT NULL DEFAULT 'CREW_EXCHANGE',
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatementOfAccount" (
    "id" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatementOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCash" (
    "id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFile" (
    "id" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "crewId" TEXT,
    "pklContractId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LetterGuarantee_dispatchId_key" ON "LetterGuarantee"("dispatchId");

-- AddForeignKey
ALTER TABLE "CrewDocument" ADD CONSTRAINT "CrewDocument_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewDocument" ADD CONSTRAINT "CrewDocument_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReceiving" ADD CONSTRAINT "DocumentReceiving_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReceiving" ADD CONSTRAINT "DocumentReceiving_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCheck" ADD CONSTRAINT "MedicalCheck_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PKLContract" ADD CONSTRAINT "PKLContract_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_pklContractId_fkey" FOREIGN KEY ("pklContractId") REFERENCES "PKLContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterGuarantee" ADD CONSTRAINT "LetterGuarantee_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportLog" ADD CONSTRAINT "TransportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportLog" ADD CONSTRAINT "TransportLog_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeExpense" ADD CONSTRAINT "OfficeExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewSalary" ADD CONSTRAINT "CrewSalary_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewSalary" ADD CONSTRAINT "CrewSalary_pklContractId_fkey" FOREIGN KEY ("pklContractId") REFERENCES "PKLContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePay" ADD CONSTRAINT "LeavePay_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePay" ADD CONSTRAINT "LeavePay_pklContractId_fkey" FOREIGN KEY ("pklContractId") REFERENCES "PKLContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeExpense" ADD CONSTRAINT "ExchangeExpense_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeExpense" ADD CONSTRAINT "ExchangeExpense_pklContractId_fkey" FOREIGN KEY ("pklContractId") REFERENCES "PKLContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFile" ADD CONSTRAINT "AuditFile_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFile" ADD CONSTRAINT "AuditFile_pklContractId_fkey" FOREIGN KEY ("pklContractId") REFERENCES "PKLContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
