"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";

interface Registration {
  id: number;
  teamName: string;
  managerName: string;
  contactNumber: string;
  playerCount: number;
  category: string;
  depositFileName?: string;
  status: string;
}

interface Competition {
  id: number;
  title: string;
  description: string;
  category: string;
  imageName?: string;
  maxTeams: number;
  registrations: Registration[];
}

export default function CompetitionManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editMaxTeams, setEditMaxTeams] = useState<{ id: number; maxTeams: number } | null>(null);

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
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/dashboard");
      return;
    }

    fetchCompetitions();
  }, [status, router, session]);

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/football-competition?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "อนุมัติการสมัครสำเร็จ",
          confirmButtonText: "ตกลง",
        });
        fetchCompetitions();
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: data.error || "เกิดข้อผิดพลาดในการอนุมัติ",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการอนุมัติ",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/football-competition?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "ปฏิเสธการสมัครสำเร็จ",
          confirmButtonText: "ตกลง",
        });
        fetchCompetitions();
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: data.error || "เกิดข้อผิดพลาดในการปฏิเสธ",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการปฏิเสธ",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleUpdateMaxTeams = async (id: number) => {
    if (!editMaxTeams) return;
    try {
      const response = await fetch(`/api/competition-list?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxTeams: editMaxTeams.maxTeams }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "อัปเดตจำนวนทีมสูงสุดสำเร็จ",
          confirmButtonText: "ตกลง",
        });
        setEditMaxTeams(null);
        fetchCompetitions();
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: data.error || "เกิดข้อผิดพลาดในการอัปเดต",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการอัปเดต",
        confirmButtonText: "ตกลง",
      });
    }
  };

  if (status === "loading") {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    return <div className="container mx-auto p-4 text-center text-red-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">จัดการการสมัครแข่งขัน</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>รายการแข่งขัน</CardTitle>
        </CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <p className="text-gray-600 text-center">ไม่มีรายการแข่งขัน</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อการแข่งขัน</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>จำนวนทีมสูงสุด</TableHead>
                  <TableHead>ทีมที่สมัครแล้ว</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions.map((competition) => (
                  <TableRow key={competition.id}>
                    <TableCell>{competition.title}</TableCell>
                    <TableCell>{competition.category}</TableCell>
                    <TableCell>
                      {editMaxTeams?.id === competition.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editMaxTeams.maxTeams}
                            onChange={(e) => setEditMaxTeams({ id: competition.id, maxTeams: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="w-20"
                          />
                          <Button onClick={() => handleUpdateMaxTeams(competition.id)}>บันทึก</Button>
                          <Button variant="outline" onClick={() => setEditMaxTeams(null)}>ยกเลิก</Button>
                        </div>
                      ) : (
                        <span>
                          {competition.maxTeams}
                          <Button variant="outline" className="ml-2" onClick={() => setEditMaxTeams({ id: competition.id, maxTeams: competition.maxTeams })}>
                            แก้ไข
                          </Button>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{competition.registrations.length}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log("Navigating to:", `/dashboard/competition-management/${competition.id}`);
                          router.push(`/dashboard/competition-management/${competition.id}`);
                        }}
                      >
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}