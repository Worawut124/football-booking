"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Swal from "sweetalert2";
import LoadingCrescent from "@/components/ui/loading-crescent";

interface Competition {
  id: number;
  title: string;
  description: string;
  category: string;
  imageName?: string;
}

export default function CompetitionListPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch("/api/competition-list");
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await response.json();
      setCompetitions(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดรายการแข่งขันได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  if (!competitions.length) {
    return <LoadingCrescent text="กำลังโหลดรายการแข่งขัน..." />;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">รายการแข่งขันฟุตบอล</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitions.map((competition) => (
          <Card key={competition.id} className="overflow-hidden">
            <CardHeader>
              <img
                src={competition.imageName ? (competition.imageName.startsWith('http') ? competition.imageName : `/uploads/${competition.imageName}`) : "/placeholder.jpg"}
                alt={competition.title}
                className="w-full h-48 object-cover"
              />
              <CardTitle className="text-center mt-2">{competition.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{competition.description}</p>
              <p className="text-sm text-gray-600 mb-2">หมวดหมู่: {competition.category}</p>
              <Button
                className="w-full"
                onClick={() => router.push(`/football-competition-public?competitionId=${competition.id}`)}
              >
                สมัคร
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}