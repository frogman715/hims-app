-- Create enums and tables for document receipt workflow
CREATE TYPE "DocumentReceiptCrewStatus" AS ENUM ('NEW', 'EX_CREW');

CREATE TABLE "DocumentReceipt" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "crewName" TEXT NOT NULL,
    "crewRank" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "vesselName" TEXT,
    "crewStatus" "DocumentReceiptCrewStatus" NOT NULL DEFAULT 'NEW',
    "lastSignOffDate" TIMESTAMP(3),
    "lastSignOffPort" TEXT,
    "wearpackSize" TEXT,
    "shoeSize" TEXT,
    "waistSize" TEXT,
    "notes" TEXT,
    "deliveryLocation" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "handedOverByName" TEXT,
    "receivedByName" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentReceiptItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "certificateName" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "remarks" TEXT,
    CONSTRAINT "DocumentReceiptItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DocumentReceipt"
    ADD CONSTRAINT "DocumentReceipt_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentReceipt"
    ADD CONSTRAINT "DocumentReceipt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentReceiptItem"
    ADD CONSTRAINT "DocumentReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "DocumentReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
