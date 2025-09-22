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
import CountdownTimer from "@/components/ui/countdown-timer";
import Swal from "sweetalert2";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Users, 
  CreditCard, 
  RefreshCw,
  Sparkles,
  Trophy,
  Star,
  CheckCircle,
  AlertCircle,
  Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  expiresAt?: string | null;
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
  const [isBooking, setIsBooking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fullPaymentBooking, setFullPaymentBooking] = useState<Booking | null>(null);
  const [promptPayQR, setPromptPayQR] = useState<{
    bookingId: number;
    qrCode: string;
    amount: number;
    expiresAt: string;
    promptPayId: string;
  } | null>(null);

  const itemsPerPage = 5;

  // Calculate deposit sum for a booking
  const calcDepositSum = (booking: Booking) => {
    const deposits = (booking as any).payments ? (booking as any).payments.filter((p: any) => (p.type || '').toUpperCase() === 'DEPOSIT') : [];
    return deposits.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  };

  // Calculate total amount for a booking based on time-of-day pricing
  const calculateAmount = (booking: Booking): number => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const durationMinutes = differenceInMinutes(end, start);
    if (durationMinutes < 60) {
      return 0;
    }

    let totalAmount = 0;
    const currentTime = new Date(start);

    while (currentTime < end) {
      const currentHour = currentTime.getHours();
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentHour + 1, 0, 0, 0);

      const segmentEnd = nextHour > end ? end : nextHour;
      const segmentMinutes = differenceInMinutes(segmentEnd, currentTime);

      let hourlyRate: number;
      let halfHourRate: number;
      if (currentHour >= 13 && currentHour < 17) {
        hourlyRate = 400;
        halfHourRate = 200;
      } else {
        hourlyRate = 600;
        halfHourRate = 300;
      }

      if (segmentMinutes >= 60) {
        totalAmount += hourlyRate;
      } else if (segmentMinutes >= 30) {
        totalAmount += halfHourRate;
      } else if (segmentMinutes > 0) {
        totalAmount += halfHourRate;
      }

      currentTime.setTime(nextHour.getTime());
    }

    return totalAmount;
  };

  // Generate all available time slots (13:00-23:00)
  const allTimeSlots: string[] = [];
  for (let hour = 13; hour <= 23; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    allTimeSlots.push(`${hourStr}:00น.`);
    allTimeSlots.push(`${hourStr}:30น.`);
  }

  // Filter time slots based on current time and selected date
  const getFilteredTimeSlots = () => {
    if (!selectedDate) return allTimeSlots;
    
    const now = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayOnly = new Date(now);
    todayOnly.setHours(0, 0, 0, 0);
    
    // If selected date is not today, show all time slots
    if (selectedDateOnly.getTime() !== todayOnly.getTime()) {
      return allTimeSlots;
    }
    
    // If selected date is today, filter out past time slots
    return allTimeSlots.filter(timeSlot => {
      const [hour, minute] = timeSlot.replace("น.", "").split(":");
      const slotTime = new Date(selectedDate);
      slotTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // Add 30 minutes buffer to current time to prevent booking slots that are about to pass
      const currentTimeWithBuffer = new Date(now.getTime() + 30 * 60 * 1000);
      
      return slotTime > currentTimeWithBuffer;
    });
  };

  // Determine if a time slot is already booked (ignore cancelled and expired-pending)
  const isTimeSlotBooked = (fieldId: number, time: string) => {
    if (!selectedDate) return false;

    const [hour, minute] = time.replace("น.", "").split(":");
    const checkTime = new Date(selectedDate);
    checkTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

    const now = new Date();

    return bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      // Ignore cancelled bookings (free slot)
      if (booking.status === "cancelled") return false;

      // Ignore expired pending (free slot immediately)
      if (
        booking.status === "pending" &&
        booking.expiresAt &&
        new Date(booking.expiresAt) < now
      ) {
        return false;
      }

      return (
        fieldId === booking.fieldId &&
        checkTime >= bookingStart &&
        checkTime < bookingEnd &&
        bookingStart.toDateString() === checkTime.toDateString()
      );
    });
  };

  // Handle full payment (second payment) slip upload and mark as paid
  const handleFullPayment = async (bookingId: number) => {
    if (!proofFile) {
      Swal.fire({ icon: "warning", title: "กรุณาอัปโหลดสลิป", text: "โปรดแนบหลักฐานการชำระเงินเต็มจำนวน" });
      return;
    }
    setIsPaying(true);
    try {
      const formData = new FormData();
      formData.append("bookingId", String(bookingId));
      formData.append("method", "qrcode_full");
      formData.append("proof", proofFile);

      const response = await fetch("/api/payments/full", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "ชำระเต็มจำนวนสำเร็จ!",
          text: "การชำระเงินของคุณได้รับการบันทึกแล้ว",
          timer: 1500,
          showConfirmButton: false,
        });
        const updated = bookings.map((b) =>
          b.id === bookingId ? { ...b, status: "paid" } : b
        ).sort((a: Booking, b: Booking) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateA.getTime() - dateB.getTime();
        });
        setBookings(updated);
        setFullPaymentBooking(null);
        setProofFile(null);
        await fetchData();
      } else {
        const errorData = await response.json();
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: errorData.error || "ไม่สามารถชำระเต็มจำนวนได้" });
      }
    } catch (e) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถชำระเต็มจำนวนได้" });
    } finally {
      setIsPaying(false);
    }
  };

  const timeSlots = getFilteredTimeSlots();

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

  // Removed client-side auto-cancel interval; server GET auto-cancels expired pending.

  // Update current time every minute for real-time filtering
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Reset start and end time when filtered time slots change
  useEffect(() => {
    const filteredSlots = getFilteredTimeSlots();
    
    // If current start time is no longer available, reset it
    if (startTime && !filteredSlots.includes(startTime)) {
      setStartTime(undefined);
    }
    
    // If current end time is no longer available, reset it
    if (endTime && !filteredSlots.includes(endTime)) {
      setEndTime(undefined);
    }
  }, [selectedDate, fields, bookings, startTime, endTime]);

  const handleBooking = async () => {
    if (isBooking) return;
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
        text: "ต้องจองขั้นต่ำ 1 ชั่วโมงขึ้นไป",
      });
      return;
    }

    const now = new Date();
    const isOverlapping = bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      // Ignore cancelled
      if (booking.status === "cancelled") return false;
      // Ignore expired pending
      if (booking.status === "pending" && booking.expiresAt && new Date(booking.expiresAt) < now) return false;
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

    try {
      setIsBooking(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingDetails),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "จองสำเร็จ!",
          text: "กรุณาชำระมัดจำเพื่อยืนยันการจอง",
          timer: 1500,
          showConfirmButton: false,
        });
        const newBooking = await response.json();
        // Start QR timer immediately by generating PromptPay QR (and set expiresAt on server)
        try {
          await generatePromptPayQR(newBooking.id);
        } catch {}
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
    } catch (e) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถจองได้" });
    } finally {
      setIsBooking(false);
    }
  };

  const generatePromptPayQR = async (bookingId: number) => {
    try {
      const response = await fetch("/api/promptpay-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (response.ok) {
        const data = await response.json();
        const payload = { ...data, bookingId };
        setPromptPayQR(payload);
        try {
          sessionStorage.setItem(`ppqr_${bookingId}`, JSON.stringify(payload));
        } catch {}
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถสร้าง QR Code ได้",
        });
      }
    } catch (error) {
      console.error("Error generating PromptPay QR:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสร้าง QR Code ได้",
      });
    }
  };

  const handlePayment = async (method: string) => {
    if (isPaying) return;
    setIsPaying(true);
    if (!selectedBooking) return;

    const formData = new FormData();
    formData.append("bookingId", selectedBooking.id.toString());
    formData.append("method", method);
    // Attach proof if user selected a slip, regardless of method label
    if (proofFile) {
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
              status: "pending_confirmation",
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
      setPromptPayQR(null);
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

  const handleCancel = async (bookingId: number, skipConfirm: boolean = false) => {
    const result = skipConfirm ? { isConfirmed: true } : await Swal.fire({
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
        text: "การจองถูกยกเลิกเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
      // Soft cancel locally: keep booking but mark as cancelled
      const updatedBookings = bookings
        .map((booking) => booking.id === bookingId ? { ...booking, status: "cancelled" } : booking)
        .sort((a: Booking, b: Booking) => {
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
      case "deposit_paid":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
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

  // Remaining minutes until booking expiration
  const getRemainingMinutes = (booking: Booking): number | null => {
    if (!booking.expiresAt) return null;
    const expires = new Date(booking.expiresAt).getTime();
    const now = currentTime.getTime();
    const diffMs = expires - now;
    return Math.ceil(diffMs / 60000);
  };

  if (status === "loading" || loading) {
    return <LoadingCrescent text="กำลังโหลดข้อมูล..." />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 shadow-2xl">
                <Trophy className="h-16 w-16 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-bounce" />
              <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                จองสนามฟุตบอล
              </h1>
              <Sparkles className="h-8 w-8 text-yellow-300 animate-bounce" />
            </div>
            <p className="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto mb-8 leading-relaxed">
              🏆 เลือกวันที่ เวลา และสนามที่ต้องการ เพื่อเริ่มต้นการแข่งขันของคุณ ⚽
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-sm font-medium">จองง่าย รวดเร็ว</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Star className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-medium">สนามคุณภาพสูง</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Timer className="h-5 w-5 text-blue-300" />
                <span className="text-sm font-medium">เปิด 13:00-23:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">ระบบจองสนาม</h2>
              <p className="text-gray-600">เลือกวันที่และเวลาที่ต้องการ</p>
            </div>
          </div>
          <Button
            onClick={fetchData}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรชข้อมูล
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Calendar Card */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                <div className="bg-blue-100 rounded-full p-2">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
                เลือกวันที่
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">เลือกวันที่ที่ต้องการจองสนาม (สามารถจองล่วงหน้าได้ 14 วัน)</p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={th}
                className="rounded-lg border-0 w-full"
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const maxDate = new Date(today);
                  maxDate.setDate(today.getDate() + 14);
                  
                  return date < today || date > maxDate;
                }}
              />
            </CardContent>
          </Card>

          {/* Booking Form Card */}
          <Card className="lg:col-span-2 shadow-xl border-0 bg-gradient-to-br from-white to-green-50 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                <div className="bg-green-100 rounded-full p-2">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                เลือกสนามและเวลา
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">กรอกข้อมูลการจองให้ครบถ้วนเพื่อยืนยันการจอง</p>
            </CardHeader>
            <CardContent className="space-y-6">
           {/* Color Legend */}
           <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium mb-2">หมายเหตุ:</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-green-700 font-medium">สนามว่าง (สามารถจองได้)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-red-700 font-medium">จองแล้ว (ไม่สามารถเลือกได้)</span>
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
                    className={(() => {
                      if (!selectedField) return "";
                      const booked = isTimeSlotBooked(selectedField, time);
                      return booked
                        ? "bg-red-100 text-red-700"
                        : "bg-green-50 text-green-700";
                    })()}
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
                      className={(() => {
                        if (!selectedField) return "";
                        const booked = isTimeSlotBooked(selectedField, time);
                        return booked
                          ? "bg-red-100 text-red-700"
                          : "bg-green-50 text-green-700";
                      })()}
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
            disabled={isBooking}
            className={`mt-4 w-full text-white ${isBooking ? "bg-gray-400 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-900"}`}
          >
            {isBooking ? (
              <span className="flex items-center justify-center gap-2 w-full">
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังยืนยัน...
              </span>
            ) : (
              "ยืนยันการจอง"
            )}
          </Button>
            </CardContent>
          </Card>
        </div>
        {/* Bookings Section */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-full mb-4">
              <CreditCard className="h-6 w-6 text-purple-600" />
              <span className="text-purple-800 font-semibold text-lg">รายการจองของคุณ</span>
              <CreditCard className="h-6 w-6 text-pink-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              จัดการการจองและชำระเงิน
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full"></div>
          </div>

          {userBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <CalendarDays className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีรายการจอง</h3>
              <p className="text-gray-500">เริ่มต้นจองสนามของคุณเลย!</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <Card className="shadow-xl border-0 bg-white">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <TableRow className="border-b-2 border-gray-200">
                          <TableHead className="min-w-[120px] text-center font-bold text-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              สนาม
                            </div>
                          </TableHead>
                          <TableHead className="min-w-[150px] text-center font-bold text-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <CalendarDays className="h-4 w-4 text-blue-600" />
                              วันที่
                            </div>
                          </TableHead>
                          <TableHead className="min-w-[150px] text-center font-bold text-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <Clock className="h-4 w-4 text-purple-600" />
                              เวลา
                            </div>
                          </TableHead>
                          <TableHead className="min-w-[120px] text-center font-bold text-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <Users className="h-4 w-4 text-orange-600" />
                              สถานะ
                            </div>
                          </TableHead>
                          <TableHead className="min-w-[220px] text-center font-bold text-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <CreditCard className="h-4 w-4 text-pink-600" />
                              การจัดการ
                            </div>
                          </TableHead>
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
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                            {booking.status === "pending"
                              ? "รอชำระเงิน"
                              : booking.status === "pending_confirmation"
                              ? "รอดำเนินการ"
                              : booking.status === "cancelled"
                              ? "ยกเลิก"
                              : "ชำระแล้ว"}
                          </span>
                          {booking.status === "pending" && booking.expiresAt && (
                            (() => {
                              const mins = getRemainingMinutes(booking);
                              if (mins === null) return null;
                              return (
                                <span className={`text-xs px-2 py-0.5 rounded border ${mins > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                  {mins > 0 ? `เหลือ ${mins} นาที` : "หมดเวลา"}
                                </span>
                              );
                            })()
                          )}
                        </div>
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
                                    setProofFile(null);
                                    // Reuse existing QR if same booking and not expired
                                    const now = new Date();
                                    const cacheRaw = sessionStorage.getItem(`ppqr_${booking.id}`);
                                    const cached = cacheRaw ? JSON.parse(cacheRaw) : null;
                                    if (cached && cached.expiresAt && now <= new Date(cached.expiresAt)) {
                                      setPromptPayQR(cached);
                                    } else if (!promptPayQR || promptPayQR.bookingId !== booking.id || (promptPayQR.expiresAt && now > new Date(promptPayQR.expiresAt))) {
                                      generatePromptPayQR(booking.id);
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  ชำระมัดจำ
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>ชำระมัดจำการจอง</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="text-center">
                                    <p className="text-lg font-semibold text-blue-600">
                                      ค่าราคาเต็ม: {calculateAmount(booking)} บาท
                                    </p>
                                    <p className="text-2xl font-bold text-green-600">
                                      ค่าจองมัดจำ: {(promptPayQR?.amount || 100).toLocaleString()} บาท
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                      ชำระมัดจำ {(promptPayQR?.amount || 100).toLocaleString()} บาท เพื่อยืนยันการจอง<br/>
                                      ส่วนที่เหลือชำระที่สนาม
                                    </p>
                                  </div>

                                  {promptPayQR && (
                                    <CountdownTimer
                                      expiresAt={promptPayQR.expiresAt}
                                      onExpired={async () => {
                                        setPromptPayQR(null);
                                        await handleCancel(booking.id, true);
                                        Swal.fire({
                                          icon: "warning",
                                          title: "หมดเวลาชำระมัดจำ",
                                          text: "การจองถูกยกเลิกอัตโนมัติแล้ว",
                                        });
                                      }}
                                    />
                                  )}

                                  <div>
                                    <h3 className="text-lg font-semibold text-center mb-3">ชำระด้วย PromptPay</h3>
                                    {promptPayQR ? (
                                      <div className="text-center">
                                        <img
                                          src={promptPayQR.qrCode}
                                          alt="PromptPay QR Code"
                                          className="w-64 h-64 mx-auto border rounded-lg"
                                        />
                                        <p className="text-sm text-gray-600 mt-2">
                                          สแกน QR Code เพื่อชำระมัดจำ {(promptPayQR?.amount || 100).toLocaleString()} บาท<br/>
                                          PromptPay: {promptPayQR.promptPayId}
                                        </p>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                            setProofFile(e.target.files?.[0] || null)
                                          }
                                          className="mt-3"
                                          placeholder="อัปโหลดหลักฐานการโอน"
                                        />
                                        <Button
                                          onClick={() => handlePayment("qrcode")}
                                          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                          disabled={!proofFile || isPaying}
                                        >
                                          {isPaying ? "กำลังดำเนินการ..." : "ยืนยันการชำระมัดจำ"}
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-gray-600 mt-2">กำลังสร้าง QR Code...</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="border-t pt-4">
                                    <div className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2 justify-center">
                                      <span className="text-amber-600" aria-hidden>⚠️</span>
                                      <span>
                                        หมายเหตุ: หากไม่ชำระมัดจำภายในเวลาที่กำหนด ระบบจะยกเลิกการจองอัตโนมัติทันที
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {booking.status === "pending" && (
                            <Button
                              onClick={() => handleCancel(booking.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              ยกเลิก
                            </Button>
                          )}
                          {booking.status === "pending_confirmation" && (
                            <>
                              <Dialog
                                open={fullPaymentBooking?.id === booking.id}
                                onOpenChange={(open) => {
                                  if (!open) setFullPaymentBooking(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => setFullPaymentBooking(booking)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    ชำระส่วนที่เหลือ
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>ชำระค่าสนามส่วนที่เหลือ</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    <p className="text-center text-gray-800">
                                      ยอดรวม: <span className="font-semibold">{booking.totalAmount} บาท</span>
                                    </p>
                                    <p className="text-center text-gray-800">
                                      ชำระมัดจำแล้ว: <span className="font-semibold">{calcDepositSum(booking)} บาท</span>
                                    </p>
                                    <p className="text-center text-gray-900 text-lg">
                                      คงเหลือที่ต้องชำระ: <span className="font-bold text-blue-700">{Math.max(0, (booking.totalAmount || 0) - calcDepositSum(booking))} บาท</span>
                                    </p>
                                    <div>
                                      <h3 className="text-lg font-semibold text-center">QR Code สำหรับชำระเต็มจำนวน</h3>
                                      {paymentConfig?.qrCode ? (
                                        <img
                                          src={paymentConfig.qrCode}
                                          alt="QR Code ชำระเต็ม"
                                          className="w-64 h-64 mx-auto mt-2 border rounded-md object-contain"
                                        />
                                      ) : (
                                        <p className="text-center text-red-600">ยังไม่ได้ตั้งค่า QR Code</p>
                                      )}
                                      <p className="text-xs text-gray-600 mt-2 text-center">
                                        หมายเหตุ: กรุณาสแกนชำระเต็มจำนวนตามราคารวม และแจ้งหลักฐานกับเจ้าหน้าที่ ณ จุดบริการ
                                      </p>
                                      <div className="mt-3">
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                          onClick={() => handleFullPayment(booking.id)}
                                          disabled={!proofFile || isPaying}
                                          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                        >
                                          {isPaying ? "กำลังอัปโหลด..." : "ยืนยันการชำระเต็มจำนวน"}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                onClick={() => handleCancel(booking.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                ยกเลิก
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                          : booking.status === "cancelled"
                          ? "ยกเลิก"
                          : "ชำระแล้ว"}
                      </span>
                      {booking.status === "pending" && booking.expiresAt && (
                        (() => {
                          const mins = getRemainingMinutes(booking);
                          if (mins === null) return null;
                          return (
                            <div className="mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded border ${mins > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {mins > 0 ? `เหลือ ${mins} นาที` : "หมดเวลา"}
                              </span>
                            </div>
                          );
                        })()
                      )}
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
                                setProofFile(null);
                                const now = new Date();
                                const cacheRaw = sessionStorage.getItem(`ppqr_${booking.id}`);
                                const cached = cacheRaw ? JSON.parse(cacheRaw) : null;
                                if (cached && cached.expiresAt && now <= new Date(cached.expiresAt)) {
                                  setPromptPayQR(cached);
                                } else if (!promptPayQR || promptPayQR.bookingId !== booking.id || (promptPayQR.expiresAt && now > new Date(promptPayQR.expiresAt))) {
                                  generatePromptPayQR(booking.id);
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              ชำระมัดจำ
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>ชำระมัดจำการจอง</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-center">
                                <p className="text-lg font-semibold text-blue-600">
                                  ค่าราคาเต็ม: {calculateAmount(booking)} บาท
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                  ค่าจองมัดจำ: {(promptPayQR?.amount || 100).toLocaleString()} บาท
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                  ชำระมัดจำ {(promptPayQR?.amount || 100).toLocaleString()} บาท เพื่อยืนยันการจอง<br/>
                                  ส่วนที่เหลือชำระที่สนาม
                                </p>
                              </div>
                              {promptPayQR && (
                                <CountdownTimer
                                  expiresAt={promptPayQR.expiresAt}
                                  onExpired={async () => {
                                    setPromptPayQR(null);
                                    await handleCancel(booking.id, true);
                                    Swal.fire({
                                      icon: "warning",
                                      title: "หมดเวลาชำระมัดจำ",
                                      text: "การจองถูกยกเลิกอัตโนมัติแล้ว",
                                    });
                                  }}
                                />
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-center mb-3">ชำระด้วย PromptPay</h3>
                                {promptPayQR ? (
                                  <div className="text-center">
                                    <img
                                      src={promptPayQR.qrCode}
                                      alt="PromptPay QR Code"
                                      className="w-64 h-64 mx-auto border rounded-lg"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">
                                      สแกน QR Code เพื่อชำระมัดจำ {(promptPayQR?.amount || 100).toLocaleString()} บาท<br/>
                                      PromptPay: {promptPayQR.promptPayId}
                                    </p>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        setProofFile(e.target.files?.[0] || null)
                                      }
                                      className="mt-3"
                                      placeholder="อัปโหลดหลักฐานการโอน"
                                    />
                                    <Button
                                      onClick={() => handlePayment("qrcode")}
                                      className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                      disabled={!proofFile || isPaying}
                                    >
                                      {isPaying ? "กำลังดำเนินการ..." : "ยืนยันการชำระมัดจำ"}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-600 mt-2">กำลังสร้าง QR Code...</p>
                                  </div>
                                )}
                              </div>
                              <div className="border-t pt-4">
                                <div className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2 justify-center">
                                  <span className="text-amber-600" aria-hidden>⚠️</span>
                                  <span>
                                    หมายเหตุ: หากไม่ชำระมัดจำภายในเวลาที่กำหนด ระบบจะยกเลิกการจองอัตโนมัติทันที
                                  </span>
                                </div>
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
    </div>
  );
}