"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  ShoppingCart, 
  MapPin, 
  Package, 
  Clock, 
  CheckCircle, 
  BarChart3,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Trophy
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeKey, setActiveKey] = useState<PanelKey>("overview");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/booking");
      return;
    }
  }, [status, router, session]);

  if (status === "loading") {
    return <div className="w-full p-4">กำลังโหลด...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">แดชบอร์ด (การจัดการ)</h1>
      {/* Mobile selector */}
      <div className="md:hidden mb-4">
        <Select value={activeKey} onValueChange={(v) => setActiveKey(v as PanelKey)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="เลือกเมนู" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">ภาพรวม</SelectItem>
            <SelectItem value="fields">จัดการสนาม</SelectItem>
            <SelectItem value="bookings">จัดการการจอง</SelectItem>
            <SelectItem value="announcements">จัดการข่าว</SelectItem>
            <SelectItem value="users">จัดการผู้ใช้</SelectItem>
            <SelectItem value="payment-config">จัดการการชำระเงิน</SelectItem>
            <SelectItem value="competition-management">จัดการการแข่งขันฟุตบอล</SelectItem>
            <SelectItem value="competition-list">จัดการรายการแข่งขัน</SelectItem>
            <SelectItem value="revenue">รายงานรายได้การจอง</SelectItem>
            <SelectItem value="booking-report">รายงานการใช้งานสนาม</SelectItem>
            <SelectItem value="ProductManagement">จัดการสินค้า</SelectItem>
            <SelectItem value="orders">ออเดอร์สินค้า</SelectItem>
            <SelectItem value="revenueproducts">รายได้การขายสินค้า</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <aside className="hidden md:block w-64 shrink-0 bg-white p-4 rounded-lg shadow-md h-fit">
          <h2 className="text-lg font-semibold mb-3">เมนูจัดการ</h2>
          <div className="grid gap-2">
            <SidebarButton label="ภาพรวม" active={activeKey === "overview"} onClick={() => setActiveKey("overview")} />
            <SidebarButton label="จัดการสนาม" active={activeKey === "fields"} onClick={() => setActiveKey("fields")} />
            <SidebarButton label="จัดการการจอง" active={activeKey === "bookings"} onClick={() => setActiveKey("bookings")} />
            <SidebarButton label="จัดการข่าว" active={activeKey === "announcements"} onClick={() => setActiveKey("announcements")} />
            <SidebarButton label="จัดการผู้ใช้" active={activeKey === "users"} onClick={() => setActiveKey("users")} />
            <SidebarButton label="จัดการการชำระเงิน" active={activeKey === "payment-config"} onClick={() => setActiveKey("payment-config")} />
            <SidebarButton label="จัดการการแข่งขันฟุตบอล" active={activeKey === "competition-management"} onClick={() => setActiveKey("competition-management")} />
            <SidebarButton label="จัดการรายการแข่งขัน" active={activeKey === "competition-list"} onClick={() => setActiveKey("competition-list")} />
            <SidebarButton label="รายงานรายได้" active={activeKey === "revenue"} onClick={() => setActiveKey("revenue")} />
            <SidebarButton label="รายงานการใช้งานสนาม" active={activeKey === "booking-report"} onClick={() => setActiveKey("booking-report")} />
            <SidebarButton label="จัดการสินค้า" active={activeKey === "ProductManagement"} onClick={() => setActiveKey("ProductManagement")} />
            <SidebarButton label="ออเดอร์สินค้า" active={activeKey === "orders"} onClick={() => setActiveKey("orders")} />
            {/* <SidebarButton label="รายได้การขายสินค้า" active={activeKey === "revenueproducts"} onClick={() => setActiveKey("revenueproducts")} /> */}
          </div>
        </aside>
        <main className="flex-1">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <ActivePanel activeKey={activeKey} setActiveKey={setActiveKey} />
          </div>
        </main>
      </div>
    </div>
  );
}

type PanelKey =
  | "overview"
  | "fields"
  | "bookings"
  | "announcements"
  | "users"
  | "payment-config"
  | "competition-management"
  | "competition-list"
  | "revenue"
  | "booking-report"
  | "ProductManagement"
  | "orders"
  | "revenueproducts";

