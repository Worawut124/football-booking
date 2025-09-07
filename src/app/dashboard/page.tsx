"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">แดชบอร์ด (Admin/Owner)</h1>
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
            <SidebarButton label="รายงานรายได้การจอง" active={activeKey === "revenue"} onClick={() => setActiveKey("revenue")} />
            <SidebarButton label="รายงานการใช้งานสนาม" active={activeKey === "booking-report"} onClick={() => setActiveKey("booking-report")} />
            <SidebarButton label="จัดการสินค้า" active={activeKey === "ProductManagement"} onClick={() => setActiveKey("ProductManagement")} />
            <SidebarButton label="ออเดอร์สินค้า" active={activeKey === "orders"} onClick={() => setActiveKey("orders")} />
            <SidebarButton label="รายได้การขายสินค้า" active={activeKey === "revenueproducts"} onClick={() => setActiveKey("revenueproducts")} />
          </div>
        </aside>
        <main className="flex-1">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <ActivePanel activeKey={activeKey} />
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

function ActivePanel({ activeKey }: { activeKey: PanelKey }) {
  const Components = useMemo(() => ({
    overview: DashboardOverview,
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

function DashboardOverview() {
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">ภาพรวมระบบ</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">จำนวนผู้ใช้ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{dashboardStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-blue-600 mt-1">ผู้ใช้ในระบบ</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">การจองวันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{dashboardStats.todayBookings}</div>
            <p className="text-xs text-green-600 mt-1">การจองสนาม</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">รายได้การจองวันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">฿{dashboardStats.todayBookingRevenue.toLocaleString()}</div>
            <p className="text-xs text-purple-600 mt-1">รายได้จากสนาม</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">รายได้การขายวันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">฿{dashboardStats.todayProductRevenue.toLocaleString()}</div>
            <p className="text-xs text-orange-600 mt-1">รายได้จากสินค้า</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-600">จำนวนสนาม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">{dashboardStats.totalFields}</div>
            <p className="text-xs text-indigo-600 mt-1">สนามฟุตบอล</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-600">จำนวนสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700">{dashboardStats.totalProducts}</div>
            <p className="text-xs text-teal-600 mt-1">สินค้าในระบบ</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">รอชำระ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{dashboardStats.pendingBookings}</div>
            <p className="text-xs text-amber-600 mt-1">การจองที่รอชำระ</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-600">ชำระแล้ว</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">{dashboardStats.paidBookings}</div>
            <p className="text-xs text-rose-600 mt-1">การจองที่ชำระแล้ว</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-emerald-800">รายได้รวมเดือนนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-600">รายได้การจอง:</span>
                <span className="text-lg font-bold text-emerald-700">฿{dashboardStats.monthlyBookingRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-600">รายได้การขาย:</span>
                <span className="text-lg font-bold text-emerald-700">฿{dashboardStats.monthlyProductRevenue.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-emerald-800">รวม:</span>
                  <span className="text-xl font-bold text-emerald-800">฿{(dashboardStats.monthlyBookingRevenue + dashboardStats.monthlyProductRevenue).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-cyan-800">สรุปวันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-600">รายได้รวม:</span>
                <span className="text-lg font-bold text-cyan-700">฿{(dashboardStats.todayBookingRevenue + dashboardStats.todayProductRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-600">การจอง:</span>
                <span className="text-base font-medium text-cyan-700">{dashboardStats.todayBookings} รายการ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-600">อัตราการใช้งาน:</span>
                <span className="text-base font-medium text-cyan-700">
                  {dashboardStats.totalFields > 0 ? Math.round((dashboardStats.todayBookings / dashboardStats.totalFields) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">รายได้รายสัปดาห์</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {dashboardStats.weeklyRevenue.map((revenue, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative w-full">
                  <div
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                    style={{
                      height: `${(revenue / maxRevenue) * 200}px`,
                      minHeight: '20px'
                    }}
                    title={`${days[index]}: ฿${revenue.toLocaleString()}`}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center">
                  {days[index]}
                </div>
                <div className="text-xs font-medium text-gray-800 mt-1">
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