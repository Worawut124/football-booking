"use client";

import { useEffect, useState } from "react";
import LoadingCrescent from "@/components/ui/loading-crescent";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import {
  ShoppingCart,
  Package,
  DollarSign,
  Archive,
  Users,
  Calendar,
  MapPin,
  CreditCard,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Sparkles,
  FileText,
  Image as ImageIcon
} from "lucide-react";

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
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const itemsPerPage = 8;
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
          setFilteredOrders(data.orders || []);
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

  // Filter orders based on search term and status
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter((order) =>
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, orders]);

  if (!orders.length && !error) {
    return <LoadingCrescent text="กำลังโหลดคำสั่งซื้อ..." />;
  }

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

    // ใช้ URL โดยตรงจาก Supabase
    let imageUrl = slipImage;
    
    // ถ้าเป็น base64 string (เริ่มต้นด้วย data:)
    if (slipImage.startsWith('data:')) {
      imageUrl = slipImage;
    }
    // ถ้าเป็น base64 string ที่ไม่มี prefix
    else if (!slipImage.startsWith('http')) {
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
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Calculate order statistics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.price * order.stock), 0);
  const pendingOrders = filteredOrders.filter(order => order.status === "รอชำระ").length;
  const completedOrders = filteredOrders.filter(order => order.status === "จัดส่งแล้ว").length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white rounded-2xl p-8 mb-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">จัดการคำสั่งซื้อ</h1>
              <p className="text-white/90 text-lg">ติดตามและจัดการคำสั่งซื้อทั้งหมด</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">คำสั่งซื้อทั้งหมด: {totalOrders} รายการ</span>
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
        <CardContent className="p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{totalOrders}</div>
                <p className="text-sm text-blue-600">คำสั่งซื้อทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">฿{totalRevenue.toLocaleString()}</div>
                <p className="text-sm text-green-600">ยอดขายรวม</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">{pendingOrders}</div>
                <p className="text-sm text-orange-600">รอชำระเงิน</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-1">{completedOrders}</div>
                <p className="text-sm text-purple-600">จัดส่งแล้ว</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Search Section */}
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl shadow-lg border border-slate-200 flex-1">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">ตัวกรอง:</label>
              </div>
              
              {/* Search Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">ค้นหา:</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="ค้นหาสินค้า, ผู้ซื้อ, หมวดหมู่..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">สถานะ:</label>
                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full sm:w-48 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm">
                    <SelectValue placeholder="ทุกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="รอชำระ">รอชำระ</SelectItem>
                    <SelectItem value="ชำระแล้ว">ชำระแล้ว</SelectItem>
                    <SelectItem value="กำลังจัดส่ง">กำลังจัดส่ง</SelectItem>
                    <SelectItem value="จัดส่งแล้ว">จัดส่งแล้ว</SelectItem>
                    <SelectItem value="ยกเลิกสินค้า">ยกเลิกสินค้า</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">วันที่:</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>
          </div>

          {/* Orders Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <ShoppingCart className="h-6 w-6" />
                รายการคำสั่งซื้อ
                <Badge variant="secondary" className="ml-auto">
                  {filteredOrders.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบคำสั่งซื้อ</h3>
                  <p className="text-slate-500">
                    {searchTerm || statusFilter || startDate || endDate
                      ? "ไม่มีคำสั่งซื้อที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีคำสั่งซื้อในระบบ"
                    }
                  </p>
                  {(searchTerm || statusFilter || startDate || endDate) && (
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("");
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงคำสั่งซื้อทั้งหมด
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                    <Table className="min-w-[1200px]">
                      <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                        <TableRow className="border-b-2 border-slate-200">
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <ImageIcon className="h-4 w-4 text-blue-600" />
                              รูปภาพ
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Package className="h-4 w-4 text-green-600" />
                              สินค้า
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <DollarSign className="h-4 w-4 text-purple-600" />
                              ราคา
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Archive className="h-4 w-4 text-orange-600" />
                              จำนวน
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <CreditCard className="h-4 w-4 text-indigo-600" />
                              การชำระ
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Users className="h-4 w-4 text-pink-600" />
                              ผู้ซื้อ
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <MapPin className="h-4 w-4 text-red-600" />
                              ที่อยู่
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar className="h-4 w-4 text-teal-600" />
                              วันที่
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Activity className="h-4 w-4 text-yellow-600" />
                              สถานะ
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Edit className="h-4 w-4 text-slate-600" />
                              จัดการ
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentOrders.map((order) => {
                          const product = order.product || { imageData: null, name: order.name };
                          return (
                            <TableRow key={order.id} className="hover:bg-blue-50 transition-colors">
                              <TableCell className="text-center p-4">
                                {product.imageData ? (
                                  <div className="flex justify-center">
                                    <img 
                                      src={product.imageData.startsWith('http') ? product.imageData : `data:image/jpeg;base64,${product.imageData}`} 
                                      alt={product.name} 
                                      className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200 shadow-sm" 
                                    />
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-slate-400" />
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center p-4 font-medium">
                                <div>
                                  <div className="font-semibold">{product.name}</div>
                                  <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-700">
                                    {order.category}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-4">
                                <Badge variant="outline" className="border-green-200 text-green-700 font-semibold">
                                  ฿{order.price.toLocaleString()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center p-4">
                                <Badge variant="outline" className="border-orange-200 text-orange-700">
                                  {order.stock} ชิ้น
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center p-4">
                                <Badge 
                                  variant="secondary" 
                                  className={order.deliveryMethod === "bankTransfer" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}
                                >
                                  {order.deliveryMethod === "bankTransfer" ? "โอนผ่านบัญชี" : "เก็บเงินปลายทาง"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center p-4">
                                <div className="text-sm">
                                  <div className="font-medium">{order.user?.name || "Unknown"}</div>
                                  <div className="text-slate-500 text-xs">{order.user?.email || ""}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-4 max-w-xs">
                                <div className="truncate text-sm" title={order.shippingAddress}>
                                  {order.shippingAddress}
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-4 text-slate-600 text-sm">
                                {new Date(order.orderDate).toLocaleDateString("th-TH")}
                              </TableCell>
                              <TableCell className="text-center p-4">
                                <Badge className={`${
                                  order.status === "รอชำระ" ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : order.status === "ชำระแล้ว" ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : order.status === "กำลังจัดส่ง" ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : order.status === "ยกเลิกสินค้า" ? "bg-red-100 text-red-800 border-red-200"
                                    : order.status === "จัดส่งแล้ว" ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                } flex items-center gap-1`}>
                                  {order.status === "รอชำระ" && <Clock className="h-3 w-3" />}
                                  {order.status === "ชำระแล้ว" && <CheckCircle className="h-3 w-3" />}
                                  {order.status === "กำลังจัดส่ง" && <Truck className="h-3 w-3" />}
                                  {order.status === "จัดส่งแล้ว" && <CheckCircle className="h-3 w-3" />}
                                  {order.status === "ยกเลิกสินค้า" && <XCircle className="h-3 w-3" />}
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center p-4">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(order.id, order.status)}
                                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewSlip(order.slipImage)}
                                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {filteredOrders.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                      <div className="text-slate-600 text-sm">
                        แสดง {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} จาก {filteredOrders.length} รายการ
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ก่อนหน้า
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            variant={currentPage === page ? "default" : "outline"}
                            className={currentPage === page ? "bg-blue-600 text-white" : ""}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}