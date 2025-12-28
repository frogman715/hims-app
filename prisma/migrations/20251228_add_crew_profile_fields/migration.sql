-- AlterTable
ALTER TABLE "Crew" ADD COLUMN "photoUrl" TEXT,
ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Crew_slug_key" ON "Crew"("slug");
