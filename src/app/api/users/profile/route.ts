import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "ไม่ได้ล็อกอิน" }, { status: 401 });
  }

  const { name, email, password } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  try {
    const updateData: any = { name, email };

    // ถ้ามีการส่งรหัสผ่านใหม่มา ให้แฮชและอัพเดท
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // แปลง session.user.id จาก string เป็น number
    const userId = parseInt(session.user.id as string);

    const updatedUser = await prisma.user.update({
      where: { id: userId }, // ใช้ userId ที่แปลงเป็น number แล้ว
      data: updateData,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถอัพเดทข้อมูลผู้ใช้ได้" }, { status: 500 });
  }
}