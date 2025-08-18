/*
  Warnings:

  - The `status` column on the `CompetitionRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CompetitionRegistration" DROP COLUMN "status",
ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING';
