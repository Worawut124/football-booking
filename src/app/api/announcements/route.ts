import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { uploadFile, deleteFile, updateFile } from "@/lib/supabaseStorage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        details: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log("Announcements fetched:", announcements); // Log ข้อมูลที่ส่งกลับ
    return NextResponse.json(announcements, { status: 200 });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลข่าวได้" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ในการเพิ่มข่าว" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = formData.get("title")?.toString();
  const content = formData.get("content")?.toString();
  const details = formData.get("details")?.toString();
  const isFeatured = formData.get("isFeatured")?.toString() === "true";
  const file = formData.get("image") as File | null;

  if (!title || !content) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  let imageUrl: string | null = null;
  if (file) {
    const uploadResult = await uploadFile(file, 'announcements', 'images');
    if (uploadResult.error) {
      return NextResponse.json({ error: `ไม่สามารถอัพโหลดรูปภาพได้: ${uploadResult.error}` }, { status: 500 });
    }
    imageUrl = uploadResult.url;
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        image: imageUrl,
        details: details || null,
        isFeatured: isFeatured || false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        details: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log("Announcement created:", announcement); // Log ข้อมูลที่สร้าง
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "ไม่สามารถเพิ่มข่าวได้" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ในการแก้ไขข่าว" }, { status: 403 });
  }

  const formData = await req.formData();
  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString();
  const content = formData.get("content")?.toString();
  const details = formData.get("details")?.toString();
  const isFeatured = formData.get("isFeatured")?.toString() === "true";
  const file = formData.get("image") as File | null;

  if (!id || !title || !content) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  let imageUrl: string | null = null;
  const existingAnnouncement = await prisma.announcement.findUnique({
    where: { id: parseInt(id) },
  });

  if (file) {
    // ลบไฟล์เก่าถ้ามี
    if (existingAnnouncement?.image) {
      // ดึง path จาก URL เพื่อลบไฟล์เก่า
      const urlParts = existingAnnouncement.image.split('/');
      const oldPath = urlParts.slice(-2).join('/'); // images/filename
      await deleteFile('announcements', oldPath);
    }

    const uploadResult = await uploadFile(file, 'announcements', 'images');
    if (uploadResult.error) {
      return NextResponse.json({ error: `ไม่สามารถอัพโหลดรูปภาพได้: ${uploadResult.error}` }, { status: 500 });
    }
    imageUrl = uploadResult.url;
  }

  try {
    const announcement = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        image: imageUrl || existingAnnouncement?.image || null,
        details: details || null,
        isFeatured: isFeatured || false,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        details: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log("Announcement updated:", announcement); // Log ข้อมูลที่อัปเดต
    return NextResponse.json(announcement, { status: 200 });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "ไม่สามารถแก้ไขข่าวได้" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ในการลบข่าว" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "กรุณาระบุ ID ของข่าว" }, { status: 400 });
  }

  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
    });

    // ลบไฟล์ที่เกี่ยวข้องถ้ามี
    if (announcement?.image) {
      // ดึง path จาก URL เพื่อลบไฟล์
      const urlParts = announcement.image.split('/');
      const filePath = urlParts.slice(-2).join('/'); // images/filename
      await deleteFile('announcements', filePath);
    }

    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });
    console.log("Announcement deleted, ID:", id); // Log การลบ
    return NextResponse.json({ message: "ลบข่าวสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "ไม่สามารถลบข่าวได้" }, { status: 500 });
  }
}