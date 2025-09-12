"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInMinutes } from "date-fns";
import { th } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import LoadingCrescent from "@/components/ui/loading-crescent";
import Swal from "sweetalert2";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Field {
  id: number;
  name: string;
  type: string;
}

interface PaymentConfig {
  qrCode: string | null;
  pricePerHour: number;
  pricePerHalfHour: number;
}

interface Booking {
  id: number;
  fieldId: number;
  userId: number;
  startTime: string;
  endTime: string;
  status: string;
  paymentProof?: string;
  totalAmount: number;
}

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedField, setSelectedField] = useState<number | undefined>(undefined);
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 24; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    if (hour === 24) {
      timeSlots.push("00:00น.");
      break;
    }
    timeSlots.push(`${hourStr}:00น.`);
    if (hour < 24) timeSlots.push(`${hourStr}:30น.`);
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fieldsResponse, bookingsResponse, configResponse] = await Promise.all([
        fetch("/api/fields"),
        fetch("/api/bookings"),
        fetch("/api/payment-config"),
      ]);

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData);
      } else {
        throw new Error("ไม่สามารถดึงข้อมูลสนามได้");
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const sortedBookings = bookingsData.sort((a: Booking, b: Booking) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateA.getTime() - dateB.getTime();
        });
        setBookings(sortedBookings);
      } else {
        throw new Error("ไม่สามารถดึงข้อมูลการจองได้");
      }

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setPaymentConfig(configData);
      } else {
        throw new Error("ไม่สามารถดึงข้อมูลการชำระเงินได้");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลได้",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const isTimeSlotBooked = (fieldId: number, time: string) => {
    if (!selectedDate) return false;

    const [hour, minute] = time.replace("น.", "").split(":");
    const checkTime = new Date(selectedDate);
    checkTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

    return bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      return (
        fieldId === booking.fieldId &&
        checkTime >= bookingStart &&
        checkTime < bookingEnd &&
        bookingStart.toDateString() === checkTime.toDateString()
      );
    });
  };

  const calculateAmount = (booking: Booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const durationMinutes = differenceInMinutes(end, start);

    // ตรวจสอบระยะเวลาขั้นต่ำ 1 ชั่วโมง
    if (durationMinutes < 60) {
      return 0;
    }

    let totalAmount = 0;
    const currentTime = new Date(start);

    while (currentTime < end) {
      const currentHour = currentTime.getHours();
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentHour + 1, 0, 0, 0);

      // คำนวณระยะเวลาในชั่วโมงนี้
      const segmentEnd = nextHour > end ? end : nextHour;
      const segmentMinutes = differenceInMinutes(segmentEnd, currentTime);

      // กำหนดราคาตามช่วงเวลา
      let hourlyRate: number;
      let halfHourRate: number;

      if (currentHour >= 13 && currentHour < 17) {
        // ช่วงกลางวัน 13:00-17:00
        hourlyRate = 400;
        halfHourRate = 200;
      } else {
        // ช่วงเย็น 17:00 เป็นต้นไป และก่อน 13:00
        hourlyRate = 600;
        halfHourRate = 300;
      }

      // คำนวณราคาสำหรับช่วงเวลานี้
      if (segmentMinutes >= 60) {
        totalAmount += hourlyRate;
      } else if (segmentMinutes >= 30) {
        totalAmount += halfHourRate;
      } else if (segmentMinutes > 0) {
        // ถ้าเหลือน้อยกว่า 30 นาที ให้คิดเป็น 30 นาที
        totalAmount += halfHourRate;
      }

      // เลื่อนไปชั่วโมงถัดไป
      currentTime.setTime(nextHour.getTime());
    }

    return totalAmount;
  };

  const handleBooking = async () => {
    if (!session || !selectedDate || !selectedField || !startTime || !endTime) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        text: "เลือกวันที่, สนาม, เวลาเริ่ม, และเวลาสิ้นสุด",
      });
      return;
    }

    if (!paymentConfig) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลการชำระเงินได้ กรุณาติดต่อผู้ดูแลระบบ",
      });
      return;
    }

    const [startHour, startMinute] = startTime.replace("น.", "").split(":");
    const [endHour, endMinute] = endTime.replace("น.", "").split(":");
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    if (endDateTime <= startDateTime) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม",
      });
      return;
    }

    const durationMinutes = differenceInMinutes(endDateTime, startDateTime);
    if (durationMinutes < 60) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ต้องจองขั้นต่ำ 1 ชั่วโมง",
      });
      return;
    }

    const isOverlapping = bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      return (
        selectedField === booking.fieldId &&
        startDateTime < bookingEnd &&
        endDateTime > bookingStart &&
        startDateTime.toDateString() === bookingStart.toDateString() &&
        !(startDateTime.getTime() === bookingEnd.getTime() || endDateTime.getTime() === bookingStart.getTime())
      );
    });

    if (isOverlapping) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถจองได้",
        text: "ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกช่วงเวลาอื่น",
      });
      return;
    }

    // Calculate total amount using new time-based pricing
    let totalAmount = 0;
    const currentTime = new Date(startDateTime);

    while (currentTime < endDateTime) {
      const currentHour = currentTime.getHours();
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentHour + 1, 0, 0, 0);

      // คำนวณระยะเวลาในชั่วโมงนี้
      const segmentEnd = nextHour > endDateTime ? endDateTime : nextHour;
      const segmentMinutes = differenceInMinutes(segmentEnd, currentTime);

      // กำหนดราคาตามช่วงเวลา
      let hourlyRate: number;
      let halfHourRate: number;

      if (currentHour >= 13 && currentHour < 17) {
        // ช่วงกลางวัน 13:00-17:00
        hourlyRate = 400;
        halfHourRate = 200;
      } else {
        // ช่วงเย็น 17:00 เป็นต้นไป และก่อน 13:00
        hourlyRate = 600;
        halfHourRate = 300;
      }

      // คำนวณราคาสำหรับช่วงเวลานี้
      if (segmentMinutes >= 60) {
        totalAmount += hourlyRate;
      } else if (segmentMinutes >= 30) {
        totalAmount += halfHourRate;
      } else if (segmentMinutes > 0) {
        // ถ้าเหลือน้อยกว่า 30 นาที ให้คิดเป็น 30 นาที
        totalAmount += halfHourRate;
      }

      // เลื่อนไปชั่วโมงถัดไป
      currentTime.setTime(nextHour.getTime());
    }

    const fieldName = fields.find((f) => f.id === selectedField)?.name || "ไม่ระบุ";
    const bookingDetailsText = `
      สนาม: ${fieldName}<br>
      วันที่: ${format(selectedDate, "dd MMMM yyyy", { locale: th })}<br>
      เวลา: ${startTime} - ${endTime}<br>
      <strong>ราคารวม: ${totalAmount.toLocaleString()} บาท</strong>
    `;

    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันการจอง",
      html: `คุณต้องการจองสนามตามรายละเอียดนี้หรือไม่?<br>${bookingDetailsText}`,
      showCancelButton: true,
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    const bookingDetails = {
      userId: parseInt(session.user.id as string),
      fieldId: selectedField,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      totalAmount,
    };

        const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingDetails),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "จองสำเร็จ!",
        text: "กรุณาดำเนินการชำระเงินเพื่อยืนยันการจอง",
        timer: 1500,
        showConfirmButton: false,
      });
      const newBooking = await response.json();
      const updatedBookings = [...bookings, newBooking].sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setBookings(updatedBookings);
      setStartTime(undefined);
      setEndTime(undefined);
      setCurrentPage(1);
      await fetchData();
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถจองได้",
      });
    }
  };

  const handlePayment = async (method: string) => {
    if (isPaying) return;
    setIsPaying(true);
    if (!selectedBooking) return;

    if (!paymentConfig) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลการชำระเงินได้ กรุณาติดต่อผู้ดูแลระบบ",
      });
      return;
    }

    const formData = new FormData();
    formData.append("bookingId", selectedBooking.id.toString());
    formData.append("method", method);
    if (method === "qrcode" && proofFile) {
      formData.append("proof", proofFile);
    }

    const response = await fetch("/api/payments", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "ชำระเงินสำเร็จ!",
        text: "การชำระเงินของคุณได้รับการบันทึกแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedBookings = bookings.map((booking) =>
        booking.id === selectedBooking.id
          ? {
              ...booking,
              status: method === "qrcode" ? "paid" : "pending_confirmation",
            }
          : booking
      ).sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setBookings(updatedBookings);
      setSelectedBooking(null);
      setProofFile(null);
      await fetchData();
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถชำระเงินได้",
      });
    }
    setIsPaying(false);
  };

  const handleCancel = async (bookingId: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการยกเลิกการจองนี้จริงๆ ใช่ไหม?",
      showCancelButton: true,
      confirmButtonText: "ใช่, ยกเลิก",
      cancelButtonText: "ไม่, กลับ",
    });

    if (!result.isConfirmed) return;

    const response = await fetch("/api/bookings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bookingId }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "ยกเลิกสำเร็จ!",
        text: "การจองถูกลบเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedBookings = bookings.filter((booking) => booking.id !== bookingId).sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
      setBookings(updatedBookings);
      if (paginatedBookings.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      await fetchData();
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถยกเลิกได้",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
      case "pending_confirmation":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const userBookings = bookings.filter(
    (booking) => booking.userId === parseInt(session?.user?.id || "0")
  );

  const totalPages = Math.ceil(userBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = userBookings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (status === "loading" || loading) {
    return <LoadingCrescent text="กำลังโหลดข้อมูล..." />;
  }

  if (!session) return null;

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">จองสนามฟุตบอล</h1>
        <Button
          onClick={fetchData}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          รีเฟรชข้อมูล
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4">เลือกวันที่</h2>
          <div className="flex justify-center items-center w-full">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={th}
              className="rounded-md border"
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col gap-6">
           {/* Color Legend */}
           <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium mb-2">หมายเหตุ:</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-green-600 font-medium">จองแล้ว (ไม่สามารถเลือกได้)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-black rounded"></div>
                  <span className="text-black font-medium">สนามว่าง (สามารถจองได้)</span>
                </div>
              </div>
            </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">เลือกสนาม</h2>
            <Select
              onValueChange={(value) => setSelectedField(parseInt(value))}
              value={selectedField?.toString()}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกสนาม" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id.toString()}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">เวลาเริ่ม</h2>
            <Select onValueChange={setStartTime} value={startTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกเวลาเริ่ม" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem
                    key={time}
                    value={time}
                    className={
                      selectedField && isTimeSlotBooked(selectedField, time)
                        ? "text-green-600"
                        : ""
                    }
                    disabled={selectedField ? isTimeSlotBooked(selectedField, time) : false}
                  >
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">เวลาสิ้นสุด</h2>
            <Select onValueChange={setEndTime} value={endTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกเวลาสิ้นสุด" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots
                  .filter((time) => !startTime || time > startTime)
                  .map((time) => (
                    <SelectItem
                      key={time}
                      value={time}
                      className={
                        selectedField && isTimeSlotBooked(selectedField, time)
                          ? "text-green-600"
                          : ""
                      }
                      disabled={selectedField ? isTimeSlotBooked(selectedField, time) : false}
                    >
                      {time}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleBooking}
            className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white"
          >
            ยืนยันการจอง
          </Button>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">รายการจองของคุณ</h2>
        {userBookings.length === 0 ? (
          <p className="text-gray-600">ยังไม่มีรายการจอง</p>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto bg-white p-4 rounded-lg shadow-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สนาม</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เวลา</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {fields.find((f) => f.id === booking.fieldId)?.name || "ไม่ระบุ"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.startTime), "dd MMMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.startTime), "HH:mm", { locale: th })}น. -{" "}
                        {format(new Date(booking.endTime), "HH:mm", { locale: th })}น.
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                          {booking.status === "pending"
                            ? "รอชำระเงิน"
                            : booking.status === "pending_confirmation"
                            ? "รอดำเนินการ"
                            : "ชำระแล้ว"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === "pending" && (
                            <Dialog
                              open={selectedBooking?.id === booking.id}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setSelectedBooking(null);
                                  setProofFile(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setProofFile(null); // รีเซ็ตไฟล์เมื่อเปิด Dialog ใหม่
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  ชำระเงิน
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>ชำระเงินสำหรับการจอง</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-gray-800">
                                    ราคา: {calculateAmount(booking)} บาท
                                  </p>
                                  <div>
                                    <h3 className="text-lg font-semibold">ชำระด้วย QR Code</h3>
                                    {paymentConfig?.qrCode ? (
                                      <img
                                        src={paymentConfig.qrCode.startsWith('http') ? paymentConfig.qrCode : `/uploads/${paymentConfig.qrCode}`}
                                        alt="QR Code"
                                        className="w-full max-w-xs h-auto mx-auto mt-2 object-contain"
                                      />
                                    ) : (
                                      <p className="text-red-600 text-center mt-2">
                                        ไม่มี QR Code สำหรับชำระเงิน
                                      </p>
                                    )}
                                    <p className="text-sm text-gray-600 mt-2">
                                      {paymentConfig?.qrCode
                                        ? `สแกน QR Code เพื่อชำระเงิน ${calculateAmount(booking)} บาท แล้วอัปโหลดหลักฐานการโอน`
                                        : "กรุณาเลือกวิธีชำระเงินแบบอื่น หรือติดต่อผู้ดูแลระบบ"}
                                    </p>
                                    {paymentConfig?.qrCode && (
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                          setProofFile(e.target.files?.[0] || null)
                                        }
                                        className="mt-2"
                                      />
                                    )}
                                    <Button
                                      onClick={() => handlePayment("qrcode")}
                                      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!paymentConfig?.qrCode || !proofFile || isPaying}
                                    >
                                      ยืนยันการชำระด้วย QR Code
                                    </Button>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold">ชำระด้วยเงินสด</h3>
                                    <p className="text-sm text-gray-600 mt-2">
                                      กรุณาชำระเงินสด {calculateAmount(booking)} บาท
                                      ที่เคาน์เตอร์สนาม
                                    </p>
                                    <Button
                                      onClick={() => handlePayment("cash")}
                                      disabled={isPaying}
                                      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      ยืนยันการชำระด้วยเงินสด
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {(booking.status === "pending" || booking.status === "pending_confirmation") && (
                            <Button
                              onClick={() => handleCancel(booking.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              ยกเลิก
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="block sm:hidden space-y-4">
              {paginatedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
                >
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">สนาม:</span>{" "}
                      {fields.find((f) => f.id === booking.fieldId)?.name || "ไม่ระบุ"}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">วันที่:</span>{" "}
                      {format(new Date(booking.startTime), "dd MMMM yyyy", { locale: th })}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">เวลา:</span>{" "}
                      {format(new Date(booking.startTime), "HH:mm", { locale: th })}น. -{" "}
                      {format(new Date(booking.endTime), "HH:mm", { locale: th })}น.
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">สถานะ:</span>{" "}
                      <span className={`px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                        {booking.status === "pending"
                          ? "รอชำระเงิน"
                          : booking.status === "pending_confirmation"
                          ? "รอดำเนินการ"
                          : "ชำระแล้ว"}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {booking.status === "pending" && (
                        <Dialog
                          open={selectedBooking?.id === booking.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedBooking(null);
                              setProofFile(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setProofFile(null); // รีเซ็ตไฟล์เมื่อเปิด Dialog ใหม่
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              ชำระเงิน
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>ชำระเงินสำหรับการจอง</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-gray-800">
                                ราคา: {calculateAmount(booking)} บาท
                              </p>
                              <div>
                                <h3 className="text-lg font-semibold">ชำระด้วย QR Code</h3>
                                {paymentConfig?.qrCode ? (
                                  <img
                                    src={paymentConfig.qrCode.startsWith('http') ? paymentConfig.qrCode : `/uploads/${paymentConfig.qrCode}`}
                                    alt="QR Code"
                                    className="w-full max-w-xs h-auto mx-auto mt-2 object-contain"
                                  />
                                ) : (
                                  <p className="text-red-600 text-center mt-2">
                                    ไม่มี QR Code สำหรับชำระเงิน
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 mt-2">
                                  {paymentConfig?.qrCode
                                    ? `สแกน QR Code เพื่อชำระเงิน ${calculateAmount(booking)} บาท แล้วอัปโหลดหลักฐานการโอน`
                                    : "กรุณาเลือกวิธีชำระเงินแบบอื่น หรือติดต่อผู้ดูแลระบบ"}
                                </p>
                                {paymentConfig?.qrCode && (
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      setProofFile(e.target.files?.[0] || null)
                                    }
                                    className="mt-2"
                                  />
                                )}
                                <Button
                                  onClick={() => handlePayment("qrcode")}
                                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white"
                                  disabled={!paymentConfig?.qrCode || !proofFile}
                                >
                                  ยืนยันการชำระด้วย QR Code
                                </Button>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">ชำระด้วยเงินสด</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                  กรุณาชำระเงินสด {calculateAmount(booking)} บาท
                                  ที่เคาน์เตอร์สนาม
                                </p>
                                <Button
                                  onClick={() => handlePayment("cash")}
                                  disabled={isPaying}
                                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ยืนยันการชำระด้วยเงินสด
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {(booking.status === "pending" || booking.status === "pending_confirmation") && (
                        <Button
                          onClick={() => handleCancel(booking.id)}
                          className="bg-red-600 hover:bg-red-700 text-white flex-1"
                        >
                          ยกเลิก
                        </Button>
                      )}
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
                      className={
                        currentPage === 1 ? "pointer-events-none opacity-50" : ""
                      }
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
                      className={
                        currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                      }
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