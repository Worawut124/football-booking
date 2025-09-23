"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addMonths, format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  BarChart3,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  TrendingUp,
  Sparkles,
  Filter,
  RefreshCw,
  Search,
  FileText,
  Trophy,
  Target,
  Activity
} from "lucide-react";

interface BookingReport {
  month: string;
  userId: number;
  userName: string;
  bookingCount: number;
}

export default function FootballFieldBookingReport() {
  const [reportData, setReportData] = useState<BookingReport[]>([]);
  const [filteredData, setFilteredData] = useState<BookingReport[]>([]);
  const [startDate, setStartDate] = useState<Date>(addMonths(new Date(), -11)); // 12 เดือนย้อนหลัง
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCalendars, setShowCalendars] = useState(false);

  useEffect(() => {
    async function fetchBookingReport() {
      const token = localStorage.getItem("token"); // ปรับตามระบบ auth
      const response = await fetch(
        `/api/booking-report?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data: BookingReport[] = await response.json();
        setReportData(data);
        setFilteredData(data);
        setError(null);
      } else if (response.status === 403) {
        setError("คุณไม่มีสิทธิ์เข้าถึงรายงานนี้");
      } else {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    }
    fetchBookingReport();
  }, [startDate, endDate]);

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(reportData);
    } else {
      const filtered = reportData.filter((item) =>
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userId.toString().includes(searchTerm)
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, reportData]);

  const columns: ColumnDef<BookingReport>[] = [
    { accessorKey: "month", header: "เดือน/ปี" },
    { accessorKey: "userId", header: "รหัสผู้ใช้" },
    { accessorKey: "userName", header: "ชื่อผู้ใช้" },
    { accessorKey: "bookingCount", header: "จำนวนการจอง" },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // เปิดใช้งาน pagination
    initialState: {
      pagination: {
        pageSize: 10, // จำกัด 10 แถวต่อหน้า
      },
    },
  });

  // Calculate statistics
  const totalBookings = filteredData.reduce((sum, item) => sum + item.bookingCount, 0);
  const uniqueUsers = new Set(filteredData.map(item => item.userId)).size;
  const avgBookingsPerUser = uniqueUsers > 0 ? Math.round(totalBookings / uniqueUsers) : 0;
  const topUser = filteredData.reduce((max, item) => 
    item.bookingCount > (max?.bookingCount || 0) ? item : max, null as BookingReport | null
  );

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
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">รายงานการใช้งานสนาม</h1>
              <p className="text-white/90 text-lg">รายงานการจองสนามฟุตบอลตามเดือน</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">รายการทั้งหมด: {filteredData.length} รายการ</span>
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <Activity className="h-5 w-5" />
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
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{totalBookings}</div>
                <p className="text-sm text-blue-600">การจองทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">{uniqueUsers}</div>
                <p className="text-sm text-green-600">ผู้ใช้ที่จอง</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-1">{avgBookingsPerUser}</div>
                <p className="text-sm text-purple-600">เฉลี่ย/คน</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <Trophy className="h-6 w-6 text-orange-600" />
                  </div>
                  <Trophy className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">{topUser?.bookingCount || 0}</div>
                <p className="text-sm text-orange-600">จองสูงสุด</p>
                {topUser && (
                  <p className="text-xs text-orange-500 mt-1">{topUser.userName}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filter Section */}
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl shadow-lg border border-slate-200 w-full">
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
                    placeholder="ค้นหาชื่อผู้ใช้, เดือน, รหัส..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Date Range Toggle */}
              <Button
                onClick={() => setShowCalendars(!showCalendars)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {showCalendars ? 'ซ่อนปฏิทิน' : 'เลือกช่วงวันที่'}
              </Button>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setStartDate(addMonths(new Date(), -11));
                  setEndDate(new Date());
                  setSearchTerm("");
                  setError(null);
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>
          </div>

          {/* Calendar Section */}
          {showCalendars && (
            <Card className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-blue-800">
                  <CalendarIcon className="h-6 w-6" />
                  เลือกช่วงวันที่
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="text-center">
                    <label className="block text-sm font-medium mb-4 text-slate-700">วันที่เริ่มต้น</label>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        className="rounded-lg border-2 border-blue-200 shadow-md"
                        locale={th}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium mb-4 text-slate-700">วันที่สิ้นสุด</label>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        className="rounded-lg border-2 border-purple-200 shadow-md"
                        locale={th}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <BarChart3 className="h-6 w-6" />
                รายงานการจองตามเดือน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบข้อมูล</h3>
                  <p className="text-slate-500">
                    {searchTerm 
                      ? "ไม่มีข้อมูลที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ไม่พบข้อมูลการจองในช่วงเวลาที่เลือก"
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงข้อมูลทั้งหมด
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                    <Table className="min-w-[600px]">
                      <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                        <TableRow className="border-b-2 border-slate-200">
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-blue-600" />
                              เดือน/ปี
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Target className="h-4 w-4 text-green-600" />
                              รหัสผู้ใช้
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              ชื่อผู้ใช้
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Activity className="h-4 w-4 text-orange-600" />
                              จำนวนการจอง
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} className="hover:bg-blue-50 transition-colors">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="text-center p-4">
                                {cell.column.id === 'bookingCount' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())} ครั้ง
                                  </span>
                                ) : (
                                  <span className="font-medium">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                    <div className="text-slate-600 text-sm">
                      แสดง {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)} จาก {filteredData.length} รายการ
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ก่อนหน้า
                      </Button>
                      <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                        หน้า {table.getState().pagination.pageIndex + 1} จาก {table.getPageCount()}
                      </span>
                      <Button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ถัดไป
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}