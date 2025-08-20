import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const resolvedParams = await params; // รอให้ params resolve
    const requestedUserId = parseInt(resolvedParams.userId);

    if (isNaN(requestedUserId)) {
      console.log("Invalid user ID:", resolvedParams.userId);
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const userRole = session.user.role;
    let whereClause: Prisma.OrderWhereInput = {};

    // กรองตาม userId
    if (userRole === Role.USER) {
      whereClause.userId = userId; // USER เห็นเฉพาะของตัวเอง
      console.log("USER access, filtering by userId:", userId);
    } else if (userRole === Role.ADMIN || userRole === Role.OWNER) {
      whereClause.userId = requestedUserId; // ADMIN/FIELD_OWNER เห็นตาม userId ที่ระบุ
      console.log("ADMIN/OWNER access, filtering by requestedUserId:", requestedUserId);
    } else {
      console.log("Access denied for role:", userRole);
      return NextResponse.json({ message: "Access denied: User, Admin, or Field Owner only" }, { status: 403 });
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

    if (!orders || orders.length === 0) {
      console.log("No orders found for userId:", requestedUserId);
      return NextResponse.json({ message: "No orders found for this user" }, { status: 404 });
    }

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      name: order.name,
      price: order.price,
      stock: order.stock,
      category: order.category,
      shippingAddress: order.shippingAddress,
      orderDate: order.orderDate.toISOString(),
      slipImage: order.slipImage,
      status: order.status,
      productId: order.productId,
      deliveryMethod: order.deliveryMethod,
      product: order.product || { id: order.productId, name: order.name, imageData: null },
      user: order.user || { id: order.userId, name: "Unknown", email: "Unknown" },
    }));

    console.log("Orders fetched successfully:", formattedOrders.length, "records");
    return NextResponse.json(formattedOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}