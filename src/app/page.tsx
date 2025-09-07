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

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [bookingsToday, setBookingsToday] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUser();
  }, []);

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

  if (loading) {
    return <LoadingCrescent text="กำลังโหลดข้อมูล..." />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50">
      {/* ส่วนแสดงข้อความต้อนรับผู้ใช้ */}
      {user && (
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl sm:text-2xl">👋</span>
            <h2 className="text-lg sm:text-xl font-semibold">
              สวัสดี คุณ{user.name || user.email}
            </h2>
          </div>
          <p className="text-sm sm:text-base opacity-90">
            ยินดีต้อนรับเข้าสู่ สนามฟุตบอล Sirinthra Stadium
          </p>
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
          <div className="mb-4 sm:mb-6 rounded-md border border-slate-200 bg-green-50 px-3 py-2 text-sm sm:text-base text-gray-900 shadow-sm">
            <div className="mb-1 font-semibold flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
              <span>การจองวันที่ {todayLabel}</span>
            </div>
            {React.createElement(
              "marquee",
              {
                direction: "left",
                scrollamount: "6",
                onMouseOver: (e: any) => e?.currentTarget?.stop?.(),
                onMouseOut: (e: any) => e?.currentTarget?.start?.(),
              },
              bookingsToday
                .map((b: any) => {
                  const start = format(new Date(b.startTime), "HH:mm");
                  const end = format(new Date(b.endTime), "HH:mm");
                  const fieldName = b.field?.name || `สนาม ${b.fieldId}`;
                  const userName = b.user?.name || (b.userId ? `User ${b.userId}` : "ไม่ทราบชื่อ");
                  return `${start}-${end} ${fieldName} จองโดย ${userName}`;
                })
                .join("  |  ")
            )}
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