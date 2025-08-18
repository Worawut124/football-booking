/*
  Warnings:

  - Added the required column `amount` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "amount" FLOAT; -- ลบ NOT NULL ออก

-- อัปเดตข้อมูลที่มีอยู่ให้มีค่าเริ่มต้น (เช่น 0 หรือตามที่ต้องการ)
UPDATE "Payment" SET "amount" = 0 WHERE "amount" IS NULL;

-- เพิ่ม constraint NOT NULL กลับเข้าไปหลังจากอัปเดตข้อมูล
ALTER TABLE "Payment" ALTER COLUMN "amount" SET NOT NULL;


-- อัปเดต amount ตามระยะเวลาการจอง
UPDATE "Payment"
SET "amount" = CASE
  WHEN EXTRACT(EPOCH FROM ("Booking"."endTime" - "Booking"."startTime")) / 60 = 60 THEN 600
  WHEN EXTRACT(EPOCH FROM ("Booking"."endTime" - "Booking"."startTime")) / 60 = 90 THEN 950
  ELSE CEIL(EXTRACT(EPOCH FROM ("Booking"."endTime" - "Booking"."startTime")) / 60 / 30) * 300
END
FROM "Booking"
WHERE "Payment"."bookingId" = "Booking"."id";

-- เพิ่ม constraint NOT NULL
ALTER TABLE "Payment" ALTER COLUMN "amount" SET NOT NULL;