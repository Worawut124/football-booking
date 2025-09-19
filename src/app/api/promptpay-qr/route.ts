import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { generatePromptPayQR } from "@/lib/promptpay";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาล็อกอินก่อน" }, { status: 401 });
  }

  try {
    const { bookingId } = await request.json();

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }

    // Check if user owns this booking
    if (booking.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงการจองนี้" }, { status: 403 });
    }

    // Get payment config
    const paymentConfig = await prisma.paymentConfig.findFirst();
    if (!paymentConfig?.promptPayId) {
      return NextResponse.json({ error: "ไม่พบการตั้งค่า PromptPay" }, { status: 500 });
    }

    // Generate PromptPay QR code with fixed deposit amount
    const depositAmount = paymentConfig.depositAmount || 100;
    const qrCodeDataURL = await generatePromptPayQR(paymentConfig.promptPayId, depositAmount);

    // Update booking with expiration time (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await prisma.booking.update({
      where: { id: bookingId },
      data: { expiresAt }
    });

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      amount: depositAmount,
      expiresAt: expiresAt.toISOString(),
      promptPayId: paymentConfig.promptPayId
    });

  } catch (error) {
    console.error("Error generating PromptPay QR:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้าง QR Code" }, { status: 500 });
  }
}
