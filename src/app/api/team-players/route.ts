import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }

    // Get players for the specific registration
    const players = await (prisma as any).player.findMany({
      where: {
        competitionRegistrationId: parseInt(registrationId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(players);

  } catch (error) {
    console.error("Error fetching team players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล" },
        { status: 403 }
      );
    }

    const { playerId, name, jerseyNumber, birthYear } = await request.json();

    if (!playerId || !name || !jerseyNumber || !birthYear) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Check if jersey number is already taken by another player in the same registration
    const existingPlayer = await (prisma as any).player.findFirst({
      where: {
        jerseyNumber: parseInt(jerseyNumber),
        competitionRegistrationId: {
          equals: (await (prisma as any).player.findUnique({
            where: { id: parseInt(playerId) },
            select: { competitionRegistrationId: true }
          })).competitionRegistrationId
        },
        id: {
          not: parseInt(playerId)
        }
      }
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: `เบอร์เสื้อ ${jerseyNumber} ถูกใช้แล้ว` },
        { status: 400 }
      );
    }

    const updatedPlayer = await (prisma as any).player.update({
      where: { id: parseInt(playerId) },
      data: {
        name,
        jerseyNumber: parseInt(jerseyNumber),
        birthYear: parseInt(birthYear),
      },
    });

    return NextResponse.json(updatedPlayer);

  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการลบข้อมูล" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    await (prisma as any).player.delete({
      where: { id: parseInt(playerId) },
    });

    return NextResponse.json({ message: "ลบนักเตะเรียบร้อยแล้ว" });

  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
