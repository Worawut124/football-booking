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

  // ดึง userId จาก session (สมมติใช้ NextAuth)
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
            credentials: "include", // อนุญาตให้ส่ง cookie/session
          });
          if (orderResponse.ok) {
            const data: Order[] = await orderResponse.json();
            setOrders(data);
            setError(null);
          } else {
            // setError("เกิดข้อผิดพลาดในการดึงรายการคำสั่งซื้อ");
          }
        } else {
          setError("ไม่สามารถดึงข้อมูล session ได้");
        }
      } catch (error) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (error as Error).message);
        console.error("Error fetching user orders:", error);
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

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/orders/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await response.json(); // ดึงข้อความจาก response
        if (response.ok) {
          setOrders(orders.filter((order) => order.id !== id));
          setError(null);
          Swal.fire({
            icon: "success",
            title: "สำเร็จ!",
            text: data.message || "คำสั่งซื้อถูกยกเลิกเรียบร้อยแล้ว",
            confirmButtonText: "ตกลง",
          });
        } else {
          setError(null); // ล้าง error เดิม
          Swal.fire({
            icon: "error",
            title: "ผิดพลาด!",
            text: data.message || "ไม่สามารถยกเลิกคำสั่งซื้อได้",
            confirmButtonText: "ลองใหม่",
          });
        }
      } catch (error) {
        setError("เกิดข้อผิดพลาดในการยกเลิก: " + (error as Error).message);
        Swal.fire({
          icon: "error",
          title: "ผิดพลาด!",
          text: "เกิดข้อผิดพลาดในการยกเลิก: " + (error as Error).message,
          confirmButtonText: "ลองใหม่",
        });
        console.error("Error canceling order:", error);
      }
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
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">รูปภาพสินค้า</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">ชื่อสินค้า</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/12">ราคา</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">การชำระเงิน</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">วันที่สั่งซื้อ</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/12">สถานะ</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => {
                const product = order.product || { imageData: null, name: order.name };
                return (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-2 border-b">
                      {product.imageData ? (
                        <img 
                  src={product.imageData.startsWith('http') ? product.imageData : `data:image/jpeg;base64,${product.imageData}`} 
                  alt={product.name} 
                  className="w-16 h-16 object-cover" 
                />
                      ) : (
                        <span>ไม่มีรูปภาพ</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 border-b">{product.name}</TableCell>
                    <TableCell className="px-4 py-2 border-b">{order.price} บาท</TableCell>
                    <TableCell className="px-4 py-2 border-b">
                      {order.deliveryMethod === "bankTransfer" ? "โอนผ่านบัญชี" : "เก็บเงินปลายทาง"}
                    </TableCell>
                    <TableCell className="px-4 py-2 border-b">{new Date(order.orderDate).toLocaleDateString("th-TH")}</TableCell>
                    <TableCell className="px-4 py-2 border-b">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === "รอชำระ" ? "bg-yellow-100 text-yellow-800"
                        : order.status === "ชำระแล้ว" ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 border-b">
                      <Button variant="destructive" onClick={() => handleCancelOrder(order.id)} className="w-24">ยกเลิก</Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">ยังไม่มีคำสั่งซื้อ</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}