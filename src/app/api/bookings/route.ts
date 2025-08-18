import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

interface BookingRequest {
  userId?: number;
  fieldId: number;
  startTime: string;
  endTime: string;
  status?: string;
  totalAmount?: number;
}

async function calculateAmount(startTime: Date, endTime: Date) {
  const paymentConfig = await prisma.paymentConfig.findFirst();
  if (!paymentConfig) {
    throw new Error("ไม่พบการตั้งค่าการชำระเงิน");
  }

  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  if (durationMinutes === 60) {
    // 1 ชั่วโมง
    return paymentConfig.pricePerHour; // 600 บาท
  } else if (durationMinutes === 90) {
    // 1 ชั่วโมง 30 นาที
    return paymentConfig.pricePerHour + 300; // 600 + 300 = 900 บาท
  } else {
    // มากกว่า 1 ชั่วโมง 30 นาที
    const fullHours = Math.floor(durationMinutes / 60); // จำนวนชั่วโมงเต็ม
    const remainingMinutes = durationMinutes % 60; // นาทีที่เหลือ

    let total = fullHours * paymentConfig.pricePerHour; // คิดตามชั่วโมง
    if (remainingMinutes > 0) {
      total += 300; // ถ้ามีเศษ 30 นาที บวกเพิ่ม 300 บาท
    }
    return total;
  }
}

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { field: true, user: true, payment: true },
    });
    console.log("Bookings fetched:", bookings); // Log เพื่อตรวจสอบข้อมูล
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการจอง" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาล็อกอินก่อน" }, { status: 401 });
  }

  try {
    const { userId, fieldId, startTime, endTime, status, totalAmount } = (await request.json()) as BookingRequest;

    const sessionUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    if (isNaN(sessionUserId)) {
      return NextResponse.json({ error: "ID ผู้ใช้ไม่ถูกต้อง" }, { status: 400 });
    }

    const finalUserId = userId && (session.user.role === "ADMIN" || session.user.role === "OWNER")
      ? userId
      : sessionUserId;

    if (!finalUserId || !fieldId || !startTime || !endTime) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    if (newEndTime <= newStartTime) {
      return NextResponse.json({ error: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น" }, { status: 400 });
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        fieldId,
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlappingBooking) {
      const newStart = newStartTime.getTime();
      const newEnd = newEndTime.getTime();
      const existingStart = new Date(overlappingBooking.startTime).getTime();
      const existingEnd = new Date(overlappingBooking.endTime).getTime();

      if (newStart !== existingEnd && newEnd !== existingStart) {
        return NextResponse.json({ error: "ช่วงเวลานี้ถูกจองแล้ว" }, { status: 400 });
      }
    }

    const finalTotalAmount = totalAmount !== undefined
      ? totalAmount
      : await calculateAmount(newStartTime, newEndTime);

    const booking = await prisma.booking.create({
      data: {
        userId: finalUserId,
        fieldId,
        startTime: newStartTime,
        endTime: newEndTime,
        status: status || "pending",
        totalAmount: finalTotalAmount,
      },
      include: { field: true, user: true, payment: true },
    });
    console.log("Booking created:", booking); // Log เพื่อตรวจสอบข้อมูล
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการจอง" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาล็อกอินก่อน" }, { status: 401 });
  }

  try {
    const { id, userId, fieldId, startTime, endTime, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID การจอง" }, { status: 400 });
    }

    const sessionUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    if (isNaN(sessionUserId)) {
      return NextResponse.json({ error: "ID ผู้ใช้ไม่ถูกต้อง" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { field: true, user: true, payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }

    if (booking.userId !== sessionUserId && session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขการจองนี้" }, { status: 403 });
    }

    const finalUserId = userId && (session.user.role === "ADMIN" || session.user.role === "OWNER")
      ? userId
      : booking.userId;

    const newFieldId = fieldId ?? booking.fieldId;
    const newStartTime = startTime ? new Date(startTime) : booking.startTime;
    const newEndTime = endTime ? new Date(endTime) : booking.endTime;

    if (newEndTime <= newStartTime) {
      return NextResponse.json({ error: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น" }, { status: 400 });
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        fieldId: newFieldId,
        id: { not: id },
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (overlappingBooking) {
      const newStart = newStartTime.getTime();
      const newEnd = newEndTime.getTime();
      const existingStart = new Date(overlappingBooking.startTime).getTime();
      const existingEnd = new Date(overlappingBooking.endTime).getTime();

      if (newStart !== existingEnd && newEnd !== existingStart) {
        return NextResponse.json({ error: "ช่วงเวลานี้ถูกจองแล้ว" }, { status: 400 });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        userId: finalUserId,
        fieldId: newFieldId,
        startTime: newStartTime,
        endTime: newEndTime,
        status: status ?? booking.status,
      },
      include: { field: true, user: true, payment: true },
    });

    console.log("Booking updated:", updatedBooking); // Log เพื่อตรวจสอบข้อมูล
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขการจอง" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาล็อกอินก่อน" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const sessionUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    if (isNaN(sessionUserId)) {
      return NextResponse.json({ error: "ID ผู้ใช้ไม่ถูกต้อง" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }

    if (booking.userId !== sessionUserId && session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ยกเลิกการจองนี้" }, { status: 403 });
    }

    if (booking.status === "paid" && session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "ไม่สามารถยกเลิกการจองที่ชำระเงินแล้วได้" }, { status: 400 });
    }

    await prisma.payment.deleteMany({
      where: { bookingId: id },
    });
    await prisma.booking.delete({
      where: { id },
    });

    console.log(`Booking deleted: ID ${id}`); // Log เพื่อตรวจสอบ
    return NextResponse.json({ message: "ยกเลิกและลบการจองสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิก" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const bookings = await prisma.booking.findMany();
    const paymentConfig = await prisma.paymentConfig.findFirst();

    if (!paymentConfig) {
      return NextResponse.json({ error: "ไม่พบการตั้งค่าการชำระเงิน" }, { status: 404 });
    }

    for (const booking of bookings) {
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      const totalAmount = await calculateAmount(startTime, endTime);

      await prisma.booking.update({
        where: { id: booking.id },
        data: { totalAmount },
      });
    }

    console.log("Total amounts updated for existing bookings"); // Log เพื่อตรวจสอบ
    return NextResponse.json({ message: "Updated totalAmount for existing bookings" }, { status: 200 });
  } catch (error) {
    console.error("Error updating total amounts:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูลเก่า" }, { status: 500 });
  }
}