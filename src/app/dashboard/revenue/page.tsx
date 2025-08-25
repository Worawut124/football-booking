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

interface RevenueItem {
  id: number;
  userName: string;
  fieldName: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
}

export default function RevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [revenueData, setRevenueData] = useState<RevenueItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date(), "yyyy-MM"));
  const [currentPage, setCurrentPage] = useState<number>(1);
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

    const fetchRevenue = async () => {
      try {
        const dateQuery = selectedDate ? selectedDate : formatDate(new Date(), "yyyy-MM");
        const response = await fetch(`/api/revenue?period=${period}&date=${dateQuery}`);
        if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลรายได้ได้");
        const data = await response.json();
        setRevenueData(data.revenueData || []);
        setTotalRevenue(data.totalRevenue || 0);
        setCurrentPage(1); // รีเซ็ตหน้าเมื่อข้อมูลเปลี่ยน
      } catch (error) {
        console.error("Error fetching revenue:", error);
        alert("ไม่สามารถโหลดข้อมูลรายได้ได้");
      }
    };

    fetchRevenue();
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

  if (status === "loading") {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (session?.user?.role !== "OWNER") {
    return <div className="container mx-auto p-4 text-center text-red-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">รายงานรายได้</h1>
      <div className="flex justify-end mb-4 space-x-4">
        <Input
          type="month"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[180px]"
        />
        <Select value={period} onValueChange={(value: "monthly" | "yearly") => setPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="เลือกช่วงเวลา" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">รายเดือน</SelectItem>
            <SelectItem value="yearly">รายปี</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>
              รายได้จากการจอง ({period === "monthly" ? "รายเดือน" : "รายปี"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-right">
              <strong className="text-xl text-green-600">ยอดรายได้รวม: {totalRevenue.toLocaleString()} บาท</strong>
            </div>
            {revenueData.length === 0 ? (
              <p className="text-gray-600 text-center">ไม่มีรายการจองในช่วงนี้</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px] text-center">วันที่และเวลาเริ่ม</TableHead>
                      <TableHead className="min-w-[150px] text-center">วันที่และเวลาสิ้นสุด</TableHead>
                      <TableHead className="min-w-[150px] text-center">ผู้จอง</TableHead>
                      <TableHead className="min-w-[150px] text-center">สนาม</TableHead>
                      <TableHead className="min-w-[150px] text-center">ยอดชำระ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="min-w-[150px] text-center">
                          {format(new Date(item.startTime), "dd MMMM yyyy HH:mm", { locale: th })} น.
                        </TableCell>
                        <TableCell className="min-w-[150px] text-center">
                          {format(new Date(item.endTime), "dd MMMM yyyy HH:mm", { locale: th })} น.
                        </TableCell>
                        <TableCell className="min-w-[150px] text-center">{item.userName}</TableCell>
                        <TableCell className="min-w-[150px] text-center">{item.fieldName}</TableCell>
                        <TableCell className="min-w-[150px] text-center">{item.totalAmount.toLocaleString()} บาท</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-gray-600">
                    แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, revenueData.length)} จาก {revenueData.length} รายการ
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
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
    </div>
  );
}