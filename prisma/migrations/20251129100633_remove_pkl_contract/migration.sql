/*
  Warnings:

  - You are about to drop the `PKLContract` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PKLContract" DROP CONSTRAINT "PKLContract_crewId_fkey";

-- DropForeignKey
ALTER TABLE "PKLContract" DROP CONSTRAINT "PKLContract_principalId_fkey";

-- DropForeignKey
ALTER TABLE "PKLContract" DROP CONSTRAINT "PKLContract_vesselId_fkey";

-- DropTable
DROP TABLE "PKLContract";
