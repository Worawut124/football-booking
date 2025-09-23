"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { format, parse, startOfDay, addMinutes } from "date-fns";
import { th } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Image,
  Filter,
  RefreshCw,
  Trophy,
  Sparkles
} from "lucide-react";

// กำหนด Type สำหรับโครงสร้างข้อมูล
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Field {
  id: number;
  name: string;
  location: string;
}

interface Payment {
  id: number;
  proof: string | null;
  type?: string; // 'DEPOSIT' | 'FULL'
  method?: string;
  amount?: number;
}

interface Booking {
  id: number;
  userId: number;
  fieldId: number;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  user: User;
  field: Field;
  payments?: Payment[];
}

// สร้างตัวเลือกเวลาเริ่มต้นทุก 30 นาที (08:00-00:00)
const generateTimeOptions = () => {
  const options = [];
  const startTime = startOfDay(new Date()).setHours(8, 0); // 08:00
  const endTime = startOfDay(new Date()).setHours(24, 0); // 00:00 (เที่ยงคืน)

  for (let time = startTime; time <= endTime; time = addMinutes(time, 30).getTime()) {
    const currentTime = new Date(time);
    const timeValue = format(currentTime, "HH:mm");
    options.push({
      value: timeValue,
      label: `${timeValue} น.`,
    });
  }
  return options;
};

const timeOptions = generateTimeOptions();

