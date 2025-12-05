-- CreateEnum
CREATE TYPE "ContractKind" AS ENUM ('SEA', 'OFFICE_PKL');

-- AlterTable
ALTER TABLE "EmploymentContract" ADD COLUMN     "contractKind" "ContractKind" NOT NULL DEFAULT 'SEA';
