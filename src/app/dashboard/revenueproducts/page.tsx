"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

interface RevenueStats {
  totalRevenue: number;
  totalProducts: number;
  categories: string[];
  totalStock: number;
}

export default function RevenueReport() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const months = [
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => year.toString());

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const url = new URL("/api/orders", window.location.origin);
        if (selectedMonth) url.searchParams.append("month", selectedMonth);
        if (selectedYear) url.searchParams.append("year", selectedYear);
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
          setStats(data.stats || { totalRevenue: 0, totalProducts: 0, categories: [], totalStock: 0 });
          setError(null);
        } else {
          setError("เกิดข้อผิดพลาดในการดึงรายงานรายได้");
        }
      } catch (error) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (error as Error).message);
        console.error("Error fetching revenue:", error);
      }
    }
    fetchRevenue();
  }, [selectedMonth, selectedYear]);

  const handleSearch = () => {
    // Trigger refetch by updating state (already handled by useEffect)
  };

  // กลุ่มสินค้าตาม productId และนับจำนวน
  const productSales = orders.reduce((acc, order) => {
    const productName = order.product.name;
    acc[productName] = (acc[productName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto py-6 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">รายงานรายได้</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">เลือกเดือน</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">ทั้งหมด</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">เลือกปี</label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">ทั้งหมด</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleSearch} className="w-full sm:w-auto">ค้นหา</Button>
      </div>
      <div className="bg-white p-6 rounded-md shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">รายได้รวม</h3>
        <p className="text-3xl font-bold mb-6">{(stats?.totalRevenue || 0).toLocaleString()} บาท</p>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">สินค้าที่ขายได้ในเดือนนี้</h3>
        {Object.keys(productSales).length === 0 ? (
          <p className="text-center text-gray-500">ไม่มีข้อมูลการขายในเดือนนี้</p>
        ) : (
          <ul className="list-disc pl-5">
            {Object.entries(productSales).map(([productName, count]) => (
              <li key={productName} className="mb-2">
                {productName}: ขายได้ {count} ชิ้น
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}