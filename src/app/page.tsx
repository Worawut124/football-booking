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
import { MapPin, Phone, Facebook, Clock, Users, Star } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 opacity-90"></div>
        <div className="relative container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Users className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Sirinthra Stadium
            </h1>
            <p className="text-xl sm:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              สนามฟุตบอลคุณภาพสูง พร้อมระบบจองออนไลน์ที่ทันสมัย
            </p>
            {session?.user && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8 max-w-md mx-auto">
                <p className="text-lg">
                  สวัสดี <span className="font-semibold">{session.user.name || 'สมาชิก'}</span>
                </p>
                <p className="text-sm opacity-80">
                  {getRoleDisplayName(session.user.role || 'USER')}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Clock className="mr-2 h-5 w-5" />
                  จองสนามตอนนี้
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-600 font-semibold px-8 py-3 rounded-full">
                <Star className="mr-2 h-5 w-5" />
                ดูข่าวสาร
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12">

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

        {/* Today's Bookings Section */}
        {bookingsToday.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                การจองวันนี้
              </h2>
              <p className="text-gray-600 text-lg">
                {todayLabel}
              </p>
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
                    <div key={key} className="rounded-xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className={`px-6 py-4 border-b rounded-t-xl bg-gradient-to-r ${colorHeader}`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`text-lg sm:text-xl font-bold ${colorTitle} flex items-center gap-2`}>
                            <Users className="h-5 w-5" />
                            {fieldName}
                          </h3>
                          <span className={`text-sm px-3 py-1 rounded-full border font-medium ${colorBadge}`}>
                            {sorted.length} รายการ
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {sorted.map((b, i) => {
                            const start = format(new Date(b.startTime), 'HH:mm');
                            const end = format(new Date(b.endTime), 'HH:mm');
                            const userName = b.user?.name || (b.userId ? `User ${b.userId}` : 'ไม่ทราบชื่อ');
                            return (
                              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                                <div className="flex items-center gap-3">
                                  <div className="bg-white rounded-full p-2 shadow-sm">
                                    <Clock className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <span className="font-semibold text-gray-800">{start}-{end} น.</span>
                                </div>
                                <span className="text-gray-600 font-medium">{userName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* News Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              ข่าวประชาสัมพันธ์
            </h2>
            <p className="text-gray-600 text-lg">
              ติดตามข่าวสารและกิจกรรมของเรา
            </p>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">ยังไม่มีข่าวประชาสัมพันธ์</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {paginatedAnnouncements.map((ann) => (
                  <Card key={ann.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
                    <div className="relative overflow-hidden rounded-t-lg">
                      {ann.image ? (
                        <img
                          src={ann.image.startsWith('http') ? ann.image : `/uploads/${ann.image}`}
                          alt={ann.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            console.error("Failed to load image:", ann.image);
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <Star className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-blue-600 transition-colors">{ann.title}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {format(new Date(ann.createdAt), "dd MMMM yyyy", { locale: th })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3 mb-4">{ann.content}</p>
                      <Link href={`/announcements/${ann.id}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full transition-all duration-200">
                          อ่านเพิ่มเติม
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-blue-50"}`}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          onClick={() => handlePageChange(index + 1)}
                          isActive={currentPage === index + 1}
                          className="cursor-pointer hover:bg-blue-50"
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-blue-50"}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>

        {/* Contact Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              ติดต่อเรา
            </h2>
            <p className="text-gray-600 text-lg">
              ข้อมูลการติดต่อและที่ตั้งสนาม
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">ชื่อสนาม</h3>
                      <p className="text-gray-600">Sirinthra Stadium</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">ที่ตั้ง</h3>
                      <p className="text-gray-600">
                        สน.3054 ตำบล เหล่าปอแดง อำเภอเมืองสกลนคร สกลนคร, Thailand
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 rounded-full p-3">
                      <Phone className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">เบอร์โทรศัพท์</h3>
                      <a href="tel:096-354-7894" className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
                        096-354-7894
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Facebook className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">เพจ Facebook</h3>
                      <a
                        href="https://web.facebook.com/sirinthrasport/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                      >
                        เยี่ยมชมเพจของเรา
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Map */}
            <div>
              <Card className="p-6 shadow-lg border-0 h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  แผนที่
                </h3>
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d672.4230186825993!2d104.2021061237397!3d17.09960087994801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313cf5c498a0ae03%3A0xc37b1ed5cc157397!2z4Liq4LiZ4Liy4Lih4Lir4LiN4LmJ4Liy4LmA4LiX4Li14Lii4LihIOC4quC4tOC4o-C4tOC4meC4l-C4o-C4siDguKrguYDguJXguYDguJTguLXguKLguKE!5e1!3m2!1sen!2sth!4v1756140219918!5m2!1sen!2sth"
                    width="100%"
                    height="320"
                    style={{ border: "0" }}
                    allowFullScreen={true}
                    loading="lazy"
                    className="rounded-lg"
                  ></iframe>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}