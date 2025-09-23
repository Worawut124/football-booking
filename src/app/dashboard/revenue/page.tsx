"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { format as formatDate } from "date-fns";
import { 
  TrendingUp, 
  Calendar, 
  MapPin, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  PieChart, 
  DollarSign,
  Trophy,
  Sparkles,
  Filter,
  RefreshCw,
  Search
} from "lucide-react";

interface RevenueItem {
  id: number;
  userName: string;
  fieldName: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
}

interface Order {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  shippingAddress: string;
  orderDate: string;
  slipImage: string | null;
  status: string;
  productId: number;
  deliveryMethod: string;
  product: {
    id: number;
    name: string;
    imageData: string | null;
    stock: number;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProductRevenueStats {
  totalRevenue: number;
  totalProducts: number;
  categories: string[];
  totalStock: number;
}

export default function RevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Booking Revenue States
  const [revenueData, setRevenueData] = useState<RevenueItem[]>([]);
  const [totalBookingRevenue, setTotalBookingRevenue] = useState<number>(0);
  
  // Product Revenue States
  const [orders, setOrders] = useState<Order[]>([]);
  const [productStats, setProductStats] = useState<ProductRevenueStats | null>(null);
  
  // Common States
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date(), "yyyy-MM"));
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "products">("overview");
  const itemsPerPage = 15;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "OWNER") {
      router.push("/dashboard");
      return;
    }

    const fetchBookingRevenue = async () => {
      try {
        const dateQuery = selectedDate ? selectedDate : formatDate(new Date(), "yyyy-MM");
        const response = await fetch(`/api/revenue?period=${period}&date=${dateQuery}`);
        if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลรายได้การจองได้");
        const data = await response.json();
        setRevenueData(data.revenueData || []);
        setTotalBookingRevenue(data.totalRevenue || 0);
      } catch (error) {
        console.error("Error fetching booking revenue:", error);
      }
    };

    const fetchProductRevenue = async () => {
      try {
        const [year, month] = selectedDate.split('-');
        const url = new URL("/api/orders", window.location.origin);
        if (month) url.searchParams.append("month", month);
        if (year) url.searchParams.append("year", year);
        
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
          setProductStats(data.stats || { totalRevenue: 0, totalProducts: 0, categories: [], totalStock: 0 });
        }
      } catch (error) {
        console.error("Error fetching product revenue:", error);
      }
    };

    fetchBookingRevenue();
    fetchProductRevenue();
    setCurrentPage(1); // รีเซ็ตหน้าเมื่อข้อมูลเปลี่ยน
  }, [status, router, session, period, selectedDate]);

  // คำนวณข้อมูลสำหรับหน้า
  const totalPages = Math.ceil(revenueData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = revenueData.slice(startIndex, startIndex + itemsPerPage);

  // ฟังก์ชันสำหรับเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate total revenue and product sales
  const totalRevenue = totalBookingRevenue + (productStats?.totalRevenue || 0);
  const productSales = orders.reduce((acc, order) => {
    const productName = order.product.name;
    acc[productName] = (acc[productName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (status === "loading") {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (session?.user?.role !== "OWNER") {
    return <div className="container mx-auto p-4 text-center text-red-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

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
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">รายงานรายได้</h1>
              <p className="text-white/90 text-lg">ภาพรวมรายได้จากการจองและการขายสินค้า</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">รายได้รวม: ฿{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
        <CardContent className="p-8">
          {/* Filter Section */}
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl shadow-lg border border-slate-200 w-full">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">ตัวกรอง:</label>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">เดือน/ปี:</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="month"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-48 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">ช่วงเวลา:</label>
                <Select value={period} onValueChange={(value: "monthly" | "yearly") => setPeriod(value)}>
                  <SelectTrigger className="w-full sm:w-48 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm">
                    <SelectValue placeholder="เลือกช่วงเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">รายเดือน</SelectItem>
                    <SelectItem value="yearly">รายปี</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-xl">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "overview"
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <PieChart className="h-4 w-4" />
                ภาพรวม
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "bookings"
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <MapPin className="h-4 w-4" />
                รายได้การจอง
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "products"
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                รายได้การขาย
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 rounded-full p-3">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mb-1">฿{totalRevenue.toLocaleString()}</div>
                    <p className="text-sm text-blue-600">รายได้รวมทั้งหมด</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-green-100 rounded-full p-3">
                        <MapPin className="h-6 w-6 text-green-600" />
                      </div>
                      <BarChart3 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-700 mb-1">฿{totalBookingRevenue.toLocaleString()}</div>
                    <p className="text-sm text-green-600">รายได้การจอง</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-purple-100 rounded-full p-3">
                        <ShoppingCart className="h-6 w-6 text-purple-600" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700 mb-1">฿{(productStats?.totalRevenue || 0).toLocaleString()}</div>
                    <p className="text-sm text-purple-600">รายได้การขาย</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-orange-100 rounded-full p-3">
                        <Package className="h-6 w-6 text-orange-600" />
                      </div>
                      <Trophy className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700 mb-1">{Object.keys(productSales).length}</div>
                    <p className="text-sm text-orange-600">สินค้าที่ขายได้</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    <MapPin className="h-6 w-6" />
                    รายได้จากการจอง ({period === "monthly" ? "รายเดือน" : "รายปี"})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6 text-right">
                    <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <strong className="text-xl text-green-700">฿{totalBookingRevenue.toLocaleString()}</strong>
                    </div>
                  </div>
                  {revenueData.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                        <Search className="h-16 w-16 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่มีรายการจอง</h3>
                      <p className="text-slate-500">ไม่มีรายการจองในช่วงเวลาที่เลือก</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                            <TableRow className="border-b-2 border-green-200">
                              <TableHead className="min-w-[150px] text-center font-bold text-green-700">
                                <div className="flex items-center justify-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  วันที่เริ่ม
                                </div>
                              </TableHead>
                              <TableHead className="min-w-[150px] text-center font-bold text-green-700">
                                <div className="flex items-center justify-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  วันที่สิ้นสุด
                                </div>
                              </TableHead>
                              <TableHead className="min-w-[150px] text-center font-bold text-green-700">
                                <div className="flex items-center justify-center gap-2">
                                  <Users className="h-4 w-4" />
                                  ผู้จอง
                                </div>
                              </TableHead>
                              <TableHead className="min-w-[150px] text-center font-bold text-green-700">
                                <div className="flex items-center justify-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  สนาม
                                </div>
                              </TableHead>
                              <TableHead className="min-w-[150px] text-center font-bold text-green-700">
                                <div className="flex items-center justify-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  ยอดชำระ
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentData.map((item) => (
                              <TableRow key={item.id} className="hover:bg-green-50 transition-colors">
                                <TableCell className="min-w-[150px] text-center">
                                  {format(new Date(item.startTime), "dd MMMM yyyy HH:mm", { locale: th })} น.
                                </TableCell>
                                <TableCell className="min-w-[150px] text-center">
                                  {format(new Date(item.endTime), "dd MMMM yyyy HH:mm", { locale: th })} น.
                                </TableCell>
                                <TableCell className="min-w-[150px] text-center font-medium">{item.userName}</TableCell>
                                <TableCell className="min-w-[150px] text-center">{item.fieldName}</TableCell>
                                <TableCell className="min-w-[150px] text-center">
                                  <span className="font-bold text-green-600">฿{item.totalAmount.toLocaleString()}</span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-between items-center mt-6">
                        <div className="text-slate-600">
                          แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, revenueData.length)} จาก {revenueData.length} รายการ
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="hover:bg-green-50"
                          >
                            ก่อนหน้า
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              onClick={() => handlePageChange(page)}
                              className={currentPage === page ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="hover:bg-green-50"
                          >
                            ถัดไป
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-purple-800">
                    <ShoppingCart className="h-6 w-6" />
                    รายได้จากการขายสินค้า
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6 text-right">
                    <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <strong className="text-xl text-purple-700">฿{(productStats?.totalRevenue || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                  
                  {Object.keys(productSales).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                        <Package className="h-16 w-16 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่มีการขายสินค้า</h3>
                      <p className="text-slate-500">ไม่มีข้อมูลการขายในช่วงเวลาที่เลือก</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(productSales).map(([productName, count]) => (
                        <Card key={productName} className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="bg-purple-100 rounded-full p-3">
                                <Package className="h-6 w-6 text-purple-600" />
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-purple-700">{count}</div>
                                <div className="text-sm text-purple-600">ชิ้น</div>
                              </div>
                            </div>
                            <h3 className="font-semibold text-purple-800 text-lg mb-2">{productName}</h3>
                            <div className="flex items-center gap-2 text-purple-600">
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-sm">ขายได้ {count} ชิ้น</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}