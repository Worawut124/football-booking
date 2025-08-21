import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id); // userId ของผู้ล็อกอิน
    const userRole = session.user.role;
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);

    // ตรวจสอบว่า orderId เป็นตัวเลขที่ถูกต้อง
    if (isNaN(orderId) || orderId <= 0) {
      console.log("Invalid order ID:", orderIdParam);
      return NextResponse.json({ message: "Order ID is required and must be a valid number" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }, // รวม product เพื่อดึง stock และ productId
    });

    if (!order) {
      console.log("Order not found for orderId:", orderId);
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // ตรวจสอบสถานะ: อนุญาตให้ลบได้เฉพาะ "รอชำระ"
    if (order.status !== "รอชำระ") {
      console.log("Cannot delete order:", orderId, "with status:", order.status);
      return NextResponse.json({ message: "สินค้าที่ชำระเงินแล้วไม่สามารถยกเลิกได้" }, { status: 400 });
    }

    // ตรวจสอบสิทธิ์: USER สามารถลบได้เฉพาะ order ของตัวเอง, ADMIN และ FIELD_OWNER ลบได้ทุก order
    if (userRole === Role.USER) {
      if (order.userId !== userId) {
        console.log("Access denied: User", userId, "tried to delete order", orderId, "owned by", order.userId);
        return NextResponse.json({ message: "Access denied: Cannot delete others' orders" }, { status: 403 });
      }
    } else if (userRole !== Role.ADMIN && userRole !== Role.OWNER) {
      console.log("Access denied for role:", userRole);
      return NextResponse.json({ message: "Access denied: User, Admin, or Field Owner only" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // ลบออร์เดอร์
      const deletedOrder = await tx.order.delete({
        where: { id: orderId },
      });

      // คืนสต็อกถ้ามี
      if (order.stock > 0 && order.productId) {
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

      return deletedOrder;
    });

    console.log("Order deleted successfully, orderId:", orderId);
    return NextResponse.json({ message: "Order deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ message: "Error deleting order" }, { status: 500 });
  } finally {
    // Do not disconnect in serverless to avoid prepared statement issues
  }
}