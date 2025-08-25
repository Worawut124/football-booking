"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import LoadingCrescent from "@/components/ui/loading-crescent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";

function PageInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = searchParams.get("competitionId");

  const [teamName, setTeamName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [category, setCategory] = useState("");
  const [depositFile, setDepositFile] = useState<File | null>(null);
  const [competitionDetails, setCompetitionDetails] = useState<{
    id: number;
    title: string;
    description: string;
    category: string;
    imageName?: string;
    maxTeams: number;
    registrations: { id: number }[];
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("Competition ID from URL:", competitionId); // Debug
    if (competitionId) {
      Promise.all([
        fetch(`/api/competition-list?id=${competitionId}`).then((res) => res.json()),
        fetch(`/api/competition-list?categories=true`).then((res) => res.json()),
      ])
        .then(([competitionData, categoriesData]) => {
          if (competitionData && competitionData.length > 0) {
            setCompetitionDetails(competitionData[0]);
            setCategory(competitionData[0].category);
          } else {
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: "ไม่พบการแข่งขันที่ระบุ",
              confirmButtonText: "ตกลง",
            });
          }
          setCategories(categoriesData);
        })
        .catch((error) => {
          console.error("Error fetching competition:", error);
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถโหลดรายละเอียดการแข่งขันหรือหมวดหมู่ได้",
            confirmButtonText: "ตกลง",
          });
        });
    } else {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่พบ ID การแข่งขันใน URL",
        confirmButtonText: "ตกลง",
      });
    }
  }, [competitionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!teamName || !managerName || !contactNumber || !playerCount || !category) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณากรอกข้อมูลให้ครบถ้วน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (competitionDetails && competitionDetails.registrations.length >= competitionDetails.maxTeams) {
      Swal.fire({
        icon: "error",
        title: "เต็มแล้ว",
        text: "จำนวนทีมที่สมัครเต็มตามขีดจำกัดแล้ว",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const formData = new FormData();
    formData.append("teamName", teamName);
    formData.append("managerName", managerName);
    formData.append("contactNumber", contactNumber);
    formData.append("playerCount", playerCount);
    formData.append("category", category);
    if (depositFile) formData.append("depositFile", depositFile);

    try {
      setIsSubmitting(true);
      console.log("Submitting to:", `/api/football-competition?competitionId=${competitionId}`); // Debug
      const response = await fetch(`/api/football-competition?competitionId=${competitionId}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "สมัครการแข่งขันสำเร็จ",
          confirmButtonText: "ตกลง",
        }).then(() => {
          router.push(session ? "/dashboard" : "/");
        });
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: data.error || "เกิดข้อผิดพลาดในการสมัคร",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการสมัคร",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDepositFile(e.target.files[0]);
    }
  };

  if (!competitionId || !competitionDetails) {
    return <LoadingCrescent text="กำลังโหลดข้อมูลการแข่งขัน..." />;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{competitionDetails.title}</h2>
        <img
          src={competitionDetails.imageName ? (competitionDetails.imageName.startsWith('http') ? competitionDetails.imageName : `/uploads/${encodeURIComponent(competitionDetails.imageName)}`) : "/placeholder.jpg"}
          alt={competitionDetails.title}
          className="w-full h-64 object-cover mb-4 rounded"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.jpg";
          }}
        />
        <p className="text-gray-600 mb-2">{competitionDetails.description}</p>
        <p className="text-gray-600">หมวดหมู่: {competitionDetails.category}</p>
        <p className="text-gray-600">จำนวนทีมสูงสุด: {competitionDetails.maxTeams}</p>
        <p className="text-gray-600">ทีมที่สมัครแล้ว: {competitionDetails.registrations.length}</p>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">สมัครการแข่งขันฟุตบอล</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>กรอกข้อมูลทีม</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อทีม</label>
              <Input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="กรอกชื่อทีม"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อผู้จัดการทีม</label>
              <Input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="กรอกชื่อผู้จัดการทีม"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">เบอร์ติดต่อผู้จัดการ</label>
              <Input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="กรอกเบอร์ติดต่อ (เช่น 081-234-5678)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">จำนวนผู้เล่น</label>
              <Input
                type="number"
                value={playerCount}
                onChange={(e) => setPlayerCount(e.target.value)}
                placeholder="กรอกจำนวนผู้เล่น"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">หมวดหมู่การแข่งขัน</label>
              <Select value={category} onValueChange={(value) => setCategory(value)} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">อัปโหลดเงินค่าประกันทีม</label>
              <Input
                type="file"
                onChange={handleDepositFileChange}
                accept=".pdf,.jpg,.png"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="disabled:opacity-50 disabled:cursor-not-allowed">ยืนยันการสมัคร</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FootballCompetitionPublicPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">กำลังโหลด...</div>}>
      <PageInner />
    </Suspense>
  );
}