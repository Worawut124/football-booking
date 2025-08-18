/*
  Warnings:

  - A unique constraint covering the columns `[teamName]` on the table `CompetitionRegistration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_teamName_key" ON "CompetitionRegistration"("teamName");
