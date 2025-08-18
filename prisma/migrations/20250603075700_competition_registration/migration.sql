-- CreateTable
CREATE TABLE "CompetitionRegistration" (
    "id" SERIAL NOT NULL,
    "teamName" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "players" TEXT NOT NULL,
    "depositFileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_teamName_key" ON "CompetitionRegistration"("teamName");