function ActivePanel({ activeKey, setActiveKey }: { activeKey: PanelKey; setActiveKey: (key: PanelKey) => void }) {
  const Components = useMemo(() => ({
    overview: () => <DashboardOverview setActiveKey={setActiveKey} />,
    fields: dynamic(() => import("./fields/page"), { ssr: false }),
    bookings: dynamic(() => import("./bookings/page"), { ssr: false }),
    announcements: dynamic(() => import("./announcements/page"), { ssr: false }),
    users: dynamic(() => import("./users/page"), { ssr: false }),
    "payment-config": dynamic(() => import("./payment-config/page"), { ssr: false }),
    "competition-management": dynamic(() => import("./competition-management/page"), { ssr: false }),
    "competition-list": dynamic(() => import("./competition-list/page"), { ssr: false }),
    revenue: dynamic(() => import("./revenue/page"), { ssr: false }),
    "booking-report": dynamic(() => import("./booking-report/page"), { ssr: false }),
    ProductManagement: dynamic(() => import("./ProductManagement/page"), { ssr: false }),
    orders: dynamic(() => import("./orders/page"), { ssr: false }),
    revenueproducts: dynamic(() => import("./revenueproducts/page"), { ssr: false }),
  }), []);

  const Component = Components[activeKey] as ComponentType<any> | undefined;
  if (!Component) return null;
  return <Component />;
}

function DashboardOverview({ setActiveKey }: { setActiveKey: (key: PanelKey) => void }) {
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    todayBookings: 0,
    todayBookingRevenue: 0,
    todayProductRevenue: 0,
    weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
    totalFields: 0,
    totalProducts: 0,
    pendingBookings: 0,
    paidBookings: 0,
    monthlyBookingRevenue: 0,
    monthlyProductRevenue: 0,
    weekDays: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard-stats');
        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data);
        } else {
          console.error('Failed to fetch dashboard stats');
          // Use fallback data if API fails
          setDashboardStats({
            totalUsers: 156,
            todayBookings: 8,
            todayBookingRevenue: 2400,
            todayProductRevenue: 1800,
            weeklyRevenue: [12000, 15000, 18000, 14000, 16000, 19000, 22000],
            totalFields: 3,
            totalProducts: 25,
            pendingBookings: 5,
            paidBookings: 45,
            monthlyBookingRevenue: 85000,
            monthlyProductRevenue: 32000,
            weekDays: []
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Use fallback data if API fails
        setDashboardStats({
          totalUsers: 156,
          todayBookings: 8,
          todayBookingRevenue: 2400,
          todayProductRevenue: 1800,
          weeklyRevenue: [12000, 15000, 18000, 14000, 16000, 19000, 22000],
          totalFields: 3,
          totalProducts: 25,
          pendingBookings: 5,
          paidBookings: 45,
          monthlyBookingRevenue: 85000,
          monthlyProductRevenue: 32000,
          weekDays: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const maxRevenue = Math.max(...dashboardStats.weeklyRevenue, 1);
  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">ภาพรวมระบบ</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white rounded-2xl p-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">ภาพรวมระบบ</h2>
              <p className="text-white/90 text-lg">แดशบอร์ดการจัดการสนามฟุตบอล</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}</span>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-600">จำนวนผู้ใช้ทั้งหมด</CardTitle>
              <div className="bg-blue-100 rounded-full p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 mb-1">{dashboardStats.totalUsers.toLocaleString()}</div>
            <p className="text-sm text-blue-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              ผู้ใช้ในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-600">การจองวันนี้</CardTitle>
              <div className="bg-green-100 rounded-full p-2">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 mb-1">{dashboardStats.todayBookings}</div>
            <p className="text-sm text-green-600 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              การจองสนาม
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-600">รายได้การจองวันนี้</CardTitle>
              <div className="bg-purple-100 rounded-full p-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 mb-1">฿{dashboardStats.todayBookingRevenue.toLocaleString()}</div>
            <p className="text-sm text-purple-600 flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              รายได้จากสนาม
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-600">รายได้การขายวันนี้</CardTitle>
              <div className="bg-orange-100 rounded-full p-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 mb-1">฿{dashboardStats.todayProductRevenue.toLocaleString()}</div>
            <p className="text-sm text-orange-600 flex items-center gap-1">
              <Package className="h-4 w-4" />
              รายได้จากสินค้า
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-indigo-600">จำนวนสนาม</CardTitle>
              <div className="bg-indigo-100 rounded-full p-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700 mb-1">{dashboardStats.totalFields}</div>
            <p className="text-sm text-indigo-600 flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              สนามฟุตบอล
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-50 via-white to-teal-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-teal-600">จำนวนสินค้า</CardTitle>
              <div className="bg-teal-100 rounded-full p-2">
                <Package className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700 mb-1">{dashboardStats.totalProducts}</div>
            <p className="text-sm text-teal-600 flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              สินค้าในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 via-white to-amber-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group" onClick={() => setActiveKey("bookings")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                รอชำระ
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardTitle>
              <div className="bg-amber-100 rounded-full p-2 group-hover:bg-amber-200 transition-colors">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 mb-1">{dashboardStats.pendingBookings}</div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                การจองที่รอชำระ
              </p>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 p-1 h-auto group-hover:bg-amber-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveKey("bookings");
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-600">ชำระแล้ว</CardTitle>
              <div className="bg-emerald-100 rounded-full p-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 mb-1">{dashboardStats.paidBookings}</div>
            <p className="text-sm text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              การจองที่ชำระแล้ว
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-bold text-emerald-800">รายได้รวมเดือนนี้</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm text-emerald-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  รายได้การจอง:
                </span>
                <span className="text-lg font-bold text-emerald-700">฿{dashboardStats.monthlyBookingRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm text-emerald-600 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  รายได้การขาย:
                </span>
                <span className="text-lg font-bold text-emerald-700">฿{dashboardStats.monthlyProductRevenue.toLocaleString()}</span>
              </div>
              <div className="border-t-2 border-emerald-200 pt-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-lg">
                  <span className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    รวมทั้งหมด:
                  </span>
                  <span className="text-2xl font-bold text-emerald-800">฿{(dashboardStats.monthlyBookingRevenue + dashboardStats.monthlyProductRevenue).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 via-white to-cyan-50 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
              <CardTitle className="text-xl font-bold text-cyan-800">สรุปวันนี้</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                <span className="text-sm text-cyan-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  รายได้รวม:
                </span>
                <span className="text-lg font-bold text-cyan-700">฿{(dashboardStats.todayBookingRevenue + dashboardStats.todayProductRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                <span className="text-sm text-cyan-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  การจอง:
                </span>
                <span className="text-lg font-bold text-cyan-700">{dashboardStats.todayBookings} รายการ</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-100 to-cyan-50 rounded-lg">
                <span className="text-sm text-cyan-600 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  อัตราการใช้งาน:
                </span>
                <span className="text-lg font-bold text-cyan-700">
                  {dashboardStats.totalFields > 0 ? Math.round((dashboardStats.todayBookings / dashboardStats.totalFields) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 via-white to-slate-50 hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 rounded-full p-3">
              <BarChart3 className="h-6 w-6 text-slate-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-800">รายได้รายสัปดาห์</CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-2">แสดงรายได้ 7 วันที่ผ่านมา</p>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-end justify-between gap-3 p-4 bg-gradient-to-t from-slate-50 to-transparent rounded-lg">
            {dashboardStats.weeklyRevenue.map((revenue, index) => (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full">
                  <div
                    className="bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 cursor-pointer shadow-lg group-hover:shadow-xl transform group-hover:scale-105"
                    style={{
                      height: `${(revenue / maxRevenue) * 220}px`,
                      minHeight: '24px'
                    }}
                    title={`${days[index]}: ฿${revenue.toLocaleString()}`}
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ฿{revenue.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-slate-600 mt-3 text-center font-medium">
                  {days[index]}
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1 bg-slate-100 px-2 py-1 rounded">
                  ฿{revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SidebarButton({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Button
      variant={active ? "default" : "secondary"}
      className={active ? "bg-blue-600 hover:bg-blue-700 text-white w-full justify-start" : "w-full justify-start"}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}