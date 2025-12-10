-- Ensure the document receipt table uses application-managed timestamps
ALTER TABLE "DocumentReceipt" ALTER COLUMN "updatedAt" DROP DEFAULT;
