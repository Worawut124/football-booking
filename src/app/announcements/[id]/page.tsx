"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import React from "react";

export default function AnnouncementDetail({ params }: { params: Promise<{ id: string }> }) {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Unwrap params ด้วย React.use
  const { id } = React.use(params);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/announcements`);
        const data = await response.json();
        const foundAnnouncement = data.find((ann: any) => ann.id === parseInt(id));
        if (!foundAnnouncement) {
          router.push("/");
          return;
        }
        setAnnouncement(foundAnnouncement);
      } catch (error) {
        console.error("Error fetching announcement:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncement();
  }, [id, router]);

  if (loading) {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (!announcement) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">รายละเอียดข่าว</h1>
        <Link href="/">
          <Button className="bg-gray-600 hover:bg-gray-700 text-white">กลับไปหน้าแรก</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">{announcement.title}</CardTitle>
          <p className="text-sm sm:text-base text-gray-500">
            เผยแพร่: {format(new Date(announcement.createdAt), "dd MMMM yyyy", { locale: th })}
          </p>
        </CardHeader>
        <CardContent>
          {announcement.image ? (
            <img
              src={announcement.image.startsWith('http') ? announcement.image : `/uploads/${announcement.image}`}
              alt={announcement.title}
              className="w-full max-w-full object-cover rounded-md mb-4 sm:mb-6"
              onError={(e) => {
                console.error("Failed to load image:", announcement.image);
                e.currentTarget.style.display = "none";
                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (nextSibling) {
                  nextSibling.style.display = "block";
                }
              }}
            />
          ) : null}
          <p className="text-red-600 text-center mb-4 sm:mb-6" style={{ display: "none" }}>
            ไม่สามารถโหลดภาพได้ กรุณาตรวจสอบ path
          </p>
          <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">{announcement.content}</p>
          {announcement.details && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">รายละเอียดเพิ่มเติม</h3>
              <p className="text-gray-600 text-sm sm:text-base">{announcement.details}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}