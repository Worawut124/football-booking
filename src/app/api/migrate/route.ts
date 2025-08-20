import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // รัน Prisma migration
    const { execSync } = require("child_process");
    
    console.log("Starting Prisma migration...");
    
    // Generate Prisma Client
    execSync("npx prisma generate", { stdio: "inherit" });
    
    // Push schema to database (safer than migrate deploy)
    execSync("npx prisma db push", { stdio: "inherit" });
    
    console.log("Migration completed successfully!");
    
    return NextResponse.json({ 
      success: true, 
      message: "Database migration completed successfully" 
    });
    
  } catch (error) {
    console.error("Migration failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    // ทดสอบการเชื่อมต่อ database
    await prisma.$connect();
    
    // ทดสอบ query ง่ายๆ
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      userCount 
    });
    
  } catch (error) {
    console.error("Database connection failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
