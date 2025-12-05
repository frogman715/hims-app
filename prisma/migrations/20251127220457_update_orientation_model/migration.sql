/*
  Warnings:

  - Added the required column `topics` to the `Orientation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainer` to the `Orientation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Orientation" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topics" TEXT NOT NULL,
ADD COLUMN     "trainer" TEXT NOT NULL;