// ฟังก์ชันกำหนดสีสถานะ
const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "pending_confirmation":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "ชำระแล้ว";
    case "pending":
      return "รอชำระเงิน";
    case "pending_confirmation":
      return "รอดำเนินการ";
    case "cancelled":
      return "ยกเลิก";
    default:
      return status;
  }
};

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchDate, setSearchDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [editBooking, setEditBooking] = useState<{
    id: number;
    userId: number;
    fieldId: number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  } | null>(null);
  const [newBooking, setNewBooking] = useState<{
    userId: number | null;
    fieldId: number | null;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [overlappingTimes, setOverlappingTimes] = useState<{
    startTimes: string[];
    endTimes: string[];
  }>({ startTimes: [], endTimes: [] });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/booking");
      return;
    }

    const fetchData = async () => {
      try {
        const usersResponse = await fetch("/api/users");
        if (!usersResponse.ok) throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        const fieldsResponse = await fetch("/api/fields");
        if (!fieldsResponse.ok) throw new Error("ไม่สามารถดึงข้อมูลสนามได้");
        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData);

        const bookingsResponse = await fetch("/api/bookings");
        if (!bookingsResponse.ok) throw new Error("ไม่สามารถดึงข้อมูลการจองได้");
        const bookingsData = await bookingsResponse.json();
        console.log("Bookings Data:", bookingsData); // Log เพื่อตรวจสอบข้อมูล
        const sortedBookings = bookingsData.sort((a: Booking, b: Booking) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateA.getTime() - dateB.getTime();
        });
        setBookings(sortedBookings);
        setFilteredBookings(sortedBookings);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถโหลดข้อมูลได้",
        });
      }
    };
    fetchData();
  }, [status, router, session]);

  useEffect(() => {
    let filtered = [...bookings];

    // Filter by date
    if (searchDate) {
      filtered = filtered.filter((booking) => {
        const bookingDate = format(new Date(booking.startTime), "yyyy-MM-dd");
        return bookingDate === searchDate;
      });
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Sort by date
    const sortedFiltered = filtered.sort((a: Booking, b: Booking) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredBookings(sortedFiltered);
    setCurrentPage(1);
  }, [searchDate, statusFilter, bookings]);

  const fetchOverlappingTimes = async (fieldId: number, date: string, excludeId?: number) => {
    try {
      const response = await fetch(`/api/bookings/overlapping?fieldId=${fieldId}&date=${date}${excludeId ? `&excludeId=${excludeId}` : ""}`);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลการจองที่ทับซ้อนได้");
      const data = await response.json();
      setOverlappingTimes(data);
    } catch (error) {
      console.error("Error fetching overlapping times:", error);
      setOverlappingTimes({ startTimes: [], endTimes: [] });
    }
  };

  const checkOverlap = (fieldId: number, startTime: string, endTime: string, date: string, excludeId?: number) => {
    const newStart = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date()).getTime();
    const newEnd = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date()).getTime();

    return bookings.some((booking) => {
      if (excludeId && booking.id === excludeId) return false;
      if (booking.fieldId !== fieldId) return false;

      const bookingDate = format(new Date(booking.startTime), "yyyy-MM-dd");
      if (bookingDate !== date) return false;

      const existingStart = new Date(booking.startTime).getTime();
      const existingEnd = new Date(booking.endTime).getTime();

      const startMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
      const endMinutes = parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);
      const existingStartMinutes = parseInt(format(new Date(booking.startTime), "HH:mm").split(":")[0]) * 60 +
        parseInt(format(new Date(booking.startTime), "HH:mm").split(":")[1]);
      const existingEndMinutes = parseInt(format(new Date(booking.endTime), "HH:mm").split(":")[0]) * 60 +
        parseInt(format(new Date(booking.endTime), "HH:mm").split(":")[1]);

      if (newStart === existingEnd || newEnd === existingStart) {
        return false;
      }

      for (let time = existingStartMinutes; time <= existingEndMinutes; time += 30) {
        const timeInMs = parse(`${date} ${Math.floor(time / 60).toString().padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`, "yyyy-MM-dd HH:mm", new Date()).getTime();
        if (newStart <= timeInMs && timeInMs <= newEnd) {
          return true;
        }
      }

      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  const handleAddBooking = async () => {
    if (!newBooking || !newBooking.userId || !newBooking.fieldId || !newBooking.date || !newBooking.startTime || !newBooking.endTime) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
      return;
    }

    const start = parse(`${newBooking.date} ${newBooking.startTime}`, "yyyy-MM-dd HH:mm", new Date()).getTime();
    const end = parse(`${newBooking.date} ${newBooking.endTime}`, "yyyy-MM-dd HH:mm", new Date()).getTime();
    if (end <= start) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
      });
      return;
    }

    if (checkOverlap(newBooking.fieldId, newBooking.startTime, newBooking.endTime, newBooking.date)) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ช่วงเวลานี้ถูกจองแล้ว",
      });
      return;
    }

    const startTime = parse(`${newBooking.date} ${newBooking.startTime}`, "yyyy-MM-dd HH:mm", new Date());
    const endTime = parse(`${newBooking.date} ${newBooking.endTime}`, "yyyy-MM-dd HH:mm", new Date());

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: newBooking.userId,
        fieldId: newBooking.fieldId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: newBooking.status,
      }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "เพิ่มการจองสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const addedBooking = await response.json();
      const updatedBookings = [...bookings, addedBooking].sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setBookings(updatedBookings);
      setFilteredBookings(updatedBookings);
      setNewBooking(null);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถเพิ่มการจองได้",
      });
    }
  };

  const handleEditBooking = async () => {
    if (!editBooking) return;

    const start = parse(`${editBooking.date} ${editBooking.startTime}`, "yyyy-MM-dd HH:mm", new Date()).getTime();
    const end = parse(`${editBooking.date} ${editBooking.endTime}`, "yyyy-MM-dd HH:mm", new Date()).getTime();
    if (end <= start) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
      });
      return;
    }

    if (checkOverlap(editBooking.fieldId, editBooking.startTime, editBooking.endTime, editBooking.date, editBooking.id)) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ช่วงเวลานี้ถูกจองแล้ว",
      });
      return;
    }

    const startTime = parse(`${editBooking.date} ${editBooking.startTime}`, "yyyy-MM-dd HH:mm", new Date());
    const endTime = parse(`${editBooking.date} ${editBooking.endTime}`, "yyyy-MM-dd HH:mm", new Date());

    const response = await fetch("/api/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editBooking.id,
        userId: editBooking.userId,
        fieldId: editBooking.fieldId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: editBooking.status,
      }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "แก้ไขการจองสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedBooking = await response.json();
      const updatedBookings = bookings.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking)).sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setBookings(updatedBookings);
      setFilteredBookings(updatedBookings);
      setEditBooking(null);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถแก้ไขการจองได้",
      });
    }
  };

  const handleDeleteBooking = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบการจองนี้จริงๆ ใช่ไหม?",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบ",
      cancelButtonText: "ไม่, กลับ",
    });

    if (!result.isConfirmed) return;

    const response = await fetch("/api/bookings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "ลบการจองสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedBookings = bookings.filter((booking) => booking.id !== id).sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setBookings(updatedBookings);
      setFilteredBookings(updatedBookings);
      if (paginatedBookings.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถลบการจองได้",
      });
    }
  };

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (status === "loading") {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
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
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">จัดการการจอง</h1>
              <p className="text-white/90 text-lg">ระบบจัดการการจองสนามฟุตบอล</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">รายการทั้งหมด: {filteredBookings.length} รายการ</span>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
            <Dialog open={newBooking !== null} onOpenChange={(open) => !open && setNewBooking(null)}>
              <DialogTrigger asChild>
                <Button
                  onClick={() =>
                    setNewBooking({
                      userId: null,
                      fieldId: null,
                      date: "",
                      startTime: "",
                      endTime: "",
                      status: "pending",
                    })
                  }
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-6 py-3"
                >
                  <Plus className="h-5 w-5" />
                  เพิ่มการจองใหม่
                </Button>
              </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>เพิ่มการจองใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผู้จอง</label>
                  <Select
                    value={newBooking?.userId?.toString() || ""}
                    onValueChange={(value) => setNewBooking({ ...newBooking!, userId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกผู้จอง" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สนาม</label>
                  <Select
                    value={newBooking?.fieldId?.toString() || ""}
                    onValueChange={(value) => {
                      const fieldId = parseInt(value);
                      setNewBooking({ ...newBooking!, fieldId });
                      if (newBooking?.date) {
                        fetchOverlappingTimes(fieldId, newBooking.date);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสนาม" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id.toString()}>
                          {field.name} ({field.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                  <Input
                    type="date"
                    value={newBooking?.date || ""}
                    onChange={(e) => {
                      const date = e.target.value;
                      setNewBooking({ ...newBooking!, date });
                      if (newBooking?.fieldId) {
                        fetchOverlappingTimes(newBooking.fieldId, date);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่มต้น</label>
                  <Select
                    value={newBooking?.startTime || ""}
                    onValueChange={(value) => setNewBooking({ ...newBooking!, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเวลาเริ่มต้น" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => {
                        const isOverlapping = overlappingTimes.startTimes.includes(option.value);
                        return (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={isOverlapping}
                            className={isOverlapping ? "text-green-600" : ""}
                          >
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
                  <Select
                    value={newBooking?.endTime || ""}
                    onValueChange={(value) => setNewBooking({ ...newBooking!, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเวลาสิ้นสุด" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => {
                        const isOverlapping = overlappingTimes.endTimes.includes(option.value);
                        return (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={isOverlapping}
                            className={isOverlapping ? "text-green-600" : ""}
                          >
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                  <Select
                    value={newBooking?.status || ""}
                    onValueChange={(value) => setNewBooking({ ...newBooking!, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">รอชำระเงิน</SelectItem>
                      <SelectItem value="paid">ชำระแล้ว</SelectItem>
                      <SelectItem value="cancelled">ยกเลิก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddBooking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  บันทึก
                </Button>
              </div>
            </DialogContent>
          </Dialog>

            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl shadow-lg border border-slate-200 w-full">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">ตัวกรอง:</label>
              </div>
              
              {/* Date Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">วันที่:</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full sm:w-48 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">สถานะ:</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm">
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            รอชำระเงิน
                          </div>
                        </SelectItem>
                        <SelectItem value="pending_confirmation">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            รอดำเนินการ
                          </div>
                        </SelectItem>
                        <SelectItem value="paid">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            ชำระแล้ว
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            ยกเลิก
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              <Button
                onClick={() => {
                  setSearchDate("");
                  setStatusFilter("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                ล้างตัวกรอง
              </Button>
            </div>
          </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Search className="h-16 w-16 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบรายการจอง</h3>
            <p className="text-slate-500">
              {searchDate || statusFilter 
                ? "ไม่มีรายการจองที่ตรงกับเงื่อนไขการค้นหา" 
                : "ยังไม่มีรายการจองในระบบ"
              }
            </p>
            {(searchDate || statusFilter) && (
              <Button
                onClick={() => {
                  setSearchDate("");
                  setStatusFilter("");
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                แสดงรายการทั้งหมด
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* ตารางสำหรับ Desktop */}
            <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
              <Table>
                <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                  <TableRow className="border-b-2 border-slate-200">
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        ผู้จอง
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        เบอร์โทร
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        สนาม
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        วันที่
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        เวลา
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        สถานะ
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <Image className="h-4 w-4 text-yellow-600" />
                        สลิปมัดจำ
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <Image className="h-4 w-4 text-pink-600" />
                        สลิปชำระเต็ม
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[220px] text-center font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <Edit className="h-4 w-4 text-cyan-600" />
                        การจัดการ
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="min-w-[150px] text-center">
                        {booking.user?.name || "ไม่ระบุ"} ({booking.user?.email || "ไม่ระบุ"})
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        {booking.user?.phone || "ไม่ระบุ"}
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        {booking.field?.name || "ไม่ระบุ"} ({booking.field?.location || "ไม่ระบุ"})
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        {format(new Date(booking.startTime), "dd MMMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        {format(new Date(booking.startTime), "HH:mm", { locale: th })} -{" "}
                        {format(new Date(booking.endTime), "HH:mm", { locale: th })}
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        <span className={`px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </TableCell>
                      {/* Deposit slips column */}
                      <TableCell className="min-w-[150px] text-center">
                        {booking.payments && booking.payments.some(p => (p.type || '').toUpperCase() === 'DEPOSIT' && p.proof) ? (
                          <div className="flex gap-2 justify-center">
                            {booking.payments
                              .filter(p => (p.type || '').toUpperCase() === 'DEPOSIT' && !!p.proof)
                              .map((p) => (
                                <Dialog key={p.id}>
                                  <DialogTrigger asChild>
                                    <img
                                      src={p.proof!}
                                      alt="Deposit Proof"
                                      className="w-16 h-16 object-cover mx-auto rounded cursor-pointer"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[80%] max-h-[80vh] overflow-auto">
                                    <DialogHeader>
                                      <DialogTitle>หลักฐานการชำระเงิน (มัดจำ)</DialogTitle>
                                    </DialogHeader>
                                    <img
                                      src={p.proof!}
                                      alt="Deposit Proof (Full Size)"
                                      className="w-full h-auto max-h-[70vh] object-contain"
                                    />
                                  </DialogContent>
                                </Dialog>
                              ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {/* Full payment slips column */}
                      <TableCell className="min-w-[150px] text-center">
                        {booking.payments && booking.payments.some(p => (p.type || '').toUpperCase() === 'FULL' && p.proof) ? (
                          <div className="flex gap-2 justify-center">
                            {booking.payments
                              .filter(p => (p.type || '').toUpperCase() === 'FULL' && !!p.proof)
                              .map((p) => (
                                <Dialog key={p.id}>
                                  <DialogTrigger asChild>
                                    <img
                                      src={p.proof!}
                                      alt="Full Payment Proof"
                                      className="w-16 h-16 object-cover mx-auto rounded cursor-pointer"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[80%] max-h-[80vh] overflow-auto">
                                    <DialogHeader>
                                      <DialogTitle>หลักฐานการชำระเงิน (เต็มจำนวน)</DialogTitle>
                                    </DialogHeader>
                                    <img
                                      src={p.proof!}
                                      alt="Full Payment Proof (Full Size)"
                                      className="w-full h-auto max-h-[70vh] object-contain"
                                    />
                                  </DialogContent>
                                </Dialog>
                              ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        <div className="flex gap-3 justify-center flex-wrap">
                          <Dialog open={editBooking?.id === booking.id} onOpenChange={(open) => !open && setEditBooking(null)}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  const startTime = new Date(booking.startTime);
                                  const endTime = new Date(booking.endTime);
                                  const date = format(startTime, "yyyy-MM-dd");
                                  setEditBooking({
                                    id: booking.id,
                                    userId: booking.userId,
                                    fieldId: booking.fieldId,
                                    date,
                                    startTime: format(startTime, "HH:mm"),
                                    endTime: format(endTime, "HH:mm"),
                                    status: booking.status,
                                  });
                                  fetchOverlappingTimes(booking.fieldId, date, booking.id);
                                }}
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-4 py-2"
                              >
                                <Edit className="h-4 w-4" />
                                แก้ไข
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>แก้ไขการจอง</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">สนาม</label>
                                  <Select
                                    value={editBooking?.fieldId.toString()}
                                    onValueChange={(value) => {
                                      const fieldId = parseInt(value);
                                      setEditBooking({ ...editBooking!, fieldId });
                                      if (editBooking?.date) {
                                        fetchOverlappingTimes(fieldId, editBooking.date, editBooking.id);
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกสนาม" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fields.map((field) => (
                                        <SelectItem key={field.id} value={field.id.toString()}>
                                          {field.name} ({field.location})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                                  <Input
                                    type="date"
                                    value={editBooking?.date || ""}
                                    onChange={(e) => {
                                      const date = e.target.value;
                                      setEditBooking({ ...editBooking!, date });
                                      if (editBooking?.fieldId) {
                                        fetchOverlappingTimes(editBooking.fieldId, date, editBooking.id);
                                      }
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่มต้น</label>
                                  <Select
                                    value={editBooking?.startTime || ""}
                                    onValueChange={(value) => setEditBooking({ ...editBooking!, startTime: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกเวลาเริ่มต้น" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {timeOptions.map((option) => {
                                        const isOverlapping = overlappingTimes.startTimes.includes(option.value);
                                        return (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            disabled={isOverlapping}
                                            className={isOverlapping ? "text-green-600" : ""}
                                          >
                                            {option.label}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
                                  <Select
                                    value={editBooking?.endTime || ""}
                                    onValueChange={(value) => setEditBooking({ ...editBooking!, endTime: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกเวลาสิ้นสุด" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {timeOptions.map((option) => {
                                        const isOverlapping = overlappingTimes.endTimes.includes(option.value);
                                        return (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            disabled={isOverlapping}
                                            className={isOverlapping ? "text-green-600" : ""}
                                          >
                                            {option.label}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                  <Select
                                    value={editBooking?.status}
                                    onValueChange={(value) => setEditBooking({ ...editBooking!, status: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกสถานะ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">รอชำระเงิน</SelectItem>
                                      <SelectItem value="paid">ชำระแล้ว</SelectItem>
                                      <SelectItem value="cancelled">ยกเลิก</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleEditBooking}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  บันทึก
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-4 py-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            ลบ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* การ์ดสำหรับ Mobile */}
            <div className="block sm:hidden space-y-6">
              {paginatedBookings.map((booking) => (
                <Card key={booking.id} className="shadow-xl border-0 bg-gradient-to-br from-white to-slate-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-102">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                        <div>
                          <span className="font-semibold text-slate-700">ผู้จอง:</span>
                          <p className="text-slate-600">{booking.user?.name || "ไม่ระบุ"} ({booking.user?.email || "ไม่ระบุ"})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                        <div>
                          <span className="font-semibold text-slate-700">เบอร์โทร:</span>
                          <p className="text-slate-600">{booking.user?.phone || "ไม่ระบุ"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <div>
                          <span className="font-semibold text-slate-700">สนาม:</span>
                          <p className="text-slate-600">{booking.field?.name || "ไม่ระบุ"} ({booking.field?.location || "ไม่ระบุ"})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-orange-600" />
                        <div>
                          <span className="font-semibold text-slate-700">วันที่:</span>
                          <p className="text-slate-600">{format(new Date(booking.startTime), "dd MMMM yyyy", { locale: th })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        <div>
                          <span className="font-semibold text-slate-700">เวลา:</span>
                          <p className="text-slate-600">{format(new Date(booking.startTime), "HH:mm", { locale: th })} - {format(new Date(booking.endTime), "HH:mm", { locale: th })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <div>
                          <span className="font-semibold text-slate-700">สถานะ:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                      </div>
                    <div>
                      <span className="font-medium text-gray-700">หลักฐานการชำระเงิน:</span>{" "}
                      {booking.payments && booking.payments.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {/* Deposits */}
                          {booking.payments.some(p => (p.type || '').toUpperCase() === 'DEPOSIT' && p.proof) && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">สลิปมัดจำ</div>
                              <div className="flex gap-3 flex-wrap">
                                {booking.payments
                                  .filter(p => (p.type || '').toUpperCase() === 'DEPOSIT' && !!p.proof)
                                  .map((p) => (
                                    <Dialog key={p.id}>
                                      <DialogTrigger asChild>
                                        <img
                                          src={p.proof!}
                                          alt="Deposit Proof"
                                          className="w-24 h-24 object-cover rounded cursor-pointer"
                                        />
                                      </DialogTrigger>
                                      <DialogContent className="max-w-[80%] max-h-[80vh] overflow-auto">
                                        <DialogHeader>
                                          <DialogTitle>หลักฐานการชำระเงิน (มัดจำ)</DialogTitle>
                                        </DialogHeader>
                                        <img
                                          src={p.proof!}
                                          alt="Deposit Proof (Full Size)"
                                          className="w-full h-auto max-h-[70vh] object-contain"
                                        />
                                      </DialogContent>
                                    </Dialog>
                                  ))}
                              </div>
                            </div>
                          )}
                          {/* Full payments */}
                          {booking.payments.some(p => (p.type || '').toUpperCase() === 'FULL' && p.proof) && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">สลิปชำระเต็ม</div>
                              <div className="flex gap-3 flex-wrap">
                                {booking.payments
                                  .filter(p => (p.type || '').toUpperCase() === 'FULL' && !!p.proof)
                                  .map((p) => (
                                    <Dialog key={p.id}>
                                      <DialogTrigger asChild>
                                        <img
                                          src={p.proof!}
                                          alt="Full Payment Proof"
                                          className="w-24 h-24 object-cover rounded cursor-pointer"
                                        />
                                      </DialogTrigger>
                                      <DialogContent className="max-w-[80%] max-h-[80vh] overflow-auto">
                                        <DialogHeader>
                                          <DialogTitle>หลักฐานการชำระเงิน (เต็มจำนวน)</DialogTitle>
                                        </DialogHeader>
                                        <img
                                          src={p.proof!}
                                          alt="Full Payment Proof (Full Size)"
                                          className="w-full h-auto max-h-[70vh] object-contain"
                                        />
                                      </DialogContent>
                                    </Dialog>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <Dialog open={editBooking?.id === booking.id} onOpenChange={(open) => !open && setEditBooking(null)}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                const startTime = new Date(booking.startTime);
                                const endTime = new Date(booking.endTime);
                                const date = format(startTime, "yyyy-MM-dd");
                                setEditBooking({
                                  id: booking.id,
                                  userId: booking.userId,
                                  fieldId: booking.fieldId,
                                  date,
                                  startTime: format(startTime, "HH:mm"),
                                  endTime: format(endTime, "HH:mm"),
                                  status: booking.status,
                                });
                                fetchOverlappingTimes(booking.fieldId, date, booking.id);
                              }}
                              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white flex-1 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 py-3"
                            >
                              <Edit className="h-4 w-4" />
                              แก้ไข
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>แก้ไขการจอง</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">สนาม</label>
                              <Select
                                value={editBooking?.fieldId.toString()}
                                onValueChange={(value) => {
                                  const fieldId = parseInt(value);
                                  setEditBooking({ ...editBooking!, fieldId });
                                  if (editBooking?.date) {
                                    fetchOverlappingTimes(fieldId, editBooking.date, editBooking.id);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกสนาม" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fields.map((field) => (
                                    <SelectItem key={field.id} value={field.id.toString()}>
                                      {field.name} ({field.location})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                              <Input
                                type="date"
                                value={editBooking?.date || ""}
                                onChange={(e) => {
                                  const date = e.target.value;
                                  setEditBooking({ ...editBooking!, date });
                                  if (editBooking?.fieldId) {
                                    fetchOverlappingTimes(editBooking.fieldId, date, editBooking.id);
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่มต้น</label>
                              <Select
                                value={editBooking?.startTime || ""}
                                onValueChange={(value) => setEditBooking({ ...editBooking!, startTime: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกเวลาเริ่มต้น" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((option) => {
                                    const isOverlapping = overlappingTimes.startTimes.includes(option.value);
                                    return (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        disabled={isOverlapping}
                                        className={isOverlapping ? "text-green-600" : ""}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
                              <Select
                                value={editBooking?.endTime || ""}
                                onValueChange={(value) => setEditBooking({ ...editBooking!, endTime: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกเวลาสิ้นสุด" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((option) => {
                                    const isOverlapping = overlappingTimes.endTimes.includes(option.value);
                                    return (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        disabled={isOverlapping}
                                        className={isOverlapping ? "text-green-600" : ""}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                              <Select
                                value={editBooking?.status}
                                onValueChange={(value) => setEditBooking({ ...editBooking!, status: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกสถานะ" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">รอชำระเงิน</SelectItem>
                                  <SelectItem value="paid">ชำระแล้ว</SelectItem>
                                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              onClick={handleEditBooking}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              บันทึก
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                        <Button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex-1 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 py-3"
                        >
                          <Trash2 className="h-4 w-4" />
                          ลบ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => handlePageChange(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
}