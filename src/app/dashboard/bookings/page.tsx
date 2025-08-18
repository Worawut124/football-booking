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

// กำหนด Type สำหรับโครงสร้างข้อมูล
interface User {
  id: number;
  name: string;
  email: string;
}

interface Field {
  id: number;
  name: string;
  location: string;
}

interface Payment {
  id: number;
  proof: string | null;
}

interface Booking {
  id: number;
  userId: number;
  fieldId: number;
  startTime: string;
  endTime: string;
  status: string;
  user: User;
  field: Field;
  payment?: Payment;
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
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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
    if (searchDate) {
      const filtered = bookings.filter((booking) => {
        const bookingDate = format(new Date(booking.startTime), "yyyy-MM-dd");
        return bookingDate === searchDate;
      });
      const sortedFiltered = filtered.sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setFilteredBookings(sortedFiltered);
      setCurrentPage(1);
    } else {
      const sortedBookings = [...bookings].sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setFilteredBookings(sortedBookings);
    }
  }, [searchDate, bookings]);

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
    <div className="container mx-auto p-4 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">จัดการการจอง</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                เพิ่มการจอง
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-100 p-3 rounded-lg shadow-sm w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">ค้นหาด้วยวันที่:</label>
            <Input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full sm:w-48 border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
            />
            <Button
              onClick={() => setSearchDate("")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors w-full sm:w-auto"
            >
              ล้างวันที่
            </Button>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <p className="text-gray-600 text-center">ยังไม่มีรายการจองสำหรับวันที่เลือก</p>
        ) : (
          <>
            {/* ตารางสำหรับ Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] text-center">ผู้จอง</TableHead>
                    <TableHead className="min-w-[150px] text-center">สนาม</TableHead>
                    <TableHead className="min-w-[150px] text-center">วันที่</TableHead>
                    <TableHead className="min-w-[150px] text-center">เวลา</TableHead>
                    <TableHead className="min-w-[150px] text-center">สถานะ</TableHead>
                    <TableHead className="min-w-[150px] text-center">หลักฐานการชำระเงิน</TableHead>
                    <TableHead className="min-w-[150px] text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="min-w-[150px] text-center">
                        {booking.user?.name || "ไม่ระบุ"} ({booking.user?.email || "ไม่ระบุ"})
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
                          {booking.status === "paid" ? "ชำระแล้ว" : booking.status === "pending" ? "รอชำระเงิน" : "ยกเลิก"}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        {booking.payment?.proof ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <img
                                src={booking.payment.proof}
                                alt="Payment Proof"
                                className="w-16 h-16 object-cover mx-auto cursor-pointer"
                              />
                            </DialogTrigger>
                            <DialogContent className="max-w-[80%] max-h-[80vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>หลักฐานการชำระเงิน</DialogTitle>
                              </DialogHeader>
                              <img
                                src={booking.payment.proof}
                                alt="Payment Proof (Full Size)"
                                className="w-full h-auto max-h-[70vh] object-contain"
                              />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="min-w-[150px] text-center">
                        <div className="flex gap-2 justify-center">
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
                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              >
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
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
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
            <div className="block sm:hidden space-y-4">
              {paginatedBookings.map((booking) => (
                <div key={booking.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">ผู้จอง:</span>{" "}
                      {booking.user?.name || "ไม่ระบุ"} ({booking.user?.email || "ไม่ระบุ"})
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">สนาม:</span>{" "}
                      {booking.field?.name || "ไม่ระบุ"} ({booking.field?.location || "ไม่ระบุ"})
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">วันที่:</span>{" "}
                      {format(new Date(booking.startTime), "dd MMMM yyyy", { locale: th })}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">เวลา:</span>{" "}
                      {format(new Date(booking.startTime), "HH:mm", { locale: th })} -{" "}
                      {format(new Date(booking.endTime), "HH:mm", { locale: th })}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">สถานะ:</span>{" "}
                      <span className={`px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                        {booking.status === "paid" ? "ชำระแล้ว" : booking.status === "pending" ? "รอชำระเงิน" : "ยกเลิก"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">หลักฐานการชำระเงิน:</span>{" "}
                      {booking.payment?.proof ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <img
                              src={booking.payment.proof}
                              alt="Payment Proof"
                              className="w-32 h-32 object-cover mt-2 cursor-pointer"
                            />
                          </DialogTrigger>
                          <DialogContent className="max-w-[80%] max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>หลักฐานการชำระเงิน</DialogTitle>
                            </DialogHeader>
                            <img
                              src={booking.payment.proof}
                              alt="Payment Proof (Full Size)"
                              className="w-full h-auto max-h-[70vh] object-contain"
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
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
                            className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
                          >
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
                        className="bg-red-600 hover:bg-red-700 text-white flex-1"
                      >
                        ลบ
                      </Button>
                    </div>
                  </div>
                </div>
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
      </div>
    </div>
  );
}