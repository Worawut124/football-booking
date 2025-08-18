"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export default function CompetitionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id ? parseInt(params.id as string) : 0;
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [editRegistration, setEditRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/dashboard");
      return;
    }

    if (competitionId) {
      fetchCompetitionDetails();
    }
  }, [status, router, session, competitionId]);

  const fetchCompetitionDetails = async () => {
    try {
      const response = await fetch(`/api/competition-list?id=${competitionId}`);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await response.json();
      if (data && data.length > 0) {
        setCompetition(data[0]);
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่พบการแข่งขันที่ระบุ",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดรายละเอียดการแข่งขันได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleApprove = async (registrationId: number) => {
    try {
      const response = await fetch(`/api/football-competition?id=${registrationId}`, {
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
        fetchCompetitionDetails();
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

  const handleReject = async (registrationId: number) => {
    try {
      const response = await fetch(`/api/football-competition?id=${registrationId}`, {
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
        fetchCompetitionDetails();
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

  const handleDelete = async (registrationId: number) => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "การลบนี้ไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบ!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/football-competition?id=${registrationId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            Swal.fire({
              icon: "success",
              title: "สำเร็จ",
              text: "ลบการสมัครสำเร็จ",
              confirmButtonText: "ตกลง",
            });
            fetchCompetitionDetails();
          } else {
            const data = await response.json();
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: data.error || "เกิดข้อผิดพลาดในการลบ",
              confirmButtonText: "ตกลง",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "เกิดข้อผิดพลาดในการลบ",
            confirmButtonText: "ตกลง",
          });
        }
      }
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRegistration) return;

    try {
      const response = await fetch(`/api/football-competition?id=${editRegistration.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: editRegistration.teamName,
          managerName: editRegistration.managerName,
          contactNumber: editRegistration.contactNumber,
          playerCount: editRegistration.playerCount,
          category: editRegistration.category,
        }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "อัปเดตข้อมูลสำเร็จ",
          confirmButtonText: "ตกลง",
        });
        setEditRegistration(null);
        fetchCompetitionDetails();
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

  if (!competition) {
    return <div className="container mx-auto p-4">ไม่พบข้อมูลการแข่งขัน</div>;
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">รายละเอียดการแข่งขัน: {competition.title}</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>ข้อมูลการแข่งขัน</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>คำอธิบาย:</strong> {competition.description}</p>
          <p><strong>หมวดหมู่:</strong> {competition.category}</p>
          <p><strong>จำนวนทีมสูงสุด:</strong> {competition.maxTeams}</p>
          <p><strong>ทีมที่สมัครแล้ว:</strong> {competition.registrations.length}</p>
        </CardContent>
      </Card>
      <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle>ทีมที่สมัคร</CardTitle>
        </CardHeader>
        <CardContent>
          {competition.registrations.length === 0 ? (
            <p className="text-gray-600 text-center">ไม่มีทีมสมัคร</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อทีม</TableHead>
                  <TableHead>ผู้จัดการทีม</TableHead>
                  <TableHead>เบอร์ติดต่อ</TableHead>
                  <TableHead>จำนวนผู้เล่น</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>เงินค่าประกัน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competition.registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>{reg.teamName}</TableCell>
                    <TableCell>{reg.managerName}</TableCell>
                    <TableCell>{reg.contactNumber}</TableCell>
                    <TableCell>{reg.playerCount}</TableCell>
                    <TableCell>{reg.category}</TableCell>
                    <TableCell>
                      {reg.depositFileName ? (
                        <a 
                          href={reg.depositFileName.startsWith('http') ? reg.depositFileName : `/uploads/${encodeURIComponent(reg.depositFileName)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 underline"
                        >
                          ดูสลีป
                        </a>
                      ) : "ไม่มีไฟล์"}
                    </TableCell>
                    <TableCell>{reg.status}</TableCell>
                    <TableCell>
                      {reg.status === "PENDING" && (
                        <>
                          <Button variant="outline" onClick={() => handleApprove(reg.id)} className="mr-2">
                            อนุมัติ
                          </Button>
                          <Button variant="destructive" onClick={() => handleReject(reg.id)} className="mr-2">
                            ปฏิเสธ
                          </Button>
                        </>
                      )}
                      <Button variant="secondary" onClick={() => setEditRegistration(reg)} className="mr-2">
                        แก้ไข
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(reg.id)}>
                        ลบ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!editRegistration} onOpenChange={() => setEditRegistration(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลทีม</DialogTitle>
          </DialogHeader>
          {editRegistration && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อทีม</label>
                <Input
                  type="text"
                  value={editRegistration.teamName}
                  onChange={(e) => setEditRegistration({ ...editRegistration, teamName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อผู้จัดการทีม</label>
                <Input
                  type="text"
                  value={editRegistration.managerName}
                  onChange={(e) => setEditRegistration({ ...editRegistration, managerName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">เบอร์ติดต่อ</label>
                <Input
                  type="text"
                  value={editRegistration.contactNumber}
                  onChange={(e) => setEditRegistration({ ...editRegistration, contactNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">จำนวนผู้เล่น</label>
                <Input
                  type="number"
                  value={editRegistration.playerCount}
                  onChange={(e) => setEditRegistration({ ...editRegistration, playerCount: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                <Input
                  type="text"
                  value={editRegistration.category}
                  onChange={(e) => setEditRegistration({ ...editRegistration, category: e.target.value })}
                  required
                />
              </div>
              <Button type="submit">บันทึก</Button>
              <Button variant="outline" onClick={() => setEditRegistration(null)} className="ml-2">
                ยกเลิก
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}