import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface Player {
  name: string;
  jerseyNumber: string;
  birthYear: string;
}

interface RequestBody {
  players: Player[];
  competitionRegistrationId?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    // Extract and verify the token
    const token = authHeader.split(" ")[1];
    let userId: number;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body: RequestBody = await request.json();
    const { players, competitionRegistrationId } = body;

    if (!players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "Players data is required" },
        { status: 400 }
      );
    }

    // Validate player data
    for (const player of players) {
      if (!player.name || !player.jerseyNumber || !player.birthYear) {
        return NextResponse.json(
          { error: "All player fields (name, jerseyNumber, birthYear) are required" },
          { status: 400 }
        );
      }
    }

    // Create players in the database
    // Note: Using any to bypass TypeScript error until migration is run
    const createdPlayers = await (prisma as any).player.createMany({
      data: players.map(player => ({
        name: player.name,
        jerseyNumber: player.jerseyNumber,
        birthYear: player.birthYear,
        userId: userId,
        competitionRegistrationId: competitionRegistrationId || null,
      })),
    });

    return NextResponse.json({
      message: "Players created successfully",
      count: createdPlayers.count,
    });

  } catch (error) {
    console.error("Error creating players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    // Extract and verify the token
    const token = authHeader.split(" ")[1];
    let userId: number;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get players for the current user
    // Note: Using any to bypass TypeScript error until migration is run
    const players = await (prisma as any).player.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(players);

  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
