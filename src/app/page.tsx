"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import LoadingCrescent from "@/components/ui/loading-crescent";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [bookingsToday, setBookingsToday] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/announcements");
        const data = await response.json();
        const sortedAnnouncements = data.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        setAnnouncements(sortedAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const fetchTodayBookings = async () => {
      try {
        const res = await fetch("/api/bookings");
        const all = await res.json();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todays = (Array.isArray(all) ? all : []).filter((b: any) => {
          const s = new Date(b.startTime);
          return s >= startOfToday && s <= endOfToday;
        });
        setBookingsToday(todays);
      } catch (e) {
        console.error("Error fetching today's bookings", e);
      }
    };
    fetchTodayBookings();
  }, []);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });

    const autoplay = setInterval(() => {
      if (api) {
        const nextIndex = (api.selectedScrollSnap() + 1) % api.scrollSnapList().length;
        api.scrollTo(nextIndex);
      }
    }, 3000);

    return () => clearInterval(autoplay);
  }, [api]);

  const featuredAnnouncements = announcements.filter((ann) => ann.isFeatured);

  const totalPages = Math.ceil(announcements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnnouncements = announcements.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const todayLabel = format(new Date(), "dd MMMM yyyy", { locale: th });

  // Status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "pending_confirmation":
      case "deposit_paid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'แอดมิน';
      case 'OWNER':
        return 'เจ้าของสนาม';
      case 'USER':
        return 'สมาชิก';
      default:
        return 'สมาชิก';
    }
  };

  if (loading) {
    return <LoadingCrescent text="กำลังโหลดข้อมูล..." />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50">
      {/* Welcome Message */}
      {session?.user && (
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-3 sm:p-6 rounded-lg mb-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              สวัสดี คุณ{session.user.name || 'สมาชิก'} ({getRoleDisplayName(session.user.role || 'USER')})
            </h2>
            <p className="text-lg sm:text-xl opacity-90">
              ยินดีต้อนรับเข้าสู่สนามฟุตบอล Sirinthra Stadium
            </p>
          </div>
        </div>
      )}
      
      {/* If not logged in, show general welcome */}
      {!session?.user && (
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-3 sm:p-6 rounded-lg mb-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              ยินดีต้อนรับเข้าสู่สนามฟุตบอล Sirinthra Stadium
            </h2>
            <p className="text-lg sm:text-xl opacity-90">
              กรุณาเข้าสู่ระบบเพื่อใช้งานเต็มรูปแบบ
            </p>
          </div>
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">
        ข่าวประชาสัมพันธ์
      </h1>

      {/* ตำแหน่งปุ่มและหัวข้ออยู่ด้านบนสุดของหน้า */}

      {/* Carousel สำหรับข่าวเด่น */}
      {featuredAnnouncements.length > 0 ? (
        <div className="mb-6 sm:mb-8">
          <Carousel setApi={setApi} className="w-full max-w-full sm:max-w-4xl mx-auto">
            <CarouselContent>
              {featuredAnnouncements.map((ann) => (
                <CarouselItem key={ann.id}>
                  <div className="relative">
                    {ann.image ? (
                      <img
                        src={ann.image.startsWith('http') ? ann.image : `/uploads/${ann.image}`}
                        alt={ann.title}
                        className="h-40 sm:h-64 w-full object-cover rounded-lg"
                        onError={(e) => {
                          console.error("Failed to load image:", ann.image);
                          e.currentTarget.style.display = "none";
                          const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (nextSibling) {
                            nextSibling.style.display = "block";
                          }
                        }}
                      />
                    ) : (
                      <p className="text-red-600 text-center h-40 sm:h-64 flex items-center justify-center">
                        ไม่มีภาพสำหรับข่าวนี้
                      </p>
                    )}
                    <p className="text-red-600 text-center h-40 sm:h-64 flex items-center justify-center" style={{ display: "none" }}>
                      ไม่สามารถโหลดภาพได้ กรุณาตรวจสอบ path
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 sm:left-4 h-8 w-8 sm:h-10 sm:w-10 cursor-pointer" />
            <CarouselNext className="right-2 sm:right-4 h-8 w-8 sm:h-10 sm:w-10 cursor-pointer" />
          </Carousel>
        </div>
      ) : (
        <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">ไม่มีข่าวเด่นในขณะนี้</p>
      )}

      {/* รายการข่าว */}
      <div>
        {bookingsToday.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
              <span className="font-semibold text-gray-800">การจองวันที่ {todayLabel}</span>
            </div>
            {/* Group by field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {Object.entries(
                bookingsToday.reduce((acc: Record<string, any[]>, b: any) => {
                  const key = `${b.fieldId}|${b.field?.name || `สนาม ${b.fieldId}`}`;
                  acc[key] = acc[key] || [];
                  acc[key].push(b);
                  return acc;
                }, {})
              )
                .sort((a, b) => {
                  const nameA = a[0].split('|')[1] || '';
                  const nameB = b[0].split('|')[1] || '';
                  return nameA.localeCompare(nameB, 'th');
                })
                .map(([key, list], idx) => {
                  const [, fieldName] = key.split('|');
                  const sorted = [...list].sort((x, y) => new Date(x.startTime).getTime() - new Date(y.startTime).getTime());
                  const colorHeader = idx % 2 === 0 ? 'from-emerald-50 to-teal-50' : 'from-sky-50 to-indigo-50';
                  const colorTitle = idx % 2 === 0 ? 'text-emerald-700' : 'text-sky-700';
                  const colorBadge = idx % 2 === 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-sky-100 text-sky-700 border-sky-200';
                  return (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                      <div className={`px-4 py-3 border-b rounded-t-lg bg-gradient-to-r ${colorHeader}`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`text-base sm:text-lg font-semibold ${colorTitle}`}>{fieldName}</h3>
                          <span className={`text-xs px-2 py-1 rounded border ${colorBadge}`}>จอง {sorted.length} รายการ</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="text-left px-4 py-2 text-gray-700">เวลา</th>
                              <th className="text-left px-4 py-2 text-gray-700">ผู้จอง</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorted.map((b, i) => {
                              const start = format(new Date(b.startTime), 'HH:mm');
                              const end = format(new Date(b.endTime), 'HH:mm');
                              const userName = b.user?.name || (b.userId ? `User ${b.userId}` : 'ไม่ทราบชื่อ');
                              return (
                                <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                  <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{start}-{end} น.</td>
                                  <td className="px-4 py-2 text-gray-700">{userName}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6 mt-5">
          <Link href="/booking">
            <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer order-1 sm:order-none">จองตอนนี้</Button>
          </Link>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">รายการข่าวทั้งหมด</h2>
        {announcements.length === 0 ? (
          <p className="text-gray-600 text-sm sm:text-base">ยังไม่มีข่าวประชาสัมพันธ์</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedAnnouncements.map((ann) => (
                <Card key={ann.id} className="relative">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg line-clamp-1">{ann.title}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-500">
                      เผยแพร่: {format(new Date(ann.createdAt), "dd MMMM yyyy", { locale: th })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {ann.image ? (
                      <img
                        src={ann.image.startsWith('http') ? ann.image : `/uploads/${ann.image}`}
                        alt={ann.title}
                        className="w-full h-32 sm:h-40 object-cover rounded-md mb-3 sm:mb-4"
                        onError={(e) => {
                          console.error("Failed to load image:", ann.image);
                          e.currentTarget.style.display = "none";
                          const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (nextSibling) {
                            nextSibling.style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    <p className="text-gray-600 text-sm sm:text-base line-clamp-3">{ann.content}</p>
                    <div className="mt-3 sm:mt-4">
                      <Link href={`/announcements/${ann.id}`}>
                        <Button className="bg-gray-800 hover:bg-gray-900 text-white text-sm sm:text-base py-1 sm:py-2 cursor-pointer">
                          อ่านเพิ่มเติม
                        </Button>
                      </Link>
                    </div>
                    <p className="text-red-600 text-center mt-2" style={{ display: "none" }}>
                      ไม่สามารถโหลดภาพได้ กรุณาตรวจสอบ path
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4 sm:mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => handlePageChange(index + 1)}
                        isActive={currentPage === index + 1}
                        className="cursor-pointer"
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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