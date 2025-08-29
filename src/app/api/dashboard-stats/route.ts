import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const now = new Date();
    const today = startOfDay(now);
    const endOfToday = endOfDay(now);
    
    // เริ่มต้นของสัปดาห์ (จันทร์)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    // สร้าง array ของวันในสัปดาห์
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // 1. จำนวนผู้ใช้ทั้งหมด
    const totalUsers = await prisma.user.count();

    // 2. การจองในวันนี้
    const todayBookings = await prisma.booking.count({
      where: {
        startTime: {
          gte: today,
          lte: endOfToday,
        },
      },
    });

    // 3. รายได้การจองในวันนี้
    const todayBookingRevenue = await prisma.booking.aggregate({
      where: {
        startTime: {
          gte: today,
          lte: endOfToday,
        },
        status: { in: ["pending", "paid"] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // 4. รายได้การขายสินค้าในวันนี้
    const todayProductRevenue = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: today,
          lte: endOfToday,
        },
        status: { in: ["ชำระแล้ว", "จัดส่งแล้ว"] },
      },
      _sum: {
        price: true,
      },
    });

    // 5. รายได้รายสัปดาห์ (การจอง)
    const weeklyRevenue = await Promise.all(
      weekDays.map(async (day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const dayRevenue = await prisma.booking.aggregate({
          where: {
            startTime: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: { in: ["pending", "paid"] },
          },
          _sum: {
            totalAmount: true,
          },
        });
        
        return dayRevenue._sum.totalAmount || 0;
      })
    );

    // 6. สถิติเพิ่มเติม
    const totalFields = await prisma.field.count();
    const totalProducts = await prisma.product.count();
    const pendingBookings = await prisma.booking.count({
      where: { status: "pending" },
    });
    const paidBookings = await prisma.booking.count({
      where: { status: "paid" },
    });

    // 7. รายได้รวมของเดือนนี้
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const monthlyBookingRevenue = await prisma.booking.aggregate({
      where: {
        startTime: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        status: { in: ["pending", "paid"] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const monthlyProductRevenue = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        status: { in: ["ชำระแล้ว", "จัดส่งแล้ว"] },
      },
      _sum: {
        price: true,
      },
    });

    return NextResponse.json({
      totalUsers,
      todayBookings,
      todayBookingRevenue: todayBookingRevenue._sum.totalAmount || 0,
      todayProductRevenue: todayProductRevenue._sum.price || 0,
      weeklyRevenue,
      totalFields,
      totalProducts,
      pendingBookings,
      paidBookings,
      monthlyBookingRevenue: monthlyBookingRevenue._sum.totalAmount || 0,
      monthlyProductRevenue: monthlyProductRevenue._sum.price || 0,
      weekDays: weekDays.map(day => format(day, 'yyyy-MM-dd')),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด" }, { status: 500 });
  }
}
