import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadFile, deleteFile } from "@/lib/supabaseStorage";
import { prisma } from "@/lib/prisma";

// ------------------- GET -------------------
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get("teamName");

  if (!session?.user?.id) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const userId = parseInt(session.user.id);

  if (teamName) {
    try {
      const registration = await prisma.competitionRegistration.findFirst({
        where: { teamName, userId },
      });
      if (!registration) {
        return NextResponse.json({ error: "ไม่พบการสมัครที่ระบุ" }, { status: 404 });
      }
      return NextResponse.json(registration);
    } catch (error) {
      console.error("Error fetching registration status:", error);
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงสถานะ" }, { status: 500 });
    }
  }

  try {
    const registrations = await prisma.competitionRegistration.findMany({
      where: { userId },
    });
    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// ------------------- POST -------------------
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const userId = parseInt(session.user.id);

  try {
    const formData = await request.formData();
    const teamName = formData.get("teamName") as string;
    const managerName = formData.get("managerName") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const playerCount = parseInt(formData.get("playerCount") as string);
    const category = formData.get("category") as string;
    const depositFile = formData.get("depositFile") as File | null;

    if (!teamName || !managerName || !contactNumber || !playerCount || !category) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    if (playerCount < 10 || playerCount > 20) {
      return NextResponse.json({ error: "จำนวนผู้เล่นต้องอยู่ระหว่าง 10-20" }, { status: 400 });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contactNumber.replace(/-/g, ""))) {
      return NextResponse.json({ error: "เบอร์ติดต่อไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก)" }, { status: 400 });
    }

    // check duplicate teamName only
    const existingTeam = await prisma.competitionRegistration.findUnique({ where: { teamName } });
    if (existingTeam) {
      return NextResponse.json({ error: "ทีมนี้ถูกสมัครไปแล้ว" }, { status: 400 });
    }

    let depositFileUrl = null;
    if (depositFile) {
      const uploadResult = await uploadFile(depositFile, "competition-registrations", "deposits");
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดไฟล์ได้: ${uploadResult.error}` }, { status: 500 });
      }
      depositFileUrl = uploadResult.url;
    }

    const { searchParams } = new URL(request.url);
    const competitionId = parseInt(searchParams.get("competitionId") || "0");
    if (!competitionId) {
      return NextResponse.json({ error: "ไม่พบการแข่งขันที่ระบุ" }, { status: 400 });
    }

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) {
      return NextResponse.json({ error: "ไม่พบการแข่งขันที่ระบุ" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const dup = await tx.competitionRegistration.findFirst({
        where: { teamName },
      });
      if (dup) {
        throw Object.assign(new Error("ALREADY_REGISTERED"), { code: "ALREADY_REGISTERED" });
      }

      await tx.competitionRegistration.create({
        data: {
          teamName,
          managerName,
          contactNumber,
          playerCount,
          category,
          depositFileName: depositFileUrl,
          status: "PENDING",
          competition: { connect: { id: competitionId } },
          user: { connect: { id: userId } },
        },
      });
    });

    return NextResponse.json({ message: "สมัครการแข่งขันสำเร็จ" });
  } catch (error) {
    if ((error as any)?.code === "ALREADY_REGISTERED") {
      return NextResponse.json({ error: "ทีมนี้ถูกสมัครไปแล้ว" }, { status: 409 });
    }
    console.error("Error registering competition:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสมัคร" }, { status: 500 });
  }
}

// ------------------- PUT -------------------
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID" }, { status: 400 });
    }

    const existingRegistration = await prisma.competitionRegistration.findUnique({ where: { id } });
    if (!existingRegistration) {
      return NextResponse.json({ error: "ไม่พบการสมัครที่ระบุ" }, { status: 404 });
    }

    let depositFileUrl = existingRegistration.depositFileName;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const newDepositFile = formData.get("depositFile") as File | null;
      if (newDepositFile) {
        if (existingRegistration.depositFileName && existingRegistration.depositFileName.startsWith("http")) {
          const urlParts = existingRegistration.depositFileName.split("/");
          const oldPath = urlParts.slice(-2).join("/");
          await deleteFile("competition-registrations", oldPath);
        }

        const uploadResult = await uploadFile(newDepositFile, "competition-registrations", "deposits");
        if (uploadResult.error) {
          return NextResponse.json({ error: `ไม่สามารถอัพโหลดไฟล์ได้: ${uploadResult.error}` }, { status: 500 });
        }
        depositFileUrl = uploadResult.url;
      }
    } else {
      const { teamName, managerName, contactNumber, playerCount, category, status } = body;
      if (teamName || managerName || contactNumber || playerCount || category || status) {
        if (teamName) {
          const dupTeam = await prisma.competitionRegistration.findFirst({
            where: { teamName, NOT: { id } },
          });
          if (dupTeam) {
            return NextResponse.json({ error: "ทีมนี้ถูกสมัครไปแล้ว" }, { status: 400 });
          }
        }
        if (playerCount && (playerCount < 10 || playerCount > 20)) {
          return NextResponse.json({ error: "จำนวนผู้เล่นต้องอยู่ระหว่าง 10-20" }, { status: 400 });
        }
        const phoneRegex = /^[0-9]{10}$/;
        if (contactNumber && !phoneRegex.test(contactNumber.replace(/-/g, ""))) {
          return NextResponse.json({ error: "เบอร์ติดต่อไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก)" }, { status: 400 });
        }
        await prisma.competitionRegistration.update({
          where: { id },
          data: {
            teamName,
            managerName,
            contactNumber,
            playerCount,
            category,
            depositFileName: depositFileUrl,
            status: status || existingRegistration.status,
          },
        });
      } else {
        return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
      }
    }

    return NextResponse.json({ message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}

// ------------------- DELETE -------------------
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID" }, { status: 400 });
    }

    const registration = await prisma.competitionRegistration.findUnique({ where: { id } });
    if (!registration) {
      return NextResponse.json({ error: "ไม่พบการสมัครที่ระบุ" }, { status: 404 });
    }

    if (registration.depositFileName && registration.depositFileName.startsWith("http")) {
      const urlParts = registration.depositFileName.split("/");
      const filePath = urlParts.slice(-2).join("/");
      await deleteFile("competition-registrations", filePath);
    }

    await prisma.competitionRegistration.delete({ where: { id } });

    return NextResponse.json({ message: "ลบการสมัครสำเร็จ" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบ" }, { status: 500 });
  }
}
