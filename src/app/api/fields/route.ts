import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const fields = await prisma.field.findMany();
  return NextResponse.json(fields);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { name, location } = await request.json();

  if (!name || !location) {
    return NextResponse.json(
      { error: "กรุณาระบุชื่อสนามและสถานที่" },
      { status: 400 }
    );
  }

  const field = await prisma.field.create({
    data: {
      name,
      location,
    },
  });
  return NextResponse.json(field, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { id, name, location } = await request.json();

  if (!id || !name || !location) {
    return NextResponse.json(
      { error: "กรุณาระบุ ID, ชื่อสนาม, และสถานที่" },
      { status: 400 }
    );
  }

  const updatedField = await prisma.field.update({
    where: { id },
    data: {
      name,
      location,
    },
  });
  return NextResponse.json(updatedField);
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "กรุณาระบุ ID ของสนาม" }, { status: 400 });
  }

  await prisma.field.delete({ where: { id } });
  return NextResponse.json({ message: "ลบสำเร็จ" });
}