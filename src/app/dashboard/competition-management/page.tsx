"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import LoadingCrescent from "@/components/ui/loading-crescent";
import Swal from "sweetalert2";
import Link from "next/link";
import {
  Trophy,
  Users,
  Calendar,
  Target,
  Edit,
  Eye,
  Plus,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowLeft,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  UserCheck,
  UserX,
  Save,
  X
} from "lucide-react";

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
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editMaxTeams, setEditMaxTeams] = useState<{ id: number; maxTeams: number } | null>(null);

  const fetchCompetitions = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  // Filter competitions based on search term and category
  useEffect(() => {
    let filtered = competitions;

    if (searchTerm) {
      filtered = filtered.filter((competition) =>
        competition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        competition.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((competition) => competition.category === categoryFilter);
    }

    setFilteredCompetitions(filtered);
  }, [searchTerm, categoryFilter, competitions]);

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

  if (status === "loading" || loading) {
    return <LoadingCrescent text="กำลังโหลดรายการแข่งขัน..." />;
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

  // Calculate statistics
  const totalCompetitions = filteredCompetitions.length;
  const totalRegistrations = filteredCompetitions.reduce((sum, comp) => sum + comp.registrations.length, 0);
  const availableSlots = filteredCompetitions.reduce((sum, comp) => sum + (comp.maxTeams - comp.registrations.length), 0);
  const categories = [...new Set(competitions.map(comp => comp.category))];

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
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">จัดการการแข่งขัน</h1>
                <p className="text-white/90 text-lg">จัดการการสมัครและรายละเอียดการแข่งขัน</p>
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
            <span className="text-white/90">การแข่งขันทั้งหมด: {totalCompetitions} รายการ</span>
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

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">{availableSlots}</div>
                <p className="text-sm text-orange-600">ที่ว่างคงเหลือ</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Section */}
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
                    placeholder="ค้นหาชื่อการแข่งขัน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">หมวดหมู่:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-48 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm p-2"
                >
                  <option value="">ทุกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>
          </div>

          {/* Competitions Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Trophy className="h-6 w-6" />
                รายการการแข่งขัน
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
                    {searchTerm || categoryFilter
                      ? "ไม่มีการแข่งขันที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีการแข่งขันในระบบ"
                    }
                  </p>
                  {(searchTerm || categoryFilter) && (
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setCategoryFilter("");
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงการแข่งขันทั้งหมด
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
                            <Trophy className="h-4 w-4 text-blue-600" />
                            ชื่อการแข่งขัน
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Target className="h-4 w-4 text-green-600" />
                            หมวดหมู่
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Settings className="h-4 w-4 text-purple-600" />
                            จำนวนทีมสูงสุด
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-orange-600" />
                            ทีมที่สมัครแล้ว
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Eye className="h-4 w-4 text-slate-600" />
                            จัดการ
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompetitions.map((competition) => {
                        const registrationPercentage = (competition.registrations.length / competition.maxTeams) * 100;
                        const availableSlots = competition.maxTeams - competition.registrations.length;
                        
                        return (
                          <TableRow key={competition.id} className="hover:bg-blue-50 transition-colors">
                            <TableCell className="text-center p-4 font-medium max-w-xs">
                              <div className="truncate" title={competition.title}>
                                {competition.title}
                              </div>
                            </TableCell>
                            <TableCell className="text-center p-4">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {competition.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center p-4">
                              {editMaxTeams?.id === competition.id ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Input
                                    type="number"
                                    value={editMaxTeams?.maxTeams || competition.maxTeams}
                                    onChange={(e) => setEditMaxTeams({ id: competition.id, maxTeams: parseInt(e.target.value) || 1 })}
                                    min="1"
                                    className="w-20 text-center border-2 border-purple-300 focus:ring-2 focus:ring-purple-500"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateMaxTeams(competition.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditMaxTeams(null)}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <Badge variant="outline" className="border-purple-200 text-purple-700 font-semibold">
                                    {competition.maxTeams} ทีม
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditMaxTeams({ id: competition.id, maxTeams: competition.maxTeams })}
                                    className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center p-4">
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`${
                                      registrationPercentage >= 100 ? "border-red-200 text-red-700 bg-red-50" :
                                      registrationPercentage >= 80 ? "border-yellow-200 text-yellow-700 bg-yellow-50" :
                                      "border-green-200 text-green-700 bg-green-50"
                                    }`}
                                  >
                                    {competition.registrations.length}/{competition.maxTeams}
                                  </Badge>
                                  {registrationPercentage >= 100 && (
                                    <Badge className="bg-red-100 text-red-800">เต็ม</Badge>
                                  )}
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      registrationPercentage >= 100 ? "bg-red-500" :
                                      registrationPercentage >= 80 ? "bg-yellow-500" :
                                      "bg-green-500"
                                    }`}
                                    style={{ width: `${Math.min(registrationPercentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-500">
                                  เหลือ {availableSlots} ที่
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center p-4">
                              <Button
                                onClick={() => {
                                  console.log("Navigating to:", `/dashboard/competition-management/${competition.id}`);
                                  router.push(`/dashboard/competition-management/${competition.id}`);
                                }}
                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-2"
                                variant="outline"
                              >
                                <Eye className="h-4 w-4" />
                                ดูรายละเอียด
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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