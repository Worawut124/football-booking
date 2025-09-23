"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import LoadingCrescent from "@/components/ui/loading-crescent";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Star,
  Calendar,
  FileText,
  Image as ImageIcon,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Sparkles,
  Eye,
  ArrowLeft,
  Users,
  MessageSquare,
  Clock,
  CheckCircle
} from "lucide-react";

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
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
        setFilteredAnnouncements(sortedAnnouncements);
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

  // Filter announcements based on search term and featured status
  useEffect(() => {
    let filtered = announcements;

    if (searchTerm) {
      filtered = filtered.filter((announcement) =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (announcement.details && announcement.details.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (featuredFilter) {
      const isFeatured = featuredFilter === "featured";
      filtered = filtered.filter((announcement) => announcement.isFeatured === isFeatured);
    }

    setFilteredAnnouncements(filtered);
  }, [searchTerm, featuredFilter, announcements]);

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
      setIsAddDialogOpen(false);
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
    return <LoadingCrescent text="กำลังโหลดข่าว..." />;
  }

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return null;
  }

  // Calculate statistics
  const totalAnnouncements = filteredAnnouncements.length;
  const featuredAnnouncements = filteredAnnouncements.filter(ann => ann.isFeatured).length;
  const recentAnnouncements = filteredAnnouncements.filter(ann => {
    const createdDate = new Date(ann.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate >= weekAgo;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white rounded-2xl p-8 mb-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <Megaphone className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">จัดการข่าวประชาสัมพันธ์</h1>
                <p className="text-white/90 text-lg">จัดการและเผยแพร่ข่าวสารต่างๆ</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                กลับแดชบอร์ด
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">ข่าวทั้งหมด: {totalAnnouncements} รายการ</span>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
        <CardContent className="p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Megaphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{totalAnnouncements}</div>
                <p className="text-sm text-blue-600">ข่าวทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 via-white to-yellow-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <Activity className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-yellow-700 mb-1">{featuredAnnouncements}</div>
                <p className="text-sm text-yellow-600">ข่าวเด่น</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">{recentAnnouncements}</div>
                <p className="text-sm text-green-600">ข่าวใหม่ (7 วัน)</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Add Section */}
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl shadow-lg border border-slate-200 flex-1">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">ตัวกรอง:</label>
              </div>
              
              {/* Search Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">ค้นหา:</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="ค้นหาหัวข้อ, เนื้อหา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Featured Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">ประเภท:</label>
                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="w-full sm:w-48 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm p-2"
                >
                  <option value="">ทุกประเภท</option>
                  <option value="featured">ข่าวเด่น</option>
                  <option value="normal">ข่าวทั่วไป</option>
                </select>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setFeaturedFilter("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>

            {/* Add Announcement Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setNewAnnouncement({
                      title: "",
                      content: "",
                      details: "",
                      isFeatured: false,
                      imageFile: null,
                    });
                    setIsAddDialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-8 py-3"
                >
                  <Plus className="h-5 w-5" />
                  เพิ่มข่าวใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-2xl">
                    <div className="bg-green-100 rounded-full p-2">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                    เพิ่มข่าวประชาสัมพันธ์ใหม่
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <FileText className="h-4 w-4" />
                        หัวข้อข่าว
                      </Label>
                      <Input
                        id="title"
                        value={newAnnouncement?.title || ""}
                        onChange={(e) =>
                          setNewAnnouncement({ ...newAnnouncement!, title: e.target.value })
                        }
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="ป้อนหัวข้อข่าว"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="image" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <ImageIcon className="h-4 w-4" />
                        รูปภาพประกอบ
                      </Label>
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
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      เนื้อหาข่าว
                    </Label>
                    <Input
                      id="content"
                      value={newAnnouncement?.content || ""}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement!, content: e.target.value })
                      }
                      className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="ป้อนเนื้อหาข่าว"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="details" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <FileText className="h-4 w-4" />
                      รายละเอียดเพิ่มเติม
                    </Label>
                    <Textarea
                      id="details"
                      value={newAnnouncement?.details || ""}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement!, details: e.target.value })
                      }
                      className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px]"
                      placeholder="ป้อนรายละเอียดเพิ่มเติม (ถ้ามี)"
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Switch
                      id="isFeatured"
                      checked={newAnnouncement?.isFeatured || false}
                      onCheckedChange={(checked) =>
                        setNewAnnouncement({ ...newAnnouncement!, isFeatured: checked })
                      }
                    />
                    <div>
                      <Label htmlFor="isFeatured" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Star className="h-4 w-4 text-yellow-600" />
                        ตั้งเป็นข่าวเด่น
                      </Label>
                      <p className="text-xs text-slate-500">ข่าวเด่นจะแสดงใน Carousel หน้าแรก</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setNewAnnouncement(null);
                        setIsAddDialogOpen(false);
                      }}
                      className="px-6"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      onClick={handleAddAnnouncement}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มข่าว
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Announcements Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Megaphone className="h-6 w-6" />
                รายการข่าวประชาสัมพันธ์
                <Badge variant="secondary" className="ml-auto">
                  {filteredAnnouncements.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบข่าวประชาสัมพันธ์</h3>
                  <p className="text-slate-500">
                    {searchTerm || featuredFilter
                      ? "ไม่มีข่าวที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีข่าวประชาสัมพันธ์ในระบบ"
                    }
                  </p>
                  {(searchTerm || featuredFilter) && (
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setFeaturedFilter("");
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงข่าวทั้งหมด
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                      <TableRow className="border-b-2 border-slate-200">
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            หัวข้อ
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            เนื้อหา
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <ImageIcon className="h-4 w-4 text-purple-600" />
                            รูปภาพ
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Star className="h-4 w-4 text-yellow-600" />
                            ข่าวเด่น
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            วันที่เผยแพร่
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Edit className="h-4 w-4 text-slate-600" />
                            จัดการ
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnnouncements.map((ann) => (
                        <TableRow key={ann.id} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="text-center p-4 font-medium max-w-xs">
                            <div className="truncate" title={ann.title}>
                              {ann.title}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-4 max-w-sm">
                            <div className="truncate" title={ann.content}>
                              {ann.content}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            {ann.image ? (
                              <div className="flex justify-center">
                                <img 
                                  src={ann.image} 
                                  alt="Announcement Image" 
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200 shadow-sm" 
                                />
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-slate-400" />
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <Badge 
                              variant={ann.isFeatured ? "default" : "secondary"}
                              className={ann.isFeatured ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-slate-100 text-slate-700"}
                            >
                              {ann.isFeatured ? (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  ข่าวเด่น
                                </div>
                              ) : (
                                "ข่าวทั่วไป"
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-4 text-slate-600 text-sm">
                            {ann.createdAt ? format(new Date(ann.createdAt), "dd MMMM yyyy", { locale: th }) : "-"}
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <div className="flex justify-center gap-2">
                              <Dialog open={editAnnouncement?.id === ann.id} onOpenChange={(open) => !open && setEditAnnouncement(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
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
                                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-2xl">
                                      <div className="bg-yellow-100 rounded-full p-2">
                                        <Edit className="h-6 w-6 text-yellow-600" />
                                      </div>
                                      แก้ไขข่าวประชาสัมพันธ์
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <Label htmlFor="edit-title" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                          <FileText className="h-4 w-4" />
                                          หัวข้อข่าว
                                        </Label>
                                        <Input
                                          id="edit-title"
                                          value={editAnnouncement?.title || ""}
                                          onChange={(e) =>
                                            setEditAnnouncement({ ...editAnnouncement!, title: e.target.value })
                                          }
                                          className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                          placeholder="ป้อนหัวข้อข่าว"
                                          required
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-image" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                          <ImageIcon className="h-4 w-4" />
                                          รูปภาพใหม่
                                        </Label>
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
                                          className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="edit-content" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <MessageSquare className="h-4 w-4" />
                                        เนื้อหาข่าว
                                      </Label>
                                      <Input
                                        id="edit-content"
                                        value={editAnnouncement?.content || ""}
                                        onChange={(e) =>
                                          setEditAnnouncement({ ...editAnnouncement!, content: e.target.value })
                                        }
                                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        placeholder="ป้อนเนื้อหาข่าว"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor="edit-details" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <FileText className="h-4 w-4" />
                                        รายละเอียดเพิ่มเติม
                                      </Label>
                                      <Textarea
                                        id="edit-details"
                                        value={editAnnouncement?.details || ""}
                                        onChange={(e) =>
                                          setEditAnnouncement({ ...editAnnouncement!, details: e.target.value })
                                        }
                                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 min-h-[100px]"
                                        placeholder="ป้อนรายละเอียดเพิ่มเติม (ถ้ามี)"
                                      />
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                      <Switch
                                        id="edit-isFeatured"
                                        checked={editAnnouncement?.isFeatured || false}
                                        onCheckedChange={(checked) =>
                                          setEditAnnouncement({ ...editAnnouncement!, isFeatured: checked })
                                        }
                                      />
                                      <div>
                                        <Label htmlFor="edit-isFeatured" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                          <Star className="h-4 w-4 text-yellow-600" />
                                          ตั้งเป็นข่าวเด่น
                                        </Label>
                                        <p className="text-xs text-slate-500">ข่าวเด่นจะแสดงใน Carousel หน้าแรก</p>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setEditAnnouncement(null)}
                                        className="px-6"
                                      >
                                        ยกเลิก
                                      </Button>
                                      <Button 
                                        onClick={handleEditAnnouncement}
                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6"
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        บันทึกการแก้ไข
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}