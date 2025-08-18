/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Competition` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CompetitionRegistration` table. All the data in the column will be lost.
  - The `status` column on the `CompetitionRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Competition" DROP COLUMN "updatedAt",
ALTER COLUMN "maxTeams" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "CompetitionRegistration" DROP COLUMN "updatedAt",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
