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

interface Competition {
  id: number;
  title: string;
  description: string;
  category: string;
  imageName?: string;
  maxTeams: number;
  registrations: { id: number }[];
}

export default function CompetitionListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [editCompetition, setEditCompetition] = useState<Competition | null>(null);
  const [newCompetition, setNewCompetition] = useState({
    title: "",
    description: "",
    category: "",
    maxTeams: 10,
    imageFile: null as File | null,
  });
  const [categories, setCategories] = useState<string[]>([]);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/competition-list?categories=true");
      if (!response.ok) throw new Error("ไม่สามารถดึงหมวดหมู่ได้");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดหมวดหมู่ได้",
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
    fetchCategories();
  }, [status, router, session]);

  const handleUpdateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompetition) return;

    const formData = new FormData();
    formData.append("title", editCompetition.title);
    formData.append("description", editCompetition.description);
    formData.append("category", editCompetition.category);
    formData.append("maxTeams", editCompetition.maxTeams.toString());
    if (editCompetition.imageName && !editCompetition.imageName.startsWith("public/uploads/")) {
      formData.append("imageFile", new File([], editCompetition.imageName)); // ใช้ไฟล์เดิมถ้าไม่มีการอัปโหลดใหม่
    } else if (editCompetition.imageName) {
      formData.append("imageFile", new File([], editCompetition.imageName.split("/").pop() || ""));
    }

    try {
      const response = await fetch(`/api/competition-list?id=${editCompetition.id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "อัปเดตการแข่งขันสำเร็จ",
          confirmButtonText: "ตกลง",
        });
        setEditCompetition(null);
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

  const handleAddCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", newCompetition.title);
    formData.append("description", newCompetition.description);
    formData.append("category", newCompetition.category);
    formData.append("maxTeams", newCompetition.maxTeams.toString());
    if (newCompetition.imageFile) {
      formData.append("imageFile", newCompetition.imageFile);
    }

    try {
      const response = await fetch("/api/competition-list", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "เพิ่มรายการแข่งขันสำเร็จ",
          confirmButtonText: "ตกลง",
        });
        setNewCompetition({ title: "", description: "", category: "", maxTeams: 10, imageFile: null });
        fetchCompetitions();
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: data.error || "เกิดข้อผิดพลาดในการเพิ่ม",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการเพิ่ม",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleDelete = async (id: number) => {
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
          const response = await fetch(`/api/competition-list?id=${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            Swal.fire({
              icon: "success",
              title: "สำเร็จ",
              text: "ลบรายการแข่งขันสำเร็จ",
              confirmButtonText: "ตกลง",
            });
            fetchCompetitions();
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

  if (status === "loading") {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    return <div className="container mx-auto p-4 text-center text-red-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">รายการแข่งขัน</h1>
      <Card className="shadow-md mb-6">
        <CardHeader>
          <CardTitle>เพิ่มรายการแข่งขัน</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button>เพิ่มรายการใหม่</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มรายการแข่งขัน</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCompetition} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อการแข่งขัน</label>
                  <Input
                    type="text"
                    value={newCompetition.title}
                    onChange={(e) => setNewCompetition({ ...newCompetition, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">คำอธิบาย</label>
                  <Input
                    type="text"
                    value={newCompetition.description}
                    onChange={(e) => setNewCompetition({ ...newCompetition, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                  <select
                    value={newCompetition.category}
                    onChange={(e) => setNewCompetition({ ...newCompetition, category: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">จำนวนทีมสูงสุด</label>
                  <Input
                    type="number"
                    value={newCompetition.maxTeams}
                    onChange={(e) => setNewCompetition({ ...newCompetition, maxTeams: parseInt(e.target.value) || 10 })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ภาพประกอบ</label>
                  <Input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewCompetition({ ...newCompetition, imageFile: e.target.files[0] });
                      }
                    }}
                  />
                </div>
                <Button type="submit">บันทึก</Button>
                <Button variant="outline" onClick={() => setNewCompetition({ title: "", description: "", category: "", maxTeams: 10, imageFile: null })} className="ml-2">
                  ยกเลิก
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>จัดการรายการแข่งขัน</CardTitle>
        </CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <p className="text-gray-600 text-center">ไม่มีรายการแข่งขัน</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อการแข่งขัน</TableHead>
                  <TableHead>คำอธิบาย</TableHead>
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
                    <TableCell>{competition.description}</TableCell>
                    <TableCell>{competition.category}</TableCell>
                    <TableCell>{competition.maxTeams}</TableCell>
                    <TableCell>{competition.registrations.length}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="mr-2">แก้ไข</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>แก้ไขการแข่งขัน</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdateCompetition} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">ชื่อการแข่งขัน</label>
                              <Input
                                type="text"
                                value={editCompetition?.id === competition.id ? editCompetition.title : competition.title}
                                onChange={(e) => setEditCompetition({ ...competition, title: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">คำอธิบาย</label>
                              <Input
                                type="text"
                                value={editCompetition?.id === competition.id ? editCompetition.description : competition.description}
                                onChange={(e) => setEditCompetition({ ...competition, description: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                              <select
                                value={editCompetition?.id === competition.id ? editCompetition.category : competition.category}
                                onChange={(e) => setEditCompetition({ ...competition, category: e.target.value })}
                                className="w-full p-2 border rounded"
                                required
                              >
                                <option value="">เลือกหมวดหมู่</option>
                                {categories.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">จำนวนทีมสูงสุด</label>
                              <Input
                                type="number"
                                value={editCompetition?.id === competition.id ? editCompetition.maxTeams : competition.maxTeams}
                                onChange={(e) => setEditCompetition({ ...competition, maxTeams: parseInt(e.target.value) || 1 })}
                                min="1"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">ภาพประกอบ</label>
                              <Input
                                type="file"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setEditCompetition({ ...competition, imageName: e.target.files[0].name });
                                  }
                                }}
                              />
                            </div>
                            <Button type="submit">บันทึก</Button>
                            <Button variant="outline" onClick={() => setEditCompetition(null)} className="ml-2">
                              ยกเลิก
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" onClick={() => handleDelete(competition.id)}>
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
    </div>
  );
}