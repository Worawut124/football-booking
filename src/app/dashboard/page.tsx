"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
    <div className="container mx-auto p-4 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">แดชบอร์ด (Admin/Owner)</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">เลือกการจัดการ</h2>
        <div className="flex gap-4 flex-wrap">
          <Link href="/dashboard/fields">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการสนาม</Button>
          </Link>
          <Link href="/dashboard/bookings">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการการจอง</Button>
          </Link>
          <Link href="/dashboard/announcements">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการข่าว</Button>
          </Link>
          <Link href="/dashboard/users">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการผู้ใช้</Button>
          </Link>
          <Link href="/dashboard/payment-config">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการการชำระเงิน</Button>
          </Link>
          <Link href="/dashboard/competition-management">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการการสมัครการแข่งขันฟุตบอล</Button>
          </Link>
          <Link href="/dashboard/competition-list">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการรายการแข่งขัน</Button>
          </Link>
          <Link href="/dashboard/revenue">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">ดูรายงานรายได้</Button>
          </Link>
          <Link href="/dashboard/booking-report">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">ดูรายงานการใช้งานสนาม</Button>
          </Link>
          <Link href="/dashboard/ProductManagement">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">จัดการสินค้า</Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">ออเดอร์สินค้า</Button>
          </Link>
          <Link href="/dashboard/revenueproducts">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">รายได้การขายสินค้า</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}