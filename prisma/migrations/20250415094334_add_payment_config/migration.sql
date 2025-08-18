-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentProof" TEXT;

-- CreateTable
CREATE TABLE "PaymentConfig" (
    "id" SERIAL NOT NULL,
    "qrCode" TEXT,
    "pricePerHour" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);
