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
import { addMonths, format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface BookingReport {
  month: string;
  userId: number;
  userName: string;
  bookingCount: number;
}

export default function FootballFieldBookingReport() {
  const [reportData, setReportData] = useState<BookingReport[]>([]);
  const [startDate, setStartDate] = useState<Date>(addMonths(new Date(), -11)); // 12 เดือนย้อนหลัง
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

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
        setError(null);
      } else if (response.status === 403) {
        setError("คุณไม่มีสิทธิ์เข้าถึงรายงานนี้");
      } else {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    }
    fetchBookingReport();
  }, [startDate, endDate]);

  const columns: ColumnDef<BookingReport>[] = [
    { accessorKey: "month", header: "เดือน/ปี" },
    { accessorKey: "userId", header: "รหัสผู้ใช้" },
    { accessorKey: "userName", header: "ชื่อผู้ใช้" },
    { accessorKey: "bookingCount", header: "จำนวนการจอง" },
  ];

  const table = useReactTable({
    data: reportData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // เปิดใช้งาน pagination
    initialState: {
      pagination: {
        pageSize: 10, // จำกัด 10 แถวต่อหน้า
      },
    },
  });

  return (
    <div className="container mx-auto py-6 px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-4 text-center sm:text-left">
        รายงานการจองสนามฟุตบอลตามเดือน
      </h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="mb-6 flex justify-center flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <label className="block text-sm font-medium mb-1 text-center ">เลือกวันที่เริ่มต้น</label>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => date && setStartDate(date)}
            className="rounded-md border mx-auto"
            locale={th}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <label className="block text-sm font-medium mb-1 text-center">เลือกวันที่สิ้นสุด</label>
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => date && setEndDate(date)}
            className="rounded-md border mx-auto"
            locale={th}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[300px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-2">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-100">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {error || "ไม่พบข้อมูลการจอง"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 mt-4">
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-4 py-2"
        >
          ย้อนกลับ
        </Button>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-4 py-2"
        >
          ถัดไป
        </Button>
        <span className="text-sm">
          หน้า {table.getState().pagination.pageIndex + 1} จาก {table.getPageCount()}
        </span>
      </div>
      <Button
        onClick={() => {
          setStartDate(addMonths(new Date(), -11));
          setEndDate(new Date());
          setError(null);
        }}
        className="mt-4"
      >
        รีเซ็ต
      </Button>
    </div>
  );
}