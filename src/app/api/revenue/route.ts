import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parse } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly";
    const dateParam = searchParams.get("date"); // รับ date เป็น optional

    // ใช้วันที่ปัจจุบันถ้าไม่มี date parameter
    const now = dateParam ? parse(dateParam, "yyyy-MM", new Date()) : new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "monthly":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "yearly":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        return NextResponse.json({ error: "ช่วงเวลาไม่ถูกต้อง" }, { status: 400 });
    }

    const paidBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["pending", "paid"] }, // ดึงทั้ง pending และ paid
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        payment: true,
        user: true,
        field: true,
      },
    });

    const revenueData = paidBookings.map((booking) => ({
      id: booking.id,
      userName: booking.user?.name || "ไม่ระบุ",
      fieldName: booking.field?.name || "ไม่ระบุ",
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount || 0,
    }));

    const totalRevenue = paidBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    return NextResponse.json({
      revenueData,
      totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลรายได้" }, { status: 500 });
  }
}