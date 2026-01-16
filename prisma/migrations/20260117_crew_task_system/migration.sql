-- Add CrewTask system for tracking division tasks during crew preparation

-- Task status enum
CREATE TYPE "CrewTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- Task type enum for different divisions
CREATE TYPE "CrewTaskType" AS ENUM ('MCU', 'TRAINING', 'VISA', 'CONTRACT', 'BRIEFING');

-- Main task table
CREATE TABLE "CrewTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "crewId" TEXT NOT NULL,
  "prepareJoiningId" TEXT,
  "taskType" "CrewTaskType" NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" "CrewTaskStatus" NOT NULL DEFAULT 'TODO',
  "priority" VARCHAR(50) DEFAULT 'MEDIUM',
  "assignedTo" TEXT,
  "dueDate" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "completedBy" TEXT,
  "remarks" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "CrewTask_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE,
  CONSTRAINT "CrewTask_prepareJoiningId_fkey" FOREIGN KEY ("prepareJoiningId") REFERENCES "PrepareJoining"("id") ON DELETE SET NULL,
  CONSTRAINT "CrewTask_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "CrewTask_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Indexes
CREATE INDEX "CrewTask_crewId_idx" ON "CrewTask"("crewId");
CREATE INDEX "CrewTask_prepareJoiningId_idx" ON "CrewTask"("prepareJoiningId");
CREATE INDEX "CrewTask_taskType_idx" ON "CrewTask"("taskType");
CREATE INDEX "CrewTask_status_idx" ON "CrewTask"("status");
CREATE INDEX "CrewTask_assignedTo_idx" ON "CrewTask"("assignedTo");
CREATE INDEX "CrewTask_dueDate_idx" ON "CrewTask"("dueDate");
CREATE INDEX "CrewTask_createdAt_idx" ON "CrewTask"("createdAt");
