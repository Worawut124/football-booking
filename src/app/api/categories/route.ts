import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงหมวดหมู่" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    console.log("Received name:", name); // Log เพื่อตรวจสอบ
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 });
    }

    const category = await prisma.category.create({ data: { name } });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { id, name } = await request.json();
    if (!id || !name || name.trim() === "") {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID หมวดหมู่" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });
    return NextResponse.json({ message: "ลบหมวดหมู่สำเร็จ" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบหมวดหมู่" }, { status: 500 });
  }
}