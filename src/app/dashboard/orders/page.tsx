"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  user?: { id: number; name: string; email: string };
}

interface DashboardStats {
  totalProducts: number;
  categories: string[];
  totalStock: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const itemsPerPage = 10;
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const url = new URL("/api/orders", window.location.origin);
        startDate && url.searchParams.append("startDate", startDate);
        endDate && url.searchParams.append("endDate", endDate);
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
          setStats(data.stats || { totalProducts: 0, categories: [], totalStock: 0 });
          setError(null);
        } else {
          setError("เกิดข้อผิดพลาดในการดึงรายการคำสั่งซื้อ");
        }
      } catch (error) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (error as Error).message);
        console.error("Error fetching orders:", error);
      }
    }
    fetchOrders();
  }, [startDate, endDate]);

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const { value: newStatus } = await Swal.fire({
      title: "อัปเดตสถานะ",
      input: "select",
      inputOptions: {
        "รอชำระ": "รอชำระ",
        "ชำระแล้ว": "ชำระแล้ว",
        "กำลังจัดส่ง": "กำลังจัดส่ง",
        "ยกเลิกสินค้า": "ยกเลิกสินค้า",
        "จัดส่งแล้ว": "จัดส่งแล้ว",
      },
      inputValue: currentStatus,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value) {
            resolve("");
          } else {
            resolve("กรุณาเลือกสถานะ!");
          }
        });
      },
    });

    if (newStatus) {
      try {
        const response = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, status: newStatus }),
        });
        const data = await response.json();
        if (response.ok) {
          setOrders(orders.map((order) => (order.id === id ? { ...order, status: newStatus } : order)));
          Swal.fire({
            icon: "success",
            title: "สำเร็จ!",
            text: data.message || "สถานะถูกอัปเดตเรียบร้อยแล้ว",
            confirmButtonText: "ตกลง",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "ผิดพลาด!",
            text: data.message || "ไม่สามารถอัปเดตสถานะได้",
            confirmButtonText: "ลองใหม่",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "ผิดพลาด!",
          text: "เกิดข้อผิดพลาดในการอัปเดต: " + (error as Error).message,
          confirmButtonText: "ลองใหม่",
        });
        console.error("Error updating status:", error);
      }
    }
  };

  const handleViewSlip = async (slipImage: string | null) => {
    if (!slipImage) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีสลิป",
        text: "ไม่มีภาพสลิปสำหรับคำสั่งซื้อนี้",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    // ตรวจสอบว่า slipImage เป็น URL หรือ base64 หรือ path
    let imageUrl = slipImage;
    
    // ถ้าเป็น URL ภายนอก (http/https) ใช้ตามปกติ
    if (slipImage.startsWith('http://') || slipImage.startsWith('https://')) {
      imageUrl = slipImage;
    }
    // ถ้าเป็น path ของไฟล์ที่อัพโหลดในระบบ (เริ่มต้นด้วย /uploads/)
    else if (slipImage.startsWith('/uploads/') || slipImage.startsWith('uploads/')) {
      // สร้าง URL สำหรับไฟล์ที่อัพโหลด
      const baseUrl = window.location.origin;
      imageUrl = `${baseUrl}${slipImage.startsWith('/') ? '' : '/'}${slipImage}`;
    }
    // ถ้าเป็น base64 string (เริ่มต้นด้วย data:)
    else if (slipImage.startsWith('data:')) {
      imageUrl = slipImage;
    }
    // ถ้าเป็น base64 string ที่ไม่มี prefix
    else {
      imageUrl = `data:image/jpeg;base64,${slipImage}`;
    }

    try {
      await Swal.fire({
        title: "ดูสลิป",
        imageUrl: imageUrl,
        imageAlt: "Slip Image",
        showConfirmButton: true,
        confirmButtonText: "ปิด",
        customClass: {
          popup: "max-w-2xl max-h-[90vh] overflow-auto",
          image: "max-w-full max-h-[80vh] object-contain rounded-lg",
        },
        width: "auto",
        imageWidth: "100%",
        imageHeight: "auto",
        showCloseButton: true,
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      console.error("Error displaying slip image:", error);
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด!",
        text: "ไม่สามารถแสดงภาพสลิปได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-700">จำนวนสินค้าทั้งหมด</h3>
          <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-700">หมวดหมู่สินค้า</h3>
          <p className="text-2xl font-bold">{stats?.categories.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-700">สินค้าในสต็อก</h3>
          <p className="text-2xl font-bold">{stats?.totalStock || 0}</p>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">จัดการคำสั่งซื้อ</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
        <Button onClick={handleSearch} className="w-full sm:w-auto">ค้นหา</Button>
      </div>
      <div className="overflow-x-auto rounded-md border shadow-md">
        <Table className="min-w-[800px] bg-white">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">รูปภาพสินค้า</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">ชื่อสินค้า</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/12">ราคา</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/12">จำนวน</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">หมวดหมู่</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">การชำระเงิน</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">ผู้ซื้อ</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/4">ที่อยู่จัดส่ง</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">วันที่สั่งซื้อ</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/12">สถานะ</TableHead>
              <TableHead className="px-4 py-2 text-left font-semibold text-gray-700 w-1/6">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => {
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
                    <TableCell className="px-4 py-2 border-b">{order.stock}</TableCell>
                    <TableCell className="px-4 py-2 border-b">{order.category}</TableCell>
                    <TableCell className="px-4 py-2 border-b">
                      {order.deliveryMethod === "bankTransfer" ? "โอนผ่านบัญชี" : "เก็บเงินปลายทาง"}
                    </TableCell>
                    <TableCell className="px-4 py-2 border-b">{order.user?.name || "Unknown"}</TableCell>
                    <TableCell className="px-4 py-2 border-b">{order.shippingAddress}</TableCell>
                    <TableCell className="px-4 py-2 border-b">{new Date(order.orderDate).toLocaleDateString("th-TH")}</TableCell>
                    <TableCell className="px-4 py-2 border-b">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === "รอชำระ" ? "bg-yellow-100 text-yellow-800"
                          : order.status === "ชำระแล้ว" ? "bg-blue-100 text-blue-800"
                          : order.status === "กำลังจัดส่ง" ? "bg-purple-100 text-purple-800"
                          : order.status === "ยกเลิกสินค้า" ? "bg-red-100 text-red-800"
                          : order.status === "จัดส่งแล้ว" ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 border-b">
                      <div className="flex flex-row gap-1">
                        <Button variant="secondary" onClick={() => handleUpdateStatus(order.id, order.status)} className="w-24">เปลี่ยนสถานะ</Button>
                        <Button variant="outline" onClick={() => handleViewSlip(order.slipImage)} className="w-20">ดูสลิป</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">ยังไม่มีคำสั่งซื้อ</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {orders.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" className="px-3 py-1">ก่อนหน้า</Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button key={page} onClick={() => handlePageChange(page)} variant={currentPage === page ? "default" : "outline"} className="px-3 py-1">{page}</Button>
          ))}
          <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" className="px-3 py-1">ถัดไป</Button>
        </div>
      )}
    </div>
  );
}