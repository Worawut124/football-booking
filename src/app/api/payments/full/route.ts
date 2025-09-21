import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/supabaseStorage";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาล็อกอินก่อน" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const bookingId = parseInt(formData.get("bookingId") as string);
    const method = (formData.get("method") as string) || "qrcode_full";
    const proofFile = formData.get("proof") as File | null;

    if (!bookingId || isNaN(bookingId)) {
      return NextResponse.json({ error: "bookingId ไม่ถูกต้อง" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }

    const sessionUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "OWNER";
    if (booking.userId !== sessionUserId && !isAdmin) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 });
    }

    if (!proofFile) {
      return NextResponse.json({ error: "กรุณาอัปโหลดหลักฐานการชำระเงิน" }, { status: 400 });
    }

    // Upload slip proof
    const uploadResult = await uploadFile(proofFile, 'payments', 'full');
    if (uploadResult.error) {
      return NextResponse.json({ error: `ไม่สามารถอัพโหลดหลักฐานการชำระเงินได้: ${uploadResult.error}` }, { status: 500 });
    }

    const proofUrl = uploadResult.url;

    // Use transaction to update payment and booking atomically
    const result = await prisma.$transaction(async (tx) => {
      // Find existing FULL payment for this booking
      const existingFull = await (tx as any).payment.findFirst({ where: { bookingId, type: 'FULL' } });
      if (!existingFull) {
        await (tx as any).payment.create({
          data: {
            bookingId,
            method,
            proof: proofUrl,
            amount: booking.totalAmount,
            type: 'FULL',
          },
        });
      } else {
        await (tx as any).payment.update({
          where: { id: existingFull.id },
          data: {
            method,
            proof: proofUrl,
            amount: booking.totalAmount,
            type: 'FULL',
          },
        });
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'paid' },
      });

      return updatedBooking;
    });

    return NextResponse.json({ message: "ชำระเต็มจำนวนสำเร็จ", booking: result }, { status: 200 });
  } catch (error) {
    console.error("Error processing full payment:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการชำระเต็มจำนวน" }, { status: 500 });
  }
}
