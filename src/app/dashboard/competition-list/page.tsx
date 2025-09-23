"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import LoadingCrescent from "@/components/ui/loading-crescent";
import Swal from "sweetalert2";
import Link from "next/link";
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  Users,
  Target,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Award,
  Star,
  TrendingUp,
  Activity,
  FileText,
  ArrowLeft,
  XCircle
} from "lucide-react";

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
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [editCompetition, setEditCompetition] = useState<Competition | null>(null);
  const [newCompetition, setNewCompetition] = useState({
    title: "",
    description: "",
    category: "",
    maxTeams: 10,
    imageFile: null as File | null,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch("/api/competition-list");
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await response.json();
      setCompetitions(data);
      setFilteredCompetitions(data);
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

  // Filter competitions based on search term and category
  useEffect(() => {
    let filtered = competitions;

    if (searchTerm) {
      filtered = filtered.filter((competition) =>
        competition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        competition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        competition.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((competition) => competition.category === selectedCategory);
    }

    setFilteredCompetitions(filtered);
  }, [searchTerm, selectedCategory, competitions]);

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
        setIsEditDialogOpen(false);
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
        setIsAddDialogOpen(false);
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

  // Calculate statistics
  const totalCompetitions = filteredCompetitions.length;
  const totalRegistrations = filteredCompetitions.reduce((sum, comp) => sum + comp.registrations.length, 0);
  const avgRegistrationsPerCompetition = totalCompetitions > 0 ? Math.round(totalRegistrations / totalCompetitions) : 0;
  const mostPopularCompetition = filteredCompetitions.reduce((max, comp) => 
    comp.registrations.length > (max?.registrations.length || 0) ? comp : max, null as Competition | null
  );

  if (status === "loading") {
    return <LoadingCrescent text="กำลังโหลดข้อมูลการแข่งขัน..." />;
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm p-8">
          <CardContent className="text-center">
            <div className="bg-red-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
            <p className="text-slate-500 mb-4">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับแดชบอร์ด
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">จัดการรายการแข่งขัน</h1>
              <p className="text-white/90 text-lg">จัดการและติดตามการแข่งขันฟุตบอล</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">รายการทั้งหมด: {totalCompetitions} การแข่งขัน</span>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
        <CardContent className="p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{totalCompetitions}</div>
                <p className="text-sm text-blue-600">การแข่งขันทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">{totalRegistrations}</div>
                <p className="text-sm text-green-600">ทีมที่สมัครแล้ว</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-1">{avgRegistrationsPerCompetition}</div>
                <p className="text-sm text-purple-600">เฉลี่ย/การแข่งขัน</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                  <Star className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">{mostPopularCompetition?.registrations.length || 0}</div>
                <p className="text-sm text-orange-600">ยอดนิยมสูงสุด</p>
                {mostPopularCompetition && (
                  <p className="text-xs text-orange-500 mt-1 truncate">{mostPopularCompetition.title}</p>
                )}
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
                    placeholder="ค้นหาชื่อการแข่งขัน, คำอธิบาย..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">หมวดหมู่:</label>
                <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full sm:w-48 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm">
                    <SelectValue placeholder="ทุกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>

            {/* Add Competition Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-8 py-3">
                  <Plus className="h-5 w-5" />
                  เพิ่มการแข่งขันใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-2xl">
                    <div className="bg-green-100 rounded-full p-2">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                    เพิ่มรายการแข่งขันใหม่
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCompetition} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Trophy className="inline h-4 w-4 mr-1" />
                        ชื่อการแข่งขัน
                      </label>
                      <Input
                        type="text"
                        value={newCompetition.title}
                        onChange={(e) => setNewCompetition({ ...newCompetition, title: e.target.value })}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="ป้อนชื่อการแข่งขัน"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Target className="inline h-4 w-4 mr-1" />
                        จำนวนทีมสูงสุด
                      </label>
                      <Input
                        type="number"
                        value={newCompetition.maxTeams}
                        onChange={(e) => setNewCompetition({ ...newCompetition, maxTeams: parseInt(e.target.value) || 10 })}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <FileText className="inline h-4 w-4 mr-1" />
                      คำอธิบาย
                    </label>
                    <Input
                      type="text"
                      value={newCompetition.description}
                      onChange={(e) => setNewCompetition({ ...newCompetition, description: e.target.value })}
                      className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="ป้อนคำอธิบายการแข่งขัน"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Filter className="inline h-4 w-4 mr-1" />
                      หมวดหมู่
                    </label>
                    <Select value={newCompetition.category} onValueChange={(value) => setNewCompetition({ ...newCompetition, category: value })}>
                      <SelectTrigger className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500">
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <ImageIcon className="inline h-4 w-4 mr-1" />
                      ภาพประกอบ
                    </label>
                    <Input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewCompetition({ ...newCompetition, imageFile: e.target.files[0] });
                        }
                      }}
                      className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      accept="image/*"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setNewCompetition({ title: "", description: "", category: "", maxTeams: 10, imageFile: null });
                        setIsAddDialogOpen(false);
                      }}
                      className="px-6"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มการแข่งขัน
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Competitions Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Trophy className="h-6 w-6" />
                จัดการรายการแข่งขัน
                <Badge variant="secondary" className="ml-auto">
                  {filteredCompetitions.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredCompetitions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบการแข่งขัน</h3>
                  <p className="text-slate-500">
                    {searchTerm || selectedCategory 
                      ? "ไม่มีการแข่งขันที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีการแข่งขันในระบบ"
                    }
                  </p>
                  {(searchTerm || selectedCategory) && (
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงการแข่งขันทั้งหมด
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                  <Table className="min-w-[900px]">
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                      <TableRow className="border-b-2 border-slate-200">
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Trophy className="h-4 w-4 text-blue-600" />
                            ชื่อการแข่งขัน
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            คำอธิบาย
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Filter className="h-4 w-4 text-purple-600" />
                            หมวดหมู่
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Target className="h-4 w-4 text-orange-600" />
                            ทีมสูงสุด
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-indigo-600" />
                            ทีมที่สมัคร
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
                      {filteredCompetitions.map((competition) => (
                        <TableRow key={competition.id} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="text-center p-4 font-medium">
                            {competition.title}
                          </TableCell>
                          <TableCell className="text-center p-4 max-w-xs">
                            <div className="truncate" title={competition.description}>
                              {competition.description}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              {competition.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              {competition.maxTeams} ทีม
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <Badge 
                              variant={competition.registrations.length >= competition.maxTeams ? "destructive" : "default"}
                              className={competition.registrations.length >= competition.maxTeams ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                            >
                              {competition.registrations.length}/{competition.maxTeams}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <div className="flex justify-center gap-2">
                              <Dialog open={isEditDialogOpen && editCompetition?.id === competition.id} onOpenChange={(open) => {
                                setIsEditDialogOpen(open);
                                if (!open) setEditCompetition(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setEditCompetition(competition);
                                      setIsEditDialogOpen(true);
                                    }}
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
                                      แก้ไขการแข่งขัน
                                    </DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={handleUpdateCompetition} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                          <Trophy className="inline h-4 w-4 mr-1" />
                                          ชื่อการแข่งขัน
                                        </label>
                                        <Input
                                          type="text"
                                          value={editCompetition?.title || competition.title}
                                          onChange={(e) => setEditCompetition({ ...competition, title: e.target.value })}
                                          className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                          required
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                          <Target className="inline h-4 w-4 mr-1" />
                                          จำนวนทีมสูงสุด
                                        </label>
                                        <Input
                                          type="number"
                                          value={editCompetition?.maxTeams || competition.maxTeams}
                                          onChange={(e) => setEditCompetition({ ...competition, maxTeams: parseInt(e.target.value) || 1 })}
                                          className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                          min="1"
                                          required
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <FileText className="inline h-4 w-4 mr-1" />
                                        คำอธิบาย
                                      </label>
                                      <Input
                                        type="text"
                                        value={editCompetition?.description || competition.description}
                                        onChange={(e) => setEditCompetition({ ...competition, description: e.target.value })}
                                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <Filter className="inline h-4 w-4 mr-1" />
                                        หมวดหมู่
                                      </label>
                                      <Select 
                                        value={editCompetition?.category || competition.category} 
                                        onValueChange={(value) => setEditCompetition({ ...competition, category: value })}
                                      >
                                        <SelectTrigger className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
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
                                      <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <ImageIcon className="inline h-4 w-4 mr-1" />
                                        ภาพประกอบ
                                      </label>
                                      <Input
                                        type="file"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            setEditCompetition({ ...competition, imageName: e.target.files[0].name });
                                          }
                                        }}
                                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        accept="image/*"
                                      />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => {
                                          setEditCompetition(null);
                                          setIsEditDialogOpen(false);
                                        }}
                                        className="px-6"
                                      >
                                        ยกเลิก
                                      </Button>
                                      <Button 
                                        type="submit"
                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6"
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        บันทึกการแก้ไข
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDelete(competition.id)}
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