"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

// กำหนด Type สำหรับ Announcement
interface Announcement {
  id: number;
  title: string;
  content: string;
  details: string | null;
  isFeatured: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ManageAnnouncements() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState<{
    title: string;
    content: string;
    details: string;
    isFeatured: boolean;
    imageFile: File | null;
  } | null>(null);
  const [editAnnouncement, setEditAnnouncement] = useState<{
    id: number;
    title: string;
    content: string;
    details: string;
    isFeatured: boolean;
    imageFile: File | null;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/booking");
      return;
    }

    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/announcements");
        const data = await response.json();
        console.log("API Response Data:", data);
        const sortedAnnouncements = data.sort((a: Announcement, b: Announcement) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        setAnnouncements(sortedAnnouncements);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถโหลดข้อมูลข่าวได้",
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchAnnouncements();
    }
  }, [status, router, session]);

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement || !newAnnouncement.title || !newAnnouncement.content) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", newAnnouncement.title);
    formData.append("content", newAnnouncement.content);
    formData.append("details", newAnnouncement.details);
    formData.append("isFeatured", newAnnouncement.isFeatured.toString());
    if (newAnnouncement.imageFile) {
      formData.append("image", newAnnouncement.imageFile);
    }

    const response = await fetch("/api/announcements", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "เพิ่มข่าวสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const addedAnnouncement = await response.json();
      const updatedAnnouncements = [...announcements, addedAnnouncement].sort((a: Announcement, b: Announcement) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setAnnouncements(updatedAnnouncements);
      setNewAnnouncement(null);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถเพิ่มข่าวได้",
      });
    }
  };

  const handleEditAnnouncement = async () => {
    if (!editAnnouncement || !editAnnouncement.title || !editAnnouncement.content) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
      return;
    }

    const formData = new FormData();
    formData.append("id", editAnnouncement.id.toString());
    formData.append("title", editAnnouncement.title);
    formData.append("content", editAnnouncement.content);
    formData.append("details", editAnnouncement.details);
    formData.append("isFeatured", editAnnouncement.isFeatured.toString());
    if (editAnnouncement.imageFile) {
      formData.append("image", editAnnouncement.imageFile);
    }

    const response = await fetch("/api/announcements", {
      method: "PUT",
      body: formData,
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "แก้ไขข่าวสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedAnnouncement = await response.json();
      const updatedAnnouncements = announcements.map((ann) =>
        ann.id === updatedAnnouncement.id ? updatedAnnouncement : ann
      ).sort((a: Announcement, b: Announcement) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setAnnouncements(updatedAnnouncements);
      setEditAnnouncement(null);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถแก้ไขข่าวได้",
      });
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบข่าวนี้จริงๆ ใช่ไหม?",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบ",
      cancelButtonText: "ไม่, กลับ",
    });

    if (!result.isConfirmed) return;

    const response = await fetch("/api/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "ลบข่าวสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedAnnouncements = announcements.filter((ann) => ann.id !== id).sort((a: Announcement, b: Announcement) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setAnnouncements(updatedAnnouncements);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถลบข่าวได้",
      });
    }
  };

  if (status === "loading" || loading) {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return null;
  }

  // กำหนดฟิลด์ที่ต้องการแสดงในตาราง
  const fieldsToDisplay: { key: keyof Announcement; label: string; format?: (value: any) => any }[] = [
    { key: "title", label: "หัวข้อ" },
    { key: "content", label: "เนื้อหา" },
    { key: "details", label: "รายละเอียดเพิ่มเติม" },
    { key: "createdAt", label: "วันที่เผยแพร่", format: (value: string) => value ? format(new Date(value), "dd MMMM yyyy", { locale: th }) : "-" },
    { key: "isFeatured", label: "ข่าวเด่น", format: (value: boolean) => value ? "ใช่" : "ไม่" },
    { key: "image", label: "รูปภาพ", format: (value: string) => value ? <img src={value} alt="Announcement Image" className="w-16 h-16 object-cover" /> : "-" },
  ];

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">จัดการข่าวประชาสัมพันธ์</h1>
        <Link href="/dashboard">
          <Button className="bg-gray-600 hover:bg-gray-700 text-white">กลับไปแดชบอร์ด</Button>
        </Link>
      </div>

      {/* ปุ่มเพิ่มข่าว */}
      <div className="mb-6">
        <Dialog open={newAnnouncement !== null} onOpenChange={(open) => !open && setNewAnnouncement(null)}>
          <DialogTrigger asChild>
            <Button
              onClick={() =>
                setNewAnnouncement({
                  title: "",
                  content: "",
                  details: "",
                  isFeatured: false,
                  imageFile: null,
                })
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              เพิ่มข่าวประชาสัมพันธ์
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มข่าวประชาสัมพันธ์</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">หัวข้อ</Label>
                <Input
                  id="title"
                  value={newAnnouncement?.title || ""}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement!, title: e.target.value })
                  }
                  placeholder="กรอกหัวข้อข่าว"
                />
              </div>
              <div>
                <Label htmlFor="content">เนื้อหา</Label>
                <Input
                  id="content"
                  value={newAnnouncement?.content || ""}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement!, content: e.target.value })
                  }
                  placeholder="กรอกเนื้อหาข่าว"
                />
              </div>
              <div>
                <Label htmlFor="details">รายละเอียดเพิ่มเติม (ถ้ามี)</Label>
                <Textarea
                  id="details"
                  value={newAnnouncement?.details || ""}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement!, details: e.target.value })
                  }
                  placeholder="กรอกรายละเอียดเพิ่มเติม"
                />
              </div>
              <div>
                <Label htmlFor="image">รูปภาพ (ถ้ามี)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewAnnouncement({ ...newAnnouncement!, imageFile: file });
                    }
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isFeatured"
                  checked={newAnnouncement?.isFeatured || false}
                  onCheckedChange={(checked) =>
                    setNewAnnouncement({ ...newAnnouncement!, isFeatured: checked })
                  }
                />
                <Label htmlFor="isFeatured">ตั้งเป็นข่าวเด่น (แสดงใน Carousel)</Label>
              </div>
              <Button
                onClick={handleAddAnnouncement}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                บันทึก
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ตารางจัดการข่าว */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">รายการข่าว</h2>
        {announcements.length === 0 ? (
          <p className="text-gray-600">ยังไม่มีข่าวประชาสัมพันธ์</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {fieldsToDisplay.map((field) => (
                  <TableHead key={field.key} className="min-w-[150px] text-center">
                    {field.label}
                  </TableHead>
                ))}
                <TableHead className="min-w-[150px] text-center">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((ann, index) => {
                console.log(`Announcement ${index + 1}:`, ann); // Log ข้อมูลแต่ละแถว
                return (
                  <TableRow key={ann.id}>
                    <TableCell className="min-w-[150px] text-center">{ann.title || "-"}</TableCell>
                    <TableCell className="min-w-[150px] text-center">{ann.content || "-"}</TableCell>
                    <TableCell className="min-w-[150px] text-center">{ann.details || "-"}</TableCell>
                    <TableCell className="min-w-[150px] text-center">
                      {ann.createdAt ? format(new Date(ann.createdAt), "dd MMMM yyyy", { locale: th }) : "-"}
                    </TableCell>
                    <TableCell className="min-w-[150px] text-center">{ann.isFeatured ? "ใช่" : "ไม่"}</TableCell>
                    <TableCell className="min-w-[150px] text-center">
                      {ann.image ? (
                        <img src={ann.image} alt="Announcement Image" className="w-16 h-16 object-cover mx-auto" />
                      ) : "-"}
                    </TableCell>
                    <TableCell className="min-w-[150px] text-center">
                      <div className="flex gap-2 justify-center">
                        <Dialog open={editAnnouncement?.id === ann.id} onOpenChange={(open) => !open && setEditAnnouncement(null)}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() =>
                                setEditAnnouncement({
                                  id: ann.id,
                                  title: ann.title || "",
                                  content: ann.content || "",
                                  details: ann.details || "",
                                  isFeatured: ann.isFeatured || false,
                                  imageFile: null,
                                })
                              }
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              แก้ไข
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>แก้ไขข่าวประชาสัมพันธ์</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-title">หัวข้อ</Label>
                                <Input
                                  id="edit-title"
                                  value={editAnnouncement?.title || ""}
                                  onChange={(e) =>
                                    setEditAnnouncement({ ...editAnnouncement!, title: e.target.value })
                                  }
                                  placeholder="กรอกหัวข้อข่าว"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-content">เนื้อหา</Label>
                                <Input
                                  id="edit-content"
                                  value={editAnnouncement?.content || ""}
                                  onChange={(e) =>
                                    setEditAnnouncement({ ...editAnnouncement!, content: e.target.value })
                                  }
                                  placeholder="กรอกเนื้อหาข่าว"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-details">รายละเอียดเพิ่มเติม (ถ้ามี)</Label>
                                <Textarea
                                  id="edit-details"
                                  value={editAnnouncement?.details || ""}
                                  onChange={(e) =>
                                    setEditAnnouncement({ ...editAnnouncement!, details: e.target.value })
                                  }
                                  placeholder="กรอกรายละเอียดเพิ่มเติม"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-image">รูปภาพใหม่ (ถ้ามี)</Label>
                                <Input
                                  id="edit-image"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setEditAnnouncement({ ...editAnnouncement!, imageFile: file });
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-isFeatured"
                                  checked={editAnnouncement?.isFeatured || false}
                                  onCheckedChange={(checked) =>
                                    setEditAnnouncement({ ...editAnnouncement!, isFeatured: checked })
                                  }
                                />
                                <Label htmlFor="edit-isFeatured">ตั้งเป็นข่าวเด่น (แสดงใน Carousel)</Label>
                              </div>
                              <Button
                                onClick={handleEditAnnouncement}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                บันทึก
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          ลบ
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}