import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadFile } from "@/lib/supabaseStorage";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    // ตรวจสอบ role: อนุญาต ADMIN และ FIELD_OWNER
    if (userRole !== Role.ADMIN && userRole !== Role.OWNER) {
      console.log("Access denied for role:", userRole);
      return NextResponse.json({ message: "Access denied: Admin or Field Owner only" }, { status: 403 });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const month = url.searchParams.get("month"); // รับค่าเดือน (01-12)
    const year = url.searchParams.get("year");   // รับค่าปี (เช่น 2025)

    // สร้าง whereClause สำหรับกรอง (แสดงทุกสถานะชั่วคราวเพื่อตรวจสอบ)
    const whereClause: Prisma.OrderWhereInput = {};

    // เพิ่มการกรองตาม startDate และ endDate
    if (startDate) {
      whereClause.orderDate = whereClause.orderDate || {};
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).gte = new Date(startDate);
    }
    if (endDate) {
      whereClause.orderDate = whereClause.orderDate || {};
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).lte = new Date(endDate);
    }

    // เพิ่มการกรองตามเดือนและปี
    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1); // เดือนเริ่มต้น (0-based)
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59); // สิ้นสุดเดือน
      whereClause.orderDate = whereClause.orderDate || {};
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).gte = startOfMonth;
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).lte = endOfMonth;
    } else if (month) {
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, parseInt(month) - 1, 1);
      const endOfMonth = new Date(currentYear, parseInt(month), 0, 23, 59, 59);
      whereClause.orderDate = whereClause.orderDate || {};
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).gte = startOfMonth;
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).lte = endOfMonth;
    } else if (year) {
      whereClause.orderDate = whereClause.orderDate || {};
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).gte = new Date(parseInt(year), 0, 1);
      (whereClause.orderDate as Prisma.DateTimeFilter<"Order">).lte = new Date(parseInt(year), 11, 31, 23, 59, 59);
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { orderDate: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageData: true,
            categoryId: true,
            stock: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      name: order.name,
      price: order.price,
      stock: order.stock,
      category: order.category, // อาจต้องเปลี่ยนเป็น order.product.categoryId หรือ relation
      shippingAddress: order.shippingAddress,
      orderDate: order.orderDate.toISOString(),
      slipImage: order.slipImage,
      status: order.status,
      productId: order.productId,
      deliveryMethod: order.deliveryMethod,
      product: order.product || { id: order.productId, name: order.name, imageData: null, stock: 0 },
      user: order.user || { id: order.userId, name: "Unknown", email: "Unknown" },
    }));

    // คำนวณข้อมูลสถิติ
    const totalProducts = await prisma.product.count();
    const categories = await prisma.product.findMany({
      select: { categoryId: true },
      distinct: ["categoryId"],
    }).then(products => products.map(p => p.categoryId?.toString() || "Unknown"));
    const totalStock = await prisma.product.aggregate({
      _sum: { stock: true },
    }).then(result => result._sum.stock || 0);
    const totalRevenue = await prisma.order
      .aggregate({
        _sum: { price: true },
        where: {
          ...whereClause,
          status: { in: ["ชำระแล้ว", "จัดส่งแล้ว"] }, // คำนวณรายได้เฉพาะสถานะที่เกี่ยวข้อง
        },
      })
      .then(result => result._sum.price || 0);

    console.log("Orders fetched successfully:", formattedOrders.length, "records");
    return NextResponse.json({ orders: formattedOrders.length > 0 ? formattedOrders : [], stats: { totalProducts, categories, totalStock, totalRevenue } }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Error fetching orders", error: (error as Error).message }, { status: 500 });
  } finally {
    // Do not disconnect in serverless to avoid prepared statement issues
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const quantity = parseInt(formData.get("stock") as string);
    const category = formData.get("category") as string; // อาจต้องเปลี่ยนเป็น categoryId
    const shippingAddress = formData.get("shippingAddress") as string;
    const orderDate = new Date(); // ใช้วันที่ปัจจุบันถ้าไม่ส่งมา
    const productId = parseInt(formData.get("productId") as string);
    const deliveryMethod = formData.get("deliveryMethod") as string;
    const slipImageFile = formData.get("slipImage") as File | null;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id);
    if (isNaN(userId)) {
      console.log("Invalid user ID");
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    let slipImageUrl = null;
    if (slipImageFile) {
      const uploadResult = await uploadFile(slipImageFile, 'orders', 'slips');
      if (uploadResult.error) {
        return NextResponse.json({ error: `ไม่สามารถอัพโหลดหลักฐานการชำระเงินได้: ${uploadResult.error}` }, { status: 500 });
      }
      slipImageUrl = uploadResult.url;
    }

    const result = await prisma.$transaction(async (tx) => {
      const orderData: Prisma.OrderUncheckedCreateInput = {
        name,
        price,
        stock: quantity,
        category, // อาจต้องเปลี่ยนเป็น categoryId หรือลบถ้าไม่ใช้
        shippingAddress,
        orderDate,
        slipImage: slipImageUrl,
        status: "รอชำระ",
        deliveryMethod,
        productId,
        userId,
      };

      const order = await tx.order.create({
        data: orderData,
      });

      const product = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new Error("สินค้าไม่พบในฐานข้อมูล");
      if (product.stock < quantity) throw new Error("สต็อกไม่เพียงพอ");
      await tx.product.update({
        where: { id: productId },
        data: { stock: product.stock - quantity },
      });

      return order;
    });

    console.log("Order saved successfully, orderId:", result.id);
    return NextResponse.json({ message: "Order saved successfully", order: result }, { status: 200 });
  } catch (error) {
    console.error("Error saving order:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving order" }, { status: 500 });
  } finally {
    // Do not disconnect in serverless to avoid prepared statement issues
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const { id, status } = await req.json();

    // ตรวจสอบว่า id เป็นตัวเลขที่ถูกต้อง
    if (isNaN(id) || id <= 0) {
      console.log("Invalid order ID:", id);
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { product: true }, // รวม product เพื่อดึง stock เดิม
    });

    if (!order) {
      console.log("Order not found for id:", id);
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์: ADMIN และ FIELD_OWNER สามารถอัปเดตได้ทุก order
    if (userRole !== Role.ADMIN && userRole !== Role.OWNER) {
      console.log("Access denied for role:", userRole);
      return NextResponse.json({ message: "Access denied: Admin or Field Owner only" }, { status: 403 });
    }

    // เพิ่มสถานะใหม่: กำลังจัดส่ง, ยกเลิกสินค้า, จัดส่งแล้ว
    if (!["รอชำระ", "ชำระแล้ว", "กำลังจัดส่ง", "ยกเลิกสินค้า", "จัดส่งแล้ว"].includes(status)) {
      console.log("Invalid status:", status);
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
      });

      // ถ้าเปลี่ยนสถานะเป็น "ยกเลิกสินค้า" คืนสต็อก
      if (status === "ยกเลิกสินค้า" && order.stock > 0 && order.product) {
        const currentProduct = await tx.product.findUnique({
          where: { id: order.productId },
        });
        if (currentProduct) {
          await tx.product.update({
            where: { id: order.productId },
            data: { stock: currentProduct.stock + order.stock },
          });
          console.log(`Stock returned for product ${order.productId}: +${order.stock}`);
        }
      }

      return updatedOrder;
    });

    console.log("Status updated successfully, orderId:", id, "to status:", status);
    return NextResponse.json({ message: "Status updated successfully", order: result }, { status: 200 });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ message: "Error updating status" }, { status: 500 });
  } finally {
    // Do not disconnect in serverless to avoid prepared statement issues
  }
}