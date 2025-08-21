import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadFile, deleteFile } from "@/lib/supabaseStorage";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    const categories = searchParams.get("categories");

    if (categories) {
      const validCategories = [
        "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18",
        "U19", "U20", "U21", "U22", "U23", "รุ่นประชาชน"
      ];
      return NextResponse.json(validCategories);
    }

    if (id) {
      const competition = await prisma.competition.findUnique({
        where: { id },
        include: { registrations: true },
      });
      return NextResponse.json(competition ? [competition] : []);
    }

    const competitions = await prisma.competition.findMany({
      include: { registrations: true },
    });
    return NextResponse.json(competitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const maxTeams = parseInt(formData.get("maxTeams") as string) || 10;
    const imageFile = formData.get("imageFile") as File | null;

    if (!title || !description || !category) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const validCategories = [
      "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18",
      "U19", "U20", "U21", "U22", "U23", "รุ่นประชาชน"
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "หมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile) {
      const uploadResult = await uploadFile(imageFile, 'competitions', 'images');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดรูปภาพได้: ${uploadResult.error}` }, { status: 500 });
      }
      imageUrl = uploadResult.url;
    }

    await prisma.competition.create({
      data: {
        title,
        description,
        category,
        imageName: imageUrl,
        maxTeams,
      },
    });

    return NextResponse.json({ message: "เพิ่มรายการแข่งขันสำเร็จ" });
  } catch (error) {
    console.error("Error adding competition:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเพิ่ม" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID" }, { status: 400 });
    }

    // ลบ CompetitionRegistration ที่เกี่ยวข้องก่อน
    await prisma.competitionRegistration.deleteMany({
      where: { competitionId: id },
    });

    const competition = await prisma.competition.findUnique({
      where: { id },
    });

    if (competition?.imageName) {
      // ดึง path จาก URL เพื่อลบไฟล์
      const urlParts = competition.imageName.split('/');
      const filePath = urlParts.slice(-2).join('/'); // images/filename
      await deleteFile('competitions', filePath);
    }

    await prisma.competition.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ลบรายการแข่งขันสำเร็จ" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const maxTeams = parseInt(formData.get("maxTeams") as string);
    const imageFile = formData.get("imageFile") as File | null;

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID" }, { status: 400 });
    }

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: { registrations: true },
    });

    if (!competition) {
      return NextResponse.json({ error: "ไม่พบการแข่งขัน" }, { status: 404 });
    }

    if (maxTeams !== undefined && maxTeams < 1) {
      return NextResponse.json({ error: "จำนวนทีมต้องมากกว่า 0" }, { status: 400 });
    }

    if (maxTeams !== undefined && competition.registrations.length > maxTeams) {
      return NextResponse.json({ error: "จำนวนทีมที่สมัครแล้วเกินขีดจำกัดใหม่" }, { status: 400 });
    }

    const validCategories = [
      "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18",
      "U19", "U20", "U21", "U22", "U23", "รุ่นประชาชน"
    ];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: "หมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    }

    let imageUrl = competition.imageName;
    if (imageFile) {
      // ลบไฟล์เก่าถ้ามี
      if (competition.imageName) {
        const urlParts = competition.imageName.split('/');
        const oldPath = urlParts.slice(-2).join('/'); // images/filename
        await deleteFile('competitions', oldPath);
      }

      const uploadResult = await uploadFile(imageFile, 'competitions', 'images');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดรูปภาพได้: ${uploadResult.error}` }, { status: 500 });
      }
      imageUrl = uploadResult.url;
    }

    await prisma.competition.update({
      where: { id },
      data: {
        title: title || competition.title,
        description: description || competition.description,
        category: category || competition.category,
        maxTeams: maxTeams !== undefined ? maxTeams : competition.maxTeams,
        imageName: imageUrl,
      },
    });

    return NextResponse.json({ message: "อัปเดตการแข่งขันสำเร็จ" });
  } catch (error) {
    console.error("Error updating competition:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}