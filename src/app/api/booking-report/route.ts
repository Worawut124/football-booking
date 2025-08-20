import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { format } from "date-fns"; // เพิ่มการนำเข้า
import { th } from "date-fns/locale"; // เพิ่มการนำเข้า

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: startDate || endDate ? {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        } : undefined,
      },
      include: {
        user: true,
        field: true,
      },
    });

    const groupedData = bookings.reduce((acc, booking) => {
      const month = format(new Date(booking.createdAt), "yyyy-MM");
      const userId = booking.userId;
      if (!acc[month]) acc[month] = {};
      acc[month][userId] = (acc[month][userId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: { [key: number]: number } });

    const report = Object.entries(groupedData).flatMap(([month, users]) =>
      Object.entries(users).map(([userId, count]) => ({
        month: format(new Date(month), "MMMM yyyy", { locale: th }),
        userId: parseInt(userId),
        userName: bookings.find((b) => b.userId === parseInt(userId))?.user.name || `User ${userId}`,
        bookingCount: count,
      }))
    ).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching booking report:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}