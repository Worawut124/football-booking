"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// ตัวอย่างข้อมูลจาก API (จะถูกแทนที่ด้วย fetch)
type Registration = {
  id: number;
  teamName: string;
  managerName: string;
  contactNumber: string;
  playerCount: number;
  category: string;
  status: string;
  depositFileName?: string;
};

export default function RegistrationHistory() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token"); // ปรับตามระบบ auth ของคุณ
      const response = await fetch("/api/football-competition", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    }
    fetchData();
  }, []);

  const columns: ColumnDef<Registration>[] = [
    {
      accessorKey: "teamName",
      header: "ชื่อทีม",
    },
    {
      accessorKey: "managerName",
      header: "ผู้จัดการ",
      cell: ({ row }) => (
        <span className="sm:hidden md:block">{row.original.managerName}</span>
      ),
    },
    {
      accessorKey: "contactNumber",
      header: "เบอร์ติดต่อ",
      cell: ({ row }) => (
        <span className="sm:hidden md:block">{row.original.contactNumber}</span>
      ),
    },
    {
      accessorKey: "playerCount",
      header: "จำนวนผู้เล่น",
    },
    {
      accessorKey: "category",
      header: "หมวดหมู่",
      cell: ({ row }) => (
        <span className="sm:hidden md:block">{row.original.category}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "สถานะ",
    },
    {
      id: "actions",
      header: "การจัดการ",
      cell: ({ row }) => (
        <Button
          onClick={() => router.push(`/submit-players/${row.original.id}`)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2"
        >
          ส่งรายชื่อนักเตะ
        </Button>
      ),
    },
    // {
    //   accessorKey: "depositFileName",
    //   header: "ไฟล์มัดจำ",
    //   cell: ({ row }) => row.original.depositFileName || "ไม่มี",
    // },
  ];

  const table = useReactTable({
    data: registrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-4 text-center sm:text-left">
        ประวัติการสมัครการแข่งขัน
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[300px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-2 py-2 sm:px-4 text-sm sm:text-base"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-100 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-2 py-2 sm:px-4 text-sm sm:text-base break-words"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm sm:text-base"
                >
                  ไม่พบข้อมูลการสมัคร
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}