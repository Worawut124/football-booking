import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadFile, deleteFile } from "@/lib/supabaseStorage";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const products = await prisma.product.findMany({ include: { category: true } });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
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
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string);
    const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null;
    const imageFile = formData.get("image") as File | null;

    if (!name || price == null || stock == null) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }
    if (price < 0 || stock < 0) {
      return NextResponse.json({ error: "ราคาและสต็อกต้องไม่ติดลบ" }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile) {
      const uploadResult = await uploadFile(imageFile, 'products', 'images');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดรูปภาพได้: ${uploadResult.error}` }, { status: 500 });
      }
      imageUrl = uploadResult.url;
    }

    const product = await prisma.product.create({
      data: { name, price, stock, categoryId, imageData: imageUrl },
      include: { category: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string);
    const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null;
    const imageFile = formData.get("image") as File | null;
    const imageDataFromForm = formData.get("imageData") as string | null; // รับ imageData เดิมจาก UI

    if (!id || !name || price == null || stock == null) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }
    if (price < 0 || stock < 0) {
      return NextResponse.json({ error: "ราคาและสต็อกต้องไม่ติดลบ" }, { status: 400 });
    }

    // ดึงข้อมูลสินค้าปัจจุบันเพื่อใช้ imageData เดิมถ้าไม่มีการอัปโหลดใหม่
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    let newImageUrl = existingProduct.imageData; // ใช้ imageData เดิมเป็นค่าเริ่มต้น
    if (imageFile) {
      // ลบไฟล์เก่าถ้ามี
      if (existingProduct.imageData && existingProduct.imageData.startsWith('http')) {
        const urlParts = existingProduct.imageData.split('/');
        const oldPath = urlParts.slice(-2).join('/'); // images/filename
        await deleteFile('products', oldPath);
      }

      const uploadResult = await uploadFile(imageFile, 'products', 'images');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดรูปภาพได้: ${uploadResult.error}` }, { status: 500 });
      }
      newImageUrl = uploadResult.url;
    } else if (imageDataFromForm) {
      newImageUrl = imageDataFromForm; // ใช้ imageData ที่ส่งมาจาก UI ถ้ามี
    }

    const product = await prisma.product.update({
      where: { id },
      data: { name, price, stock, categoryId, imageData: newImageUrl },
      include: { category: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID สินค้า" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบสินค้า" }, { status: 500 });
  }
}