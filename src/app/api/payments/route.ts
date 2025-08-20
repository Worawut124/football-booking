import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadFile } from "@/lib/supabaseStorage";

const prisma = new PrismaClient();

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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }

    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const amount = await calculateAmount(startTime, endTime); // ใช้ฟังก์ชันคำนวณราคา

    let proofUrl: string | undefined;
    if (method === "qrcode" && proofFile) {
      const uploadResult = await uploadFile(proofFile, 'payments', 'proofs');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดหลักฐานการชำระเงินได้: ${uploadResult.error}` }, { status: 500 });
      }
      proofUrl = uploadResult.url;
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        method,
        proof: proofUrl,
        amount,
      },
    });

    const newStatus = method === "cash" ? "pending" : "paid"; // เปลี่ยนจาก "pending_confirmation" เป็น "pending"
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    console.log(`Payment created for bookingId ${bookingId}:`, payment); // Log เพื่อตรวจสอบ
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
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