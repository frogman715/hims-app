DO $$
BEGIN
    CREATE TYPE "SeaServiceStatus" AS ENUM ('COMPLETED', 'ONGOING', 'TERMINATED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SeaServiceHistory" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "vesselName" TEXT NOT NULL,
    "imoNumber" TEXT,
    "companyName" TEXT,
    "flag" TEXT,
    "vesselType" TEXT,
    "rank" TEXT NOT NULL,
    "department" TEXT,
    "signOnDate" TIMESTAMP(3) NOT NULL,
    "signOffDate" TIMESTAMP(3),
    "portOfSignOn" TEXT,
    "portOfSignOff" TEXT,
    "contractType" "ContractKind",
    "status" "SeaServiceStatus" NOT NULL DEFAULT 'COMPLETED',
    "reasonForSignOff" TEXT,
    "sourceDocumentType" TEXT,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeaServiceHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SeaServiceHistory_crewId_signOnDate_idx" ON "SeaServiceHistory"("crewId", "signOnDate");

CREATE INDEX IF NOT EXISTS "SeaServiceHistory_crewId_status_idx" ON "SeaServiceHistory"("crewId", "status");

CREATE INDEX IF NOT EXISTS "SeaServiceHistory_crewId_verificationStatus_idx" ON "SeaServiceHistory"("crewId", "verificationStatus");

CREATE INDEX IF NOT EXISTS "SeaServiceHistory_signOffDate_idx" ON "SeaServiceHistory"("signOffDate");

DO $$
BEGIN
    ALTER TABLE "SeaServiceHistory" ADD CONSTRAINT "SeaServiceHistory_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "SeaServiceHistory" ADD CONSTRAINT "SeaServiceHistory_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
