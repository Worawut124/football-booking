/*
  Warnings:

  - You are about to drop the column `players` on the `CompetitionRegistration` table. All the data in the column will be lost.
  - Added the required column `category` to the `CompetitionRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CompetitionRegistration" DROP COLUMN "players",
ADD COLUMN     "category" TEXT NOT NULL;
