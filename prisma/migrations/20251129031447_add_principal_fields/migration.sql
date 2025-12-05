-- AlterTable
ALTER TABLE "Principal" ADD COLUMN     "agreementDate" TIMESTAMP(3),
ADD COLUMN     "agreementExpiry" TIMESTAMP(3),
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "Vessel" ADD COLUMN     "principalId" TEXT;

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
