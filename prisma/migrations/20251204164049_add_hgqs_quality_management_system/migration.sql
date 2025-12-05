-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('MEDIA_INTERVIEW', 'COMPLAINT', 'APPRAISAL_REPORT', 'CREW_DISPUTE', 'CREW_SICK', 'CREW_DEATH', 'EMERGENCY', 'GENERAL_INQUIRY');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SignOffStatus" AS ENUM ('PENDING', 'DOCUMENTS_RECEIVED', 'DEBRIEFING_DONE', 'WAGES_CALCULATED', 'WAGES_PAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AppraisalRecommendation" AS ENUM ('EXCELLENT_PROMOTE', 'GOOD_MAINTAIN', 'SATISFACTORY_DEVELOP', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY_ACTION');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('INTERNAL_QMS', 'EXTERNAL_CERTIFICATION', 'SURVEILLANCE', 'SPECIAL');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP_REQUIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CAPAType" AS ENUM ('CORRECTIVE', 'PREVENTIVE', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "CAPAStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'VERIFIED_EFFECTIVE', 'VERIFIED_INEFFECTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "EffectivenessRating" AS ENUM ('EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'FOLLOW_UP_PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "QMRTaskType" AS ENUM ('AUDIT_PREPARATION', 'AUDIT_FOLLOW_UP', 'CAPA_VERIFICATION', 'DOCUMENT_APPROVAL', 'RISK_EVALUATION', 'MANAGEMENT_REVIEW', 'GENERAL_TASK');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateTable
CREATE TABLE "CompanyVisionMission" (
    "id" TEXT NOT NULL,
    "vision" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "coreValues" TEXT[],
    "objectives" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyVisionMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "crewId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reporter" TEXT NOT NULL,
    "handledBy" TEXT,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "resolution" TEXT,
    "resolutionDate" TIMESTAMP(3),
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewSignOff" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "signOffDate" TIMESTAMP(3) NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "passportReceived" BOOLEAN NOT NULL DEFAULT false,
    "seamanBookReceived" BOOLEAN NOT NULL DEFAULT false,
    "debriefingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "debriefingNotes" TEXT,
    "finalWageAmount" DOUBLE PRECISION,
    "wageCalculatedDate" TIMESTAMP(3),
    "wagePaidDate" TIMESTAMP(3),
    "documentWithdrawn" BOOLEAN NOT NULL DEFAULT false,
    "interviewedBy" TEXT,
    "status" "SignOffStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewSignOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManpowerRequisition" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "numberOfVacancy" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "qualifications" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "approvalDate" TIMESTAMP(3),
    "recruitmentPlan" TEXT,
    "budget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManpowerRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceAppraisal" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "appraisalPeriod" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "evaluatorName" TEXT NOT NULL,
    "qualityOfWork" INTEGER NOT NULL,
    "productivity" INTEGER NOT NULL,
    "jobKnowledge" INTEGER NOT NULL,
    "reliability" INTEGER NOT NULL,
    "initiative" INTEGER NOT NULL,
    "teamwork" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT NOT NULL,
    "areasForImprovement" TEXT NOT NULL,
    "trainingNeeds" TEXT,
    "goals" TEXT,
    "recommendation" "AppraisalRecommendation" NOT NULL,
    "comments" TEXT,
    "employeeSignature" TEXT,
    "employeeDate" TIMESTAMP(3),
    "evaluatorSignature" TEXT,
    "evaluatorDate" TIMESTAMP(3),
    "hrApproval" TEXT,
    "hrApprovalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceAppraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "deliveryDate" TIMESTAMP(3),
    "receivedBy" TEXT,
    "receivedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalAudit" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "auditNumber" TEXT NOT NULL,
    "auditType" "AuditType" NOT NULL,
    "department" TEXT NOT NULL,
    "auditors" TEXT[],
    "auditDate" TIMESTAMP(3) NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "checklist" JSONB NOT NULL,
    "findings" JSONB[],
    "summary" TEXT NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'SCHEDULED',
    "correctiveActions" TEXT[],
    "followUpDate" TIMESTAMP(3),
    "closureDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "capaNumber" TEXT NOT NULL,
    "type" "CAPAType" NOT NULL,
    "source" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "nonconformity" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctiveAction" TEXT NOT NULL,
    "preventiveAction" TEXT,
    "responsiblePerson" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "implementationDate" TIMESTAMP(3),
    "verificationMethod" TEXT,
    "verifiedBy" TEXT,
    "verificationDate" TIMESTAMP(3),
    "effectiveness" "EffectivenessRating",
    "status" "CAPAStatus" NOT NULL DEFAULT 'OPEN',
    "qmrApproval" TEXT,
    "approvalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementReview" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "meetingNumber" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT[],
    "chairman" TEXT NOT NULL,
    "auditResults" TEXT NOT NULL,
    "customerFeedback" TEXT,
    "processPerformance" TEXT NOT NULL,
    "qualityObjectives" TEXT NOT NULL,
    "nonconformities" TEXT NOT NULL,
    "capaStatus" TEXT NOT NULL,
    "previousActions" TEXT,
    "risksOpportunities" TEXT NOT NULL,
    "decisions" TEXT NOT NULL,
    "actionItems" JSONB[],
    "resourceNeeds" TEXT,
    "improvements" TEXT,
    "minutes" TEXT NOT NULL,
    "nextReviewDate" TIMESTAMP(3),
    "status" "ReviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagementReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QMRTask" (
    "id" TEXT NOT NULL,
    "taskType" "QMRTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "relatedEntity" TEXT,
    "completionDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QMRTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManpowerRequisition_formNumber_key" ON "ManpowerRequisition"("formNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceAppraisal_formNumber_key" ON "PerformanceAppraisal"("formNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_formNumber_key" ON "PurchaseOrder"("formNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InternalAudit_formNumber_key" ON "InternalAudit"("formNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InternalAudit_auditNumber_key" ON "InternalAudit"("auditNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectiveAction_formNumber_key" ON "CorrectiveAction"("formNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectiveAction_capaNumber_key" ON "CorrectiveAction"("capaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ManagementReview_formNumber_key" ON "ManagementReview"("formNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ManagementReview_meetingNumber_key" ON "ManagementReview"("meetingNumber");

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewSignOff" ADD CONSTRAINT "CrewSignOff_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewSignOff" ADD CONSTRAINT "CrewSignOff_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
