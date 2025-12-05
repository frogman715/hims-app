/*
  Warnings:

  - The values [KOSMA_CERTIFICATE] on the enum `ComplianceSystemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ComplianceSystemType_new" AS ENUM ('DEPHUB_CERTIFICATE', 'SCHENGEN_VISA_NL');
ALTER TABLE "ExternalCompliance" ALTER COLUMN "systemType" TYPE "ComplianceSystemType_new" USING ("systemType"::text::"ComplianceSystemType_new");
ALTER TYPE "ComplianceSystemType" RENAME TO "ComplianceSystemType_old";
ALTER TYPE "ComplianceSystemType_new" RENAME TO "ComplianceSystemType";
DROP TYPE "public"."ComplianceSystemType_old";
COMMIT;
