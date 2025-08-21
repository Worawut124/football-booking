import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Use shared Prisma instance

// สร้าง transporter สำหรับส่งอีเมล
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "worawut.no65@gmail.com",
    pass: process.env.EMAIL_PASS || "ddovbapgmdethjkm",
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมล" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่ในระบบหรือไม่
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบอีเมลนี้ในระบบ" },
        { status: 404 }
      );
    }

    // สร้าง token สำหรับรีเซ็ตรหัสผ่าน
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // หมดอายุใน 1 ชั่วโมง

    // บันทึก token ลงในฐานข้อมูล
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // สร้างลิงก์รีเซ็ตรหัสผ่าน
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // ส่งอีเมล
    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: email,
      subject: "รีเซ็ตรหัสผ่าน - สนามบอล",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a; text-align: center;">รีเซ็ตรหัสผ่าน</h2>
          <p>สวัสดีครับ/ค่ะ</p>
          <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีในระบบจองสนามบอล</p>
          <p>กรุณาคลิกที่ลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              รีเซ็ตรหัสผ่าน
            </a>
          </div>
          <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
          <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลนี้</p>
          <p>ขอบคุณครับ/ค่ะ</p>
          <p>ทีมงานสนามบอล</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: "ส่งอีเมลรีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ",
    });

  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
