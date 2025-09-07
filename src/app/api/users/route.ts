import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcrypt";

// GET: ดึงรายการผู้ใช้ทั้งหมด
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" }, { status: 500 });
  }
}

// POST: เพิ่มผู้ใช้ใหม่
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { name, email, phone, password, role } = await req.json();
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "อีเมลนี้มีอยู่ในระบบแล้ว" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role,
    };

    // เพิ่มข้อมูล phone ถ้ามีการส่งมา
    if (phone) {
      userData.phone = phone;
    }

    const newUser = await prisma.user.create({
      data: userData,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถเพิ่มผู้ใช้ได้" }, { status: 500 });
  }
}