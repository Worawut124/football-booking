import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadFile } from "@/lib/supabaseStorage";

import { prisma } from "@/lib/prisma";

// ฟังก์ชันคำนวณราคาโดยใช้ paymentConfig
async function calculateAmount(startTime: Date, endTime: Date) {
  const paymentConfig = await prisma.paymentConfig.findFirst();
  if (!paymentConfig) {
    throw new Error("ไม่พบการตั้งค่าการชำระเงิน");
  }

  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const halfHourUnits = Math.ceil(durationMinutes / 30); // แบ่งเป็นหน่วย 30 นาที (ปัดขึ้น)
  const totalPrice = halfHourUnits * paymentConfig.pricePerHalfHour; // ราคารวม = จำนวนหน่วย × ราคาต่อ 30 นาที

  return totalPrice;
}

// Get deposit amount from config
async function getDepositAmount() {
  const paymentConfig = await prisma.paymentConfig.findFirst();
  return paymentConfig?.depositAmount || 100;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาล็อกอินก่อน" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const bookingId = parseInt(formData.get("bookingId") as string);
    const method = formData.get("method") as string;
    const proofFile = formData.get("proof") as File | null;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }

    // Check if booking has expired
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      return NextResponse.json({ error: "การจองหมดอายุแล้ว กรุณาทำการจองใหม่" }, { status: 410 });
    }

    const depositAmount = await getDepositAmount();

    let proofUrl: string | undefined;
    if (method === "qrcode" && proofFile) {
      const uploadResult = await uploadFile(proofFile, 'payments', 'proofs');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดหลักฐานการชำระเงินได้: ${uploadResult.error}` }, { status: 500 });
      }
      proofUrl = uploadResult.url;
    }

    // Server-side idempotency: prevent duplicate payments for the same booking
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { bookingId } });
      if (existing) {
        // Indicate to caller it's already processed
        throw Object.assign(new Error("ALREADY_PAID"), { code: "ALREADY_PAID" });
      }

      const created = await tx.payment.create({
        data: { 
          bookingId, 
          method, 
          proof: proofUrl, 
          amount: depositAmount,
          isDeposit: true
        },
      });

      const newStatus = method === "cash" ? "pending_confirmation" : "deposit_paid";
      await tx.booking.update({ 
        where: { id: bookingId }, 
        data: { 
          status: newStatus,
          expiresAt: null // Clear expiration after payment
        } 
      });
      return created;
    });

    console.log(`Payment created for bookingId ${bookingId}:`, payment); // Log เพื่อตรวจสอบ
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if ((error as any)?.code === "ALREADY_PAID") {
      return NextResponse.json({ error: "คำสั่งซื้อนี้ถูกชำระ/อยู่ระหว่างดำเนินการแล้ว" }, { status: 409 });
    }
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการชำระเงิน" }, { status: 500 });
  }
}

// อัปเดตข้อมูลเก่า (เรียกครั้งเดียวหลัง migration ถ้าต้องการ)
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: { booking: true },
    });

    for (const payment of payments) {
      if (!payment.amount) {
        const startTime = new Date(payment.booking.startTime);
        const endTime = new Date(payment.booking.endTime);
        const amount = await calculateAmount(startTime, endTime); // ใช้ฟังก์ชันคำนวณราคา

        await prisma.payment.update({
          where: { id: payment.id },
          data: { amount },
        });
      }
    }

    console.log("Updated old payments"); // Log เพื่อตรวจสอบ
    return NextResponse.json({ message: "Updated old payments" });
  } catch (error) {
    console.error("Error updating old payments:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูลเก่า" }, { status: 500 });
  }
}