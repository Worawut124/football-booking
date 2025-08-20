import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcrypt";

// PUT: อัพเดทข้อมูลผู้ใช้
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await params;
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const { name, email, password, role } = await req.json();
  if (!name || !email || !role) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  try {
    const userId = parseInt(id);
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const emailCheck = await prisma.user.findFirst({
      where: { email, id: { not: userId } },
    });
    if (emailCheck) {
      return NextResponse.json({ error: "อีเมลนี้มีอยู่ในระบบแล้ว" }, { status: 409 });
    }

    const updateData: any = { name, email, role };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถอัพเดทผู้ใช้ได้" }, { status: 500 });
  }
}

// DELETE: ลบผู้ใช้
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await params;
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const userId = parseInt(id);
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    if (userId === parseInt(session.user.id as string)) {
      return NextResponse.json({ error: "ไม่สามารถลบตัวเองได้" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: "ลบผู้ใช้สำเร็จ" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถลบผู้ใช้ได้" }, { status: 500 });
  }
}