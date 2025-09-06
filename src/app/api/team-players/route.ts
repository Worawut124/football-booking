import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
