import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, name, phone, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้แล้ว" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    );
  }
}