/*
  Warnings:

  - The values [OWNER_SMS_CONFIRM] on the enum `DocumentTypeCode` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `effectiveDate` on the `AgencyFee` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `AgencyFee` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `AgencyFee` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `AgencyFee` table. All the data in the column will be lost.
  - You are about to drop the column `appliedOn` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `appliedRank` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Application` table. All the data in the column will be lost.
  - The `status` column on the `Application` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `assignedRank` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Assignment` table. All the data in the column will be lost.
  - The `status` column on the `Assignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `notes` on the `Attendance` table. All the data in the column will be lost.
  - The `status` column on the `Attendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `category` on the `AuditFile` table. All the data in the column will be lost.
  - You are about to drop the column `crewId` on the `AuditFile` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `AuditFile` table. All the data in the column will be lost.
  - You are about to drop the column `pklContractId` on the `AuditFile` table. All the data in the column will be lost.
  - You are about to drop the column `lastSignOffDate` on the `Crew` table. All the data in the column will be lost.
  - You are about to drop the column `lastVessel` on the `Crew` table. All the data in the column will be lost.
  - You are about to drop the column `shoeSize` on the `Crew` table. All the data in the column will be lost.
  - You are about to drop the column `waistSize` on the `Crew` table. All the data in the column will be lost.
  - You are about to drop the column `workClothesSize` on the `Crew` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentId` on the `CrewReplacement` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `CrewReplacement` table. All the data in the column will be lost.
  - The `status` column on the `CrewReplacement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `amount` on the `CrewSalary` table. All the data in the column will be lost.
  - You are about to drop the column `periodFrom` on the `CrewSalary` table. All the data in the column will be lost.
  - You are about to drop the column `periodTo` on the `CrewSalary` table. All the data in the column will be lost.
  - You are about to drop the column `pklContractId` on the `CrewSalary` table. All the data in the column will be lost.
  - You are about to drop the column `appealNotes` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `appealStatus` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `contractId` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `fineAmount` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `penalty` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `suspensionDays` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `violation` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `warningLevel` on the `DisciplinaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `dispatchChecklistUrl` on the `Dispatch` table. All the data in the column will be lost.
  - You are about to drop the column `joinInstructionUrl` on the `Dispatch` table. All the data in the column will be lost.
  - You are about to drop the column `pklContractId` on the `Dispatch` table. All the data in the column will be lost.
  - You are about to drop the column `primaryFlightId` on the `Dispatch` table. All the data in the column will be lost.
  - You are about to drop the column `ticketFileUrl` on the `Dispatch` table. All the data in the column will be lost.
  - The `status` column on the `Dispatch` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `lastVessel` on the `DocumentReceiving` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `DocumentReceiving` table. All the data in the column will be lost.
  - You are about to drop the column `receivedByUserId` on the `DocumentReceiving` table. All the data in the column will be lost.
  - You are about to drop the column `shoeSize` on the `DocumentReceiving` table. All the data in the column will be lost.
  - You are about to drop the column `signOffDate` on the `DocumentReceiving` table. All the data in the column will be lost.
  - You are about to drop the column `waistSize` on the `DocumentReceiving` table. All the data in the column will be lost.
  - You are about to drop the column `workClothesSize` on the `DocumentReceiving` table. All the data in the column will be lost.
  - You are about to drop the column `contractTerms` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `fixedOvertime` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `homeAllotment` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `leavePay` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyWage` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `onboardAllowance` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `signedByAgent` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `signedByCrew` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `signedDate` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `specialAllowance` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `totalMonthly` on the `EmploymentContract` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `ExchangeExpense` table. All the data in the column will be lost.
  - You are about to drop the column `pklContractId` on the `ExchangeExpense` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `ExchangeExpense` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ExchangeExpense` table. All the data in the column will be lost.
  - You are about to drop the column `applicationId` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `conductedAt` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `contractorName` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `pklContractId` on the `LeavePay` table. All the data in the column will be lost.
  - You are about to drop the column `isFit` on the `MedicalCheck` table. All the data in the column will be lost.
  - You are about to drop the column `referralDocUrl` on the `MedicalCheck` table. All the data in the column will be lost.
  - You are about to drop the column `resultDocUrl` on the `MedicalCheck` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `OfficeExpense` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `OfficeExpense` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `OfficeExpense` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `Orientation` table. All the data in the column will be lost.
  - You are about to drop the column `conductedBy` on the `Orientation` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `Orientation` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Orientation` table. All the data in the column will be lost.
  - You are about to drop the column `orientationDate` on the `Orientation` table. All the data in the column will be lost.
  - You are about to drop the column `topics` on the `Orientation` table. All the data in the column will be lost.
  - You are about to drop the column `trainer` on the `Orientation` table. All the data in the column will be lost.
  - You are about to drop the column `approvedSyahbandarAt` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `contractType` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `flag` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `pklFileUrl` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `salaryAmount` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `salaryCurrency` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `salaryType` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `seaFileUrl` on the `PKLContract` table. All the data in the column will be lost.
  - You are about to drop the column `submittedToSyahbandarAt` on the `PKLContract` table. All the data in the column will be lost.
  - The `status` column on the `PKLContract` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `balance` on the `PettyCash` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdated` on the `PettyCash` table. All the data in the column will be lost.
  - You are about to drop the column `bstCertificate` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `bstCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `cocCertificate` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `cocCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `copCertificate` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `copCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `flagCertificate` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `flagCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `gocCertificate` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `gocCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `kmlCertificate` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `kmlCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `koreaCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `koreaLicense` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `medicalCheck` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `medicalCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `replacementId` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `vesselType` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `visaCompleted` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `visaRequired` on the `PrepareJoining` table. All the data in the column will be lost.
  - You are about to drop the column `appliedDate` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `candidateName` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `interviewDate` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `interviewer` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `Recruitment` table. All the data in the column will be lost.
  - You are about to drop the column `contractorName` on the `StatementOfAccount` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `StatementOfAccount` table. All the data in the column will be lost.
  - You are about to drop the column `periodFrom` on the `StatementOfAccount` table. All the data in the column will be lost.
  - You are about to drop the column `periodTo` on the `StatementOfAccount` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `TransportLog` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `TransportLog` table. All the data in the column will be lost.
  - You are about to drop the column `fromLocation` on the `TransportLog` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `TransportLog` table. All the data in the column will be lost.
  - You are about to drop the column `purpose` on the `TransportLog` table. All the data in the column will be lost.
  - You are about to drop the column `toLocation` on the `TransportLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TransportLog` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `visaFileUrl` on the `VisaApplication` table. All the data in the column will be lost.
  - The `status` column on the `VisaApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `agencyAgreementId` on the `WageScaleHeader` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `WageScaleHeader` table. All the data in the column will be lost.
  - You are about to drop the column `effectiveDate` on the `WageScaleHeader` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `WageScaleHeader` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WageScaleHeader` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `WageScaleItem` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DisciplinaryCase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DisciplineRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Flight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LetterGuarantee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WageComponentDetail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WageScale` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `DocumentType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contractNumber]` on the table `PKLContract` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[soaNumber]` on the table `StatementOfAccount` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `principalId` to the `AgencyAgreement` table without a default value. This is not possible if the table is not empty.
  - Made the column `expiryDate` on table `AgencyAgreement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `AgencyAgreementVessel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `AgencyFee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicationDate` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Made the column `startDate` on table `Assignment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `auditPeriod` to the `AuditFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `AuditFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `AuditFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AuditFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `AuditFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basicWage` to the `CrewSalary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `CrewSalary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `CrewSalary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `CrewSalary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `DisciplinaryRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dispatchDate` to the `Dispatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `port` to the `Dispatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentId` to the `DocumentReceiving` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedBy` to the `DocumentReceiving` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DocumentReceiving` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DocumentType` table without a default value. This is not possible if the table is not empty.
  - Made the column `hireDate` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `contractEnd` to the `EmploymentContract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractStart` to the `EmploymentContract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exchangeRate` to the `ExchangeExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expenseDate` to the `ExchangeExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idrAmount` to the `ExchangeExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ExchangeExpense` table without a default value. This is not possible if the table is not empty.
  - Made the column `crewId` on table `ExchangeExpense` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `crewId` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interviewDate` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Made the column `interviewerId` on table `Interview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `result` on table `Interview` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clientId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueDate` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `dueDate` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `days` to the `LeavePay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `LeavePay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveType` to the `LeavePay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `LeavePay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiryDate` to the `MedicalCheck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `result` to the `MedicalCheck` table without a default value. This is not possible if the table is not empty.
  - Made the column `clinicName` on table `MedicalCheck` required. This step will fail if there are existing NULL values in that column.
  - Made the column `checkDate` on table `MedicalCheck` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `expenseDate` to the `OfficeExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expenseType` to the `OfficeExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OfficeExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `OfficeExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crewId` to the `Orientation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Orientation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basicWage` to the `PKLContract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractNumber` to the `PKLContract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `PKLContract` table without a default value. This is not possible if the table is not empty.
  - Made the column `startDate` on table `PKLContract` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `PKLContract` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `amount` to the `PettyCash` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `PettyCash` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expenseDate` to the `PettyCash` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PettyCash` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crewId` to the `PrepareJoining` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crewId` to the `Recruitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recruiterId` to the `Recruitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recruitmentDate` to the `Recruitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `StatementOfAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `StatementOfAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueDate` to the `StatementOfAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `StatementOfAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `soaNumber` to the `StatementOfAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StatementOfAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loggedBy` to the `TransportLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupDate` to the `TransportLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLocation` to the `TransportLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transportType` to the `TransportLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TransportLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `crewId` on table `TransportLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `applicationDate` to the `VisaApplication` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `component` on the `WageScaleItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentTypeCode_new" AS ENUM ('PASSPORT', 'SEAMAN_BOOK', 'STCW_BST', 'STCW_AFF', 'STCW_MEFA', 'STCW_SCRB', 'COP_TANKER', 'KOSMA', 'MEDICAL_RESULT', 'VISA', 'PKL_CONTRACT', 'SEA', 'TRAINING_NOK', 'TRAINING_SAFETY_DECL', 'TRAINING_MEDICAL_HISTORY', 'TRAINING_GENERAL_EDU', 'TRAINING_RECORD', 'TRAINING_SCHEDULE', 'RETURN');
ALTER TABLE "DocumentType" ALTER COLUMN "code" TYPE "DocumentTypeCode_new" USING ("code"::text::"DocumentTypeCode_new");
ALTER TYPE "DocumentTypeCode" RENAME TO "DocumentTypeCode_old";
ALTER TYPE "DocumentTypeCode_new" RENAME TO "DocumentTypeCode";
DROP TYPE "public"."DocumentTypeCode_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AgencyFee" DROP CONSTRAINT "AgencyFee_principalId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_principalId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "AuditFile" DROP CONSTRAINT "AuditFile_crewId_fkey";

-- DropForeignKey
ALTER TABLE "AuditFile" DROP CONSTRAINT "AuditFile_pklContractId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "CrewReplacement" DROP CONSTRAINT "CrewReplacement_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "CrewSalary" DROP CONSTRAINT "CrewSalary_pklContractId_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaryCase" DROP CONSTRAINT "DisciplinaryCase_agencyAgreementId_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaryCase" DROP CONSTRAINT "DisciplinaryCase_crewId_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaryCase" DROP CONSTRAINT "DisciplinaryCase_disciplineRuleId_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaryCase" DROP CONSTRAINT "DisciplinaryCase_investigatedById_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaryCase" DROP CONSTRAINT "DisciplinaryCase_reportedById_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaryCase" DROP CONSTRAINT "DisciplinaryCase_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaryRecord" DROP CONSTRAINT "DisciplinaryRecord_contractId_fkey";

-- DropForeignKey
ALTER TABLE "Dispatch" DROP CONSTRAINT "Dispatch_pklContractId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentReceiving" DROP CONSTRAINT "DocumentReceiving_receivedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "ExchangeExpense" DROP CONSTRAINT "ExchangeExpense_crewId_fkey";

-- DropForeignKey
ALTER TABLE "ExchangeExpense" DROP CONSTRAINT "ExchangeExpense_pklContractId_fkey";

-- DropForeignKey
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_dispatchId_fkey";

-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_interviewerId_fkey";

-- DropForeignKey
ALTER TABLE "LeavePay" DROP CONSTRAINT "LeavePay_pklContractId_fkey";

-- DropForeignKey
ALTER TABLE "LetterGuarantee" DROP CONSTRAINT "LetterGuarantee_dispatchId_fkey";

-- DropForeignKey
ALTER TABLE "OfficeExpense" DROP CONSTRAINT "OfficeExpense_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Orientation" DROP CONSTRAINT "Orientation_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "PKLContract" DROP CONSTRAINT "PKLContract_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "PrepareJoining" DROP CONSTRAINT "PrepareJoining_replacementId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingAssignment" DROP CONSTRAINT "TrainingAssignment_crewId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingAssignment" DROP CONSTRAINT "TrainingAssignment_templateId_fkey";

-- DropForeignKey
ALTER TABLE "TransportLog" DROP CONSTRAINT "TransportLog_crewId_fkey";

-- DropForeignKey
ALTER TABLE "TransportLog" DROP CONSTRAINT "TransportLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "WageComponentDetail" DROP CONSTRAINT "WageComponentDetail_contractId_fkey";

-- DropForeignKey
ALTER TABLE "WageScaleHeader" DROP CONSTRAINT "WageScaleHeader_agencyAgreementId_fkey";

-- DropForeignKey
ALTER TABLE "WageScaleHeader" DROP CONSTRAINT "WageScaleHeader_principalId_fkey";

-- DropIndex
DROP INDEX "AgencyAgreementVessel_agencyAgreementId_vesselId_key";

-- DropIndex
DROP INDEX "Employee_email_key";

-- DropIndex
DROP INDEX "Interview_applicationId_key";

-- DropIndex
DROP INDEX "PrepareJoining_replacementId_key";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "entityId" TEXT NOT NULL,
ADD COLUMN     "entityType" TEXT NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AgencyAgreement" ADD COLUMN     "principalId" TEXT NOT NULL,
ALTER COLUMN "expiryDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "AgencyAgreementVessel" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AgencyFee" DROP COLUMN "effectiveDate",
DROP COLUMN "expiryDate",
DROP COLUMN "frequency",
DROP COLUMN "isActive",
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "percentage" DOUBLE PRECISION,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "principalId" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "appliedOn",
DROP COLUMN "appliedRank",
DROP COLUMN "notes",
ADD COLUMN     "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "position" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "remarks" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "assignedRank",
DROP COLUMN "notes",
ADD COLUMN     "rank" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "principalId" DROP NOT NULL,
ALTER COLUMN "startDate" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "notes",
ADD COLUMN     "crewId" TEXT,
ALTER COLUMN "employeeId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PRESENT';

-- AlterTable
ALTER TABLE "AuditFile" DROP COLUMN "category",
DROP COLUMN "crewId",
DROP COLUMN "description",
DROP COLUMN "pklContractId",
ADD COLUMN     "auditPeriod" TEXT NOT NULL,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Crew" DROP COLUMN "lastSignOffDate",
DROP COLUMN "lastVessel",
DROP COLUMN "shoeSize",
DROP COLUMN "waistSize",
DROP COLUMN "workClothesSize",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "passportExpiry" TIMESTAMP(3),
ADD COLUMN     "passportNumber" TEXT,
ADD COLUMN     "placeOfBirth" TEXT,
ADD COLUMN     "seamanBookExpiry" TIMESTAMP(3),
ADD COLUMN     "seamanBookNumber" TEXT,
ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'AMBER';

-- AlterTable
ALTER TABLE "CrewDocument" ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'AMBER';

-- AlterTable
ALTER TABLE "CrewReplacement" DROP COLUMN "assignmentId",
DROP COLUMN "notes",
ADD COLUMN     "remarks" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "CrewSalary" DROP COLUMN "amount",
DROP COLUMN "periodFrom",
DROP COLUMN "periodTo",
DROP COLUMN "pklContractId",
ADD COLUMN     "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "basicWage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "DisciplinaryRecord" DROP COLUMN "appealNotes",
DROP COLUMN "appealStatus",
DROP COLUMN "contractId",
DROP COLUMN "fineAmount",
DROP COLUMN "penalty",
DROP COLUMN "suspensionDays",
DROP COLUMN "violation",
DROP COLUMN "warningLevel",
ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedBy" TEXT,
ADD COLUMN     "severity" TEXT NOT NULL,
ADD COLUMN     "vesselId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Dispatch" DROP COLUMN "dispatchChecklistUrl",
DROP COLUMN "joinInstructionUrl",
DROP COLUMN "pklContractId",
DROP COLUMN "primaryFlightId",
DROP COLUMN "ticketFileUrl",
ADD COLUMN     "dispatchDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "flightNumber" TEXT,
ADD COLUMN     "port" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "vesselId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE "DocumentReceiving" DROP COLUMN "lastVessel",
DROP COLUMN "note",
DROP COLUMN "receivedByUserId",
DROP COLUMN "shoeSize",
DROP COLUMN "signOffDate",
DROP COLUMN "waistSize",
DROP COLUMN "workClothesSize",
ADD COLUMN     "documentId" TEXT NOT NULL,
ADD COLUMN     "receivedBy" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "receivedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DocumentType" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validityMonths" INTEGER;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "hireDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "EmploymentContract" DROP COLUMN "contractTerms",
DROP COLUMN "endDate",
DROP COLUMN "fixedOvertime",
DROP COLUMN "homeAllotment",
DROP COLUMN "leavePay",
DROP COLUMN "monthlyWage",
DROP COLUMN "onboardAllowance",
DROP COLUMN "signedByAgent",
DROP COLUMN "signedByCrew",
DROP COLUMN "signedDate",
DROP COLUMN "specialAllowance",
DROP COLUMN "startDate",
DROP COLUMN "totalMonthly",
ADD COLUMN     "contractEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "contractStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'AMBER',
ADD COLUMN     "signDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExchangeExpense" DROP COLUMN "date",
DROP COLUMN "pklContractId",
DROP COLUMN "receiptUrl",
DROP COLUMN "type",
ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "expenseDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "idrAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "crewId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "applicationId",
DROP COLUMN "conductedAt",
DROP COLUMN "notes",
DROP COLUMN "scheduledAt",
DROP COLUMN "score",
ADD COLUMN     "crewId" TEXT NOT NULL,
ADD COLUMN     "interviewDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "interviewerId" SET NOT NULL,
ALTER COLUMN "result" SET NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "contractorName",
DROP COLUMN "date",
DROP COLUMN "notes",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "dueDate" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "LeavePay" DROP COLUMN "pklContractId",
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "days" INTEGER NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "leaveType" TEXT NOT NULL,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "MedicalCheck" DROP COLUMN "isFit",
DROP COLUMN "referralDocUrl",
DROP COLUMN "resultDocUrl",
ADD COLUMN     "doctorName" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "result" TEXT NOT NULL,
ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'RED',
ALTER COLUMN "clinicName" SET NOT NULL,
ALTER COLUMN "checkDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "OfficeExpense" DROP COLUMN "createdById",
DROP COLUMN "date",
DROP COLUMN "type",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "expenseDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "expenseType" "ExpenseType" NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Orientation" DROP COLUMN "completed",
DROP COLUMN "conductedBy",
DROP COLUMN "employeeId",
DROP COLUMN "notes",
DROP COLUMN "orientationDate",
DROP COLUMN "topics",
DROP COLUMN "trainer",
ADD COLUMN     "crewId" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "PKLContract" DROP COLUMN "approvedSyahbandarAt",
DROP COLUMN "contractType",
DROP COLUMN "flag",
DROP COLUMN "ownerName",
DROP COLUMN "pklFileUrl",
DROP COLUMN "salaryAmount",
DROP COLUMN "salaryCurrency",
DROP COLUMN "salaryType",
DROP COLUMN "seaFileUrl",
DROP COLUMN "submittedToSyahbandarAt",
ADD COLUMN     "basicWage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "contractNumber" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "principalId" TEXT,
ADD COLUMN     "rank" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'AMBER',
ADD COLUMN     "signDate" TIMESTAMP(3),
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "vesselId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PettyCash" DROP COLUMN "balance",
DROP COLUMN "lastUpdated",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "expenseDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "PrepareJoining" DROP COLUMN "bstCertificate",
DROP COLUMN "bstCompleted",
DROP COLUMN "cocCertificate",
DROP COLUMN "cocCompleted",
DROP COLUMN "copCertificate",
DROP COLUMN "copCompleted",
DROP COLUMN "flagCertificate",
DROP COLUMN "flagCompleted",
DROP COLUMN "gocCertificate",
DROP COLUMN "gocCompleted",
DROP COLUMN "kmlCertificate",
DROP COLUMN "kmlCompleted",
DROP COLUMN "koreaCompleted",
DROP COLUMN "koreaLicense",
DROP COLUMN "medicalCheck",
DROP COLUMN "medicalCompleted",
DROP COLUMN "replacementId",
DROP COLUMN "vesselType",
DROP COLUMN "visaCompleted",
DROP COLUMN "visaRequired",
ADD COLUMN     "crewId" TEXT NOT NULL,
ADD COLUMN     "hotelBooked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transportReady" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vesselId" TEXT;

-- AlterTable
ALTER TABLE "Principal" ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'GREEN';

-- AlterTable
ALTER TABLE "Recruitment" DROP COLUMN "appliedDate",
DROP COLUMN "candidateName",
DROP COLUMN "interviewDate",
DROP COLUMN "interviewer",
DROP COLUMN "notes",
DROP COLUMN "position",
DROP COLUMN "result",
ADD COLUMN     "crewId" TEXT NOT NULL,
ADD COLUMN     "recruiterId" TEXT NOT NULL,
ADD COLUMN     "recruitmentDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "StatementOfAccount" DROP COLUMN "contractorName",
DROP COLUMN "fileUrl",
DROP COLUMN "periodFrom",
DROP COLUMN "periodTo",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "period" TEXT NOT NULL,
ADD COLUMN     "soaNumber" TEXT NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TransportLog" DROP COLUMN "cost",
DROP COLUMN "date",
DROP COLUMN "fromLocation",
DROP COLUMN "notes",
DROP COLUMN "purpose",
DROP COLUMN "toLocation",
DROP COLUMN "userId",
ADD COLUMN     "driverName" TEXT,
ADD COLUMN     "dropLocation" TEXT,
ADD COLUMN     "loggedBy" TEXT NOT NULL,
ADD COLUMN     "pickupDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pickupLocation" TEXT NOT NULL,
ADD COLUMN     "pickupTime" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "transportType" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vehicleNumber" TEXT,
ALTER COLUMN "crewId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Vessel" ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'GREEN';

-- AlterTable
ALTER TABLE "VisaApplication" DROP COLUMN "approvedAt",
DROP COLUMN "notes",
DROP COLUMN "rejectedAt",
DROP COLUMN "submittedAt",
DROP COLUMN "visaFileUrl",
ADD COLUMN     "applicationDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "issueDate" TIMESTAMP(3),
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sensitivity" "DataSensitivity" NOT NULL DEFAULT 'AMBER',
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "WageScaleHeader" DROP COLUMN "agencyAgreementId",
DROP COLUMN "currency",
DROP COLUMN "effectiveDate",
DROP COLUMN "expiryDate",
DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "principalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WageScaleItem" DROP COLUMN "description",
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "component",
ADD COLUMN     "component" "WageComponent" NOT NULL;

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "DisciplinaryCase";

-- DropTable
DROP TABLE "DisciplineRule";

-- DropTable
DROP TABLE "Flight";

-- DropTable
DROP TABLE "LetterGuarantee";

-- DropTable
DROP TABLE "TrainingAssignment";

-- DropTable
DROP TABLE "TrainingTemplate";

-- DropTable
DROP TABLE "WageComponentDetail";

-- DropTable
DROP TABLE "WageScale";

-- DropEnum
DROP TYPE "ApplicationStatus";

-- DropEnum
DROP TYPE "AssignmentStatus";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "DispatchStatus";

-- DropEnum
DROP TYPE "FlightLegType";

-- DropEnum
DROP TYPE "PKLStatus";

-- DropEnum
DROP TYPE "ReplacementStatus";

-- DropEnum
DROP TYPE "SalaryType";

-- DropEnum
DROP TYPE "TrainingType";

-- DropEnum
DROP TYPE "VesselType";

-- DropEnum
DROP TYPE "VisaStatus";

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_code_key" ON "DocumentType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PKLContract_contractNumber_key" ON "PKLContract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StatementOfAccount_soaNumber_key" ON "StatementOfAccount"("soaNumber");

-- AddForeignKey
ALTER TABLE "PKLContract" ADD CONSTRAINT "PKLContract_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PKLContract" ADD CONSTRAINT "PKLContract_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WageScaleHeader" ADD CONSTRAINT "WageScaleHeader_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WageScaleItem" ADD CONSTRAINT "WageScaleItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "EmploymentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orientation" ADD CONSTRAINT "Orientation_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment" ADD CONSTRAINT "Recruitment_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepareJoining" ADD CONSTRAINT "PrepareJoining_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewSalary" ADD CONSTRAINT "CrewSalary_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "EmploymentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePay" ADD CONSTRAINT "LeavePay_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "EmploymentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyFee" ADD CONSTRAINT "AgencyFee_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyFee" ADD CONSTRAINT "AgencyFee_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "EmploymentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeExpense" ADD CONSTRAINT "OfficeExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeExpense" ADD CONSTRAINT "ExchangeExpense_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyAgreement" ADD CONSTRAINT "AgencyAgreement_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReceiving" ADD CONSTRAINT "DocumentReceiving_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportLog" ADD CONSTRAINT "TransportLog_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportLog" ADD CONSTRAINT "TransportLog_loggedBy_fkey" FOREIGN KEY ("loggedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
