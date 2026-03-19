CREATE TABLE "RestHourRegister" (
  "id" TEXT NOT NULL,
  "crewId" TEXT NOT NULL,
  "vesselId" TEXT NOT NULL,
  "logDate" TIMESTAMP(3) NOT NULL,
  "workHours" DOUBLE PRECISION NOT NULL,
  "restHours" DOUBLE PRECISION NOT NULL,
  "minimumRestHours" DOUBLE PRECISION NOT NULL DEFAULT 10,
  "isCompliant" BOOLEAN NOT NULL DEFAULT true,
  "remarks" TEXT,
  "recordedByUserId" TEXT,
  "recordedByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RestHourRegister_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EscalationNotificationLog" (
  "id" TEXT NOT NULL,
  "ruleCode" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "ownerRole" TEXT NOT NULL,
  "recipientEmail" TEXT,
  "recipientName" TEXT,
  "deliveryChannel" TEXT NOT NULL DEFAULT 'EMAIL',
  "relatedEntityType" TEXT,
  "relatedEntityId" TEXT,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "failureReason" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EscalationNotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestHourRegister_crewId_vesselId_logDate_key"
ON "RestHourRegister"("crewId", "vesselId", "logDate");

CREATE INDEX "RestHourRegister_vesselId_logDate_idx"
ON "RestHourRegister"("vesselId", "logDate");

CREATE INDEX "RestHourRegister_crewId_logDate_idx"
ON "RestHourRegister"("crewId", "logDate");

CREATE INDEX "RestHourRegister_isCompliant_idx"
ON "RestHourRegister"("isCompliant");

CREATE INDEX "EscalationNotificationLog_ruleCode_status_idx"
ON "EscalationNotificationLog"("ruleCode", "status");

CREATE INDEX "EscalationNotificationLog_relatedEntityType_relatedEntityId_idx"
ON "EscalationNotificationLog"("relatedEntityType", "relatedEntityId");

CREATE INDEX "EscalationNotificationLog_createdAt_idx"
ON "EscalationNotificationLog"("createdAt");

ALTER TABLE "RestHourRegister"
ADD CONSTRAINT "RestHourRegister_crewId_fkey"
FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestHourRegister"
ADD CONSTRAINT "RestHourRegister_vesselId_fkey"
FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestHourRegister"
ADD CONSTRAINT "RestHourRegister_recordedByUserId_fkey"
FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
