import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { uploadFile, deleteFile } from "@/lib/supabaseStorage";

// GET: ดึงข้อมูล Payment Config
export async function GET(req: NextRequest) {
  try {
    const paymentConfig = await prisma.paymentConfig.findFirst();
    
    if (!paymentConfig) {
      const defaultConfig = await prisma.paymentConfig.create({
        data: {
          qrCode: "/qrcode-placeholder.png",
          pricePerHour: 500,
          pricePerHalfHour: 250,
          accountName: "สมชาย ใจดี",
          bankName: "ธนาคารกสิกรไทย",
          accountNumber: "123-456-7890",
          promptPayId: null,
          depositAmount: 100,
        },
      });
      return NextResponse.json(defaultConfig, { status: 200 });
    }
    
    return NextResponse.json(paymentConfig, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/payment-config:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลการชำระเงินได้" }, { status: 500 });
  }
}

// PUT: อัพเดท QR Code, ราคา, และข้อมูลบัญชี
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const pricePerHour = parseInt(formData.get("pricePerHour") as string);
    const pricePerHalfHour = parseInt(formData.get("pricePerHalfHour") as string);
    const qrCodeFile = formData.get("qrCode") as File | null;
    const accountName = formData.get("accountName") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const promptPayIdRaw = formData.get("promptPayId");
    const promptPayId = typeof promptPayIdRaw === 'string' ? promptPayIdRaw : null;
    const depositAmountRaw = formData.get("depositAmount");
    const depositAmount = depositAmountRaw != null ? parseInt(depositAmountRaw as string) : undefined;

    // Validate ราคา
    if (isNaN(pricePerHour) || pricePerHour <= 0) {
      return NextResponse.json({ error: "ราคาต่อชั่วโมงต้องเป็นตัวเลขที่มากกว่า 0" }, { status: 400 });
    }
    if (isNaN(pricePerHalfHour) || pricePerHalfHour <= 0) {
      return NextResponse.json({ error: "ราคาต่อ 30 นาทีต้องเป็นตัวเลขที่มากกว่า 0" }, { status: 400 });
    }

    // Validate มัดจำถ้ามีส่งมา
    if (depositAmountRaw != null && (isNaN(depositAmount as number) || (depositAmount as number) <= 0)) {
      return NextResponse.json({ error: "ยอดมัดจำต้องเป็นตัวเลขที่มากกว่า 0" }, { status: 400 });
    }

    // Validate ข้อมูลบัญชี (ถ้าต้องการ)
    if (!accountName.trim() || !bankName.trim() || !accountNumber.trim()) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลบัญชีให้ครบถ้วน" }, { status: 400 });
    }

    let paymentConfig = await prisma.paymentConfig.findFirst();
    
    // ถ้าไม่มี config ให้สร้างใหม่
    if (!paymentConfig) {
      paymentConfig = await prisma.paymentConfig.create({
        data: {
          qrCode: "/qrcode-placeholder.png",
          pricePerHour: 500,
          pricePerHalfHour: 250,
          accountName: "สมชาย ใจดี",
          bankName: "ธนาคารกสิกรไทย",
          accountNumber: "123-456-7890",
          promptPayId: null,
          depositAmount: 100,
        },
      });
    }

    const updateData: any = {
      pricePerHour,
      pricePerHalfHour,
      accountName,
      bankName,
      accountNumber,
    };

    // อัพเดท PromptPay ID (ยอมให้ลบได้ถ้าส่งว่าง)
    if (promptPayId !== null) {
      updateData.promptPayId = promptPayId.trim() === '' ? null : promptPayId.trim();
    }

    // อัพเดทยอดมัดจำถ้าส่งมา
    if (depositAmount !== undefined) {
      updateData.depositAmount = depositAmount;
    }

    if (qrCodeFile) {
      // ลบไฟล์เก่าถ้ามี
      if (paymentConfig.qrCode && paymentConfig.qrCode !== "/qrcode-placeholder.png" && paymentConfig.qrCode.startsWith('http')) {
        const urlParts = paymentConfig.qrCode.split('/');
        const oldPath = urlParts.slice(-2).join('/'); // images/filename
        await deleteFile('payment-config', oldPath);
      }

      const uploadResult = await uploadFile(qrCodeFile, 'payment-config', 'images');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลด QR Code ได้: ${uploadResult.error}` }, { status: 500 });
      }
      updateData.qrCode = uploadResult.url;
    }

    const updatedConfig = await prisma.paymentConfig.update({
      where: { id: paymentConfig.id },
      data: updateData,
    });

    return NextResponse.json(updatedConfig, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/payment-config:", error);
    return NextResponse.json({ error: "ไม่สามารถอัพเดทการตั้งค่าการชำระเงินได้" }, { status: 500 });
  }
}

// POST: สร้าง Payment Config ใหม่
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    // ตรวจสอบว่ามี config อยู่แล้วหรือไม่
    const existingConfig = await prisma.paymentConfig.findFirst();
    if (existingConfig) {
      return NextResponse.json({ error: "มีการตั้งค่าการชำระเงินอยู่แล้ว กรุณาใช้ PUT เพื่ออัพเดท" }, { status: 409 });
    }

    const formData = await req.formData();
    const pricePerHour = parseInt(formData.get("pricePerHour") as string) || 500;
    const pricePerHalfHour = parseInt(formData.get("pricePerHalfHour") as string) || 250;
    const qrCodeFile = formData.get("qrCode") as File | null;
    const accountName = (formData.get("accountName") as string) || "สมชาย ใจดี";
    const bankName = (formData.get("bankName") as string) || "ธนาคารกสิกรไทย";
    const accountNumber = (formData.get("accountNumber") as string) || "123-456-7890";
    const promptPayIdRaw = formData.get("promptPayId");
    const promptPayId = typeof promptPayIdRaw === 'string' ? promptPayIdRaw : null;
    const depositAmountRaw = formData.get("depositAmount");
    const depositAmount = depositAmountRaw != null ? parseInt(depositAmountRaw as string) : 100;

    // Validate ราคา
    if (isNaN(pricePerHour) || pricePerHour <= 0) {
      return NextResponse.json({ error: "ราคาต่อชั่วโมงต้องเป็นตัวเลขที่มากกว่า 0" }, { status: 400 });
    }
    if (isNaN(pricePerHalfHour) || pricePerHalfHour <= 0) {
      return NextResponse.json({ error: "ราคาต่อ 30 นาทีต้องเป็นตัวเลขที่มากกว่า 0" }, { status: 400 });
    }

    // Validate มัดจำ
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: "ยอดมัดจำต้องเป็นตัวเลขที่มากกว่า 0" }, { status: 400 });
    }

    // Validate ข้อมูลบัญชี
    if (!accountName.trim() || !bankName.trim() || !accountNumber.trim()) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลบัญชีให้ครบถ้วน" }, { status: 400 });
    }

    const createData: any = {
      pricePerHour,
      pricePerHalfHour,
      accountName,
      bankName,
      accountNumber,
      promptPayId: promptPayId?.trim() === '' ? null : promptPayId?.trim(),
      depositAmount,
      qrCode: "/qrcode-placeholder.png",
    };

    // อัพโหลด QR Code ถ้ามี
    if (qrCodeFile) {
      const uploadResult = await uploadFile(qrCodeFile, 'payment-config', 'images');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลด QR Code ได้: ${uploadResult.error}` }, { status: 500 });
      }
      createData.qrCode = uploadResult.url;
    }

    const newConfig = await prisma.paymentConfig.create({
      data: createData,
    });

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/payment-config:", error);
    return NextResponse.json({ error: "ไม่สามารถสร้างการตั้งค่าการชำระเงินได้" }, { status: 500 });
  }
}

// DELETE: ลบ Payment Config
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const paymentConfig = await prisma.paymentConfig.findFirst();
    if (!paymentConfig) {
      return NextResponse.json({ error: "ไม่พบการตั้งค่าการชำระเงิน" }, { status: 404 });
    }

    // ลบไฟล์ QR Code ถ้ามี
    if (paymentConfig.qrCode && paymentConfig.qrCode !== "/qrcode-placeholder.png" && paymentConfig.qrCode.startsWith('http')) {
      const urlParts = paymentConfig.qrCode.split('/');
      const oldPath = urlParts.slice(-2).join('/'); // images/filename
      await deleteFile('payment-config', oldPath);
    }

    await prisma.paymentConfig.delete({
      where: { id: paymentConfig.id },
    });

    return NextResponse.json({ message: "ลบการตั้งค่าการชำระเงินสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/payment-config:", error);
    return NextResponse.json({ error: "ไม่สามารถลบการตั้งค่าการชำระเงินได้" }, { status: 500 });
  }
}