"use client";

import { useEffect, useState, useRef } from "react";
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

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

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

  if (loading) {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 min-h-screen bg-gray-50 mt-7">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">
        ข่าวประชาสัมพันธ์
      </h1>

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
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-1 sm:py-2 cursor-pointer">
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