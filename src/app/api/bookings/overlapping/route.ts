import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fieldId = parseInt(searchParams.get("fieldId") || "0");
  const date = searchParams.get("date");
  const excludeId = searchParams.get("excludeId") ? parseInt(searchParams.get("excludeId") || "0") : undefined;

  if (!fieldId || !date) {
    return NextResponse.json({ error: "กรุณาระบุ fieldId และ date" }, { status: 400 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        fieldId,
        startTime: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`),
        },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    const startTimes: string[] = [];
    const endTimes: string[] = [];
    const overlappingTimes: string[] = [];

    bookings.forEach((booking) => {
      const bookingStart = format(new Date(booking.startTime), "HH:mm");
      const bookingEnd = format(new Date(booking.endTime), "HH:mm");

      // เพิ่มช่วงเวลาที่ทับซ้อน (รวมช่วง 30 นาทีระหว่าง start และ end)
      const start = parseInt(bookingStart.split(":")[0]) * 60 + parseInt(bookingStart.split(":")[1]);
      const end = parseInt(bookingEnd.split(":")[0]) * 60 + parseInt(bookingEnd.split(":")[1]);
      for (let time = start; time <= end; time += 30) {
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        if (time === start && !startTimes.includes(timeStr)) startTimes.push(timeStr);
        if (time === end && !endTimes.includes(timeStr)) endTimes.push(timeStr);
        if (time > start && time < end && !overlappingTimes.includes(timeStr)) overlappingTimes.push(timeStr);
      }
    });

    // รวม overlappingTimes เข้ากับ startTimes และ endTimes
    overlappingTimes.forEach((time) => {
      if (!startTimes.includes(time)) startTimes.push(time);
      if (!endTimes.includes(time)) endTimes.push(time);
    });

    return NextResponse.json({ startTimes, endTimes });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการจองที่ทับซ้อน" }, { status: 500 });
  }
}