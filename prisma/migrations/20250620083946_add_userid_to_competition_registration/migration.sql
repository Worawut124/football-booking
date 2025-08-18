/*
  Warnings:

  - You are about to drop the column `createdAt` on the `CompetitionRegistration` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CompetitionRegistration_teamName_key";

-- AlterTable
ALTER TABLE "CompetitionRegistration" DROP COLUMN "createdAt",
ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
