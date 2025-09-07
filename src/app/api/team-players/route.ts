import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log("GET request received for team players");
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');
    
    console.log("Registration ID:", registrationId);

    if (!registrationId) {
      console.log("Missing registration ID");
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

    console.log(`Found ${players.length} players for registration ${registrationId}`);
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
  let requestBody;
  
  try {
    console.log("=== PUT request received ===");
    
    // Get session
    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user);
    console.log("Session role:", session?.user?.role);
    
    // Check authentication
    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    // Check authorization
    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      console.log("Access denied - insufficient permissions. Role:", session.user.role);
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล" },
        { status: 403 }
      );
    }

    // Parse request body
    try {
      requestBody = await request.json();
      console.log("Request body parsed:", requestBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { playerId, name, jerseyNumber, birthYear } = requestBody;

    // Validate required fields
    if (!playerId) {
      console.log("Missing playerId");
      return NextResponse.json(
        { error: "ไม่พบรหัสนักเตะ" },
        { status: 400 }
      );
    }

    if (!name || name.trim() === '') {
      console.log("Missing or empty name");
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ-นามสกุล" },
        { status: 400 }
      );
    }

    if (!jerseyNumber) {
      console.log("Missing jerseyNumber");
      return NextResponse.json(
        { error: "กรุณากรอกเบอร์เสื้อ" },
        { status: 400 }
      );
    }

    if (!birthYear) {
      console.log("Missing birthYear");
      return NextResponse.json(
        { error: "กรุณากรอกปีเกิด" },
        { status: 400 }
      );
    }

    // Validate data types and ranges
    const playerIdNum = parseInt(playerId);
    const jerseyNum = parseInt(jerseyNumber);
    const birthYearNum = parseInt(birthYear);

    if (isNaN(playerIdNum)) {
      return NextResponse.json(
        { error: "รหัสนักเตะไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
      return NextResponse.json(
        { error: "เบอร์เสื้อต้องเป็นตัวเลข 1-99" },
        { status: 400 }
      );
    }

    if (isNaN(birthYearNum) || birthYearNum < 2400 || birthYearNum > 2600) {
      return NextResponse.json(
        { error: "ปีเกิดต้องเป็นตัวเลข 2400-2600" },
        { status: 400 }
      );
    }

    console.log("Validation passed. Looking for player with ID:", playerIdNum);

    // Get the current player to check if it exists and get registration ID
    const currentPlayer = await (prisma as any).player.findUnique({
      where: { id: playerIdNum },
      select: { 
        id: true,
        name: true,
        jerseyNumber: true,
        birthYear: true,
        competitionRegistrationId: true 
      }
    });

    if (!currentPlayer) {
      console.log("Player not found with ID:", playerIdNum);
      return NextResponse.json(
        { error: "ไม่พบนักเตะที่ระบุ" },
        { status: 404 }
      );
    }

    console.log("Current player found:", currentPlayer);

    // Check if jersey number is already taken by another player in the same registration
    const existingPlayer = await (prisma as any).player.findFirst({
      where: {
        jerseyNumber: jerseyNumber.toString(), // Convert to string
        competitionRegistrationId: currentPlayer.competitionRegistrationId,
        id: {
          not: playerIdNum
        }
      }
    });

    if (existingPlayer) {
      console.log("Jersey number conflict:", existingPlayer);
      return NextResponse.json(
        { error: `เบอร์เสื้อ ${jerseyNumber} ถูกใช้แล้วโดย ${existingPlayer.name}` },
        { status: 400 }
      );
    }

    console.log("No jersey number conflict. Proceeding with update...");

    // Update the player
    const updatedPlayer = await (prisma as any).player.update({
      where: { id: playerIdNum },
      data: {
        name: name.trim(),
        jerseyNumber: jerseyNumber.toString(), // Convert to string
        birthYear: birthYear.toString(), // Convert to string as well
      },
    });

    console.log("Player updated successfully:", updatedPlayer);

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลนักเตะเรียบร้อยแล้ว",
      player: updatedPlayer
    });

  } catch (error: any) {
    console.error("=== Error updating player ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body was:", requestBody);
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "ข้อมูลซ้ำกับที่มีอยู่แล้ว" },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "ไม่พบนักเตะที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE request received");
    
    const session = await getServerSession(authOptions);
    console.log("Session:", session?.user);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      console.log("Access denied for role:", session.user.role);
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการลบข้อมูล" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    console.log("Player ID to delete:", playerId);

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const playerIdNum = parseInt(playerId);
    if (isNaN(playerIdNum)) {
      return NextResponse.json(
        { error: "Player ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Check if player exists before deleting
    const existingPlayer = await (prisma as any).player.findUnique({
      where: { id: playerIdNum }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: "ไม่พบนักเตะที่ต้องการลบ" },
        { status: 404 }
      );
    }

    // Delete the player
    await (prisma as any).player.delete({
      where: { id: playerIdNum },
    });

    console.log("Player deleted successfully");

    return NextResponse.json({ 
      success: true,
      message: "ลบนักเตะเรียบร้อยแล้ว" 
    });

  } catch (error: any) {
    console.error("Error deleting player:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "ไม่พบนักเตะที่ต้องการลบ" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}