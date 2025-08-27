"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

interface Product {
  id: number;
  name: string;
  imageData: string | null;
}

interface Order {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  shippingAddress: string;
  orderDate: string;
  slipImage: string | null;
  status: string;
  productId: number;
  deliveryMethod: string;
  product?: Product;
}

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null); // state สำหรับ track order ที่กำลังยกเลิก

  // โหลด orders
  useEffect(() => {
    const fetchUserIdAndOrders = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });
        if (response.ok) {
          const session = await response.json();
          const userId = session?.user?.id ? parseInt(session.user.id) : null;
          if (!userId) {
            setError("ไม่พบข้อมูลผู้ใช้");
            setLoading(false);
            return;
          }

          const orderResponse = await fetch(`/api/orders/user/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (orderResponse.ok) {
            const data: Order[] = await orderResponse.json();
            setOrders(data);
            setError(null);
          }
        } else {
          setError("ไม่สามารถดึงข้อมูล session ได้");
        }
      } catch (error) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserIdAndOrders();
  }, []);

  const handleCancelOrder = async (id: number) => {
    const result = await Swal.fire({
      title: "ยืนยันการยกเลิก?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้? การกระทำนี้ไม่สามารถย้อนกลับได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    setCancelingOrderId(id); // set loading
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setOrders((prev) => prev.filter((order) => order.id !== id));
        Swal.fire({
          icon: "success",
          title: "สำเร็จ!",
          text: data.message || "คำสั่งซื้อถูกยกเลิกเรียบร้อยแล้ว",
          confirmButtonText: "ตกลง",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "ผิดพลาด!",
          text: data.message || "ไม่สามารถยกเลิกคำสั่งซื้อได้",
          confirmButtonText: "ลองใหม่",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด!",
        text: "เกิดข้อผิดพลาดในการยกเลิก: " + (error as Error).message,
        confirmButtonText: "ลองใหม่",
      });
    } finally {
      setCancelingOrderId(null); // clear loading
    }
  };

  if (loading) {
    return <div className="container mx-auto py-6 px-4 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">รายการคำสั่งซื้อของฉัน</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <div className="overflow-x-auto rounded-md border shadow-md">
        <Table className="min-w-[700px] bg-white">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="px-4 py-2">รูปภาพสินค้า</TableHead>
              <TableHead className="px-4 py-2">ชื่อสินค้า</TableHead>
              <TableHead className="px-4 py-2">ราคา</TableHead>
              <TableHead className="px-4 py-2">การชำระเงิน</TableHead>
              <TableHead className="px-4 py-2">วันที่สั่งซื้อ</TableHead>
              <TableHead className="px-4 py-2">สถานะ</TableHead>
              <TableHead className="px-4 py-2">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => {
                const product = order.product || { imageData: null, name: order.name };
                return (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-2">
                      {product.imageData ? (
                        <img
                          src={product.imageData.startsWith("http") ? product.imageData : `data:image/jpeg;base64,${product.imageData}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover"
                        />
                      ) : (
                        <span>ไม่มีรูปภาพ</span>
                      )}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{order.price} บาท</TableCell>
                    <TableCell>{order.deliveryMethod === "bankTransfer" ? "โอนผ่านบัญชี" : "เก็บเงินปลายทาง"}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString("th-TH")}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === "รอชำระ"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "ชำระแล้ว"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelOrder(order.id)}
                        className="w-24"
                        disabled={cancelingOrderId === order.id} // disable ถ้ากำลังโหลด
                      >
                        {cancelingOrderId === order.id ? "กำลังยกเลิก..." : "ยกเลิก"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  ยังไม่มีคำสั่งซื้อ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
