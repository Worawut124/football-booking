"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Trash2,
  UserCheck,
  UserX,
  Phone,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Sparkles,
  Shield,
  Settings,
  Save,
  X,
  Download,
  ExternalLink,
  UserPlus
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

export default function CompetitionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id ? parseInt(params.id as string) : 0;
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
    setLoading(true);
    try {
      const response = await fetch(`/api/competition-list?id=${competitionId}`);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await response.json();
      if (data && data.length > 0) {
        setCompetition(data[0]);
        setFilteredRegistrations(data[0].registrations || []);
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
    } finally {
      setLoading(false);
    }
  };

  // Filter registrations based on search term and status
  useEffect(() => {
    if (!competition) return;
    
    let filtered = competition.registrations;

    if (searchTerm) {
      filtered = filtered.filter((registration) =>
        registration.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.contactNumber.includes(searchTerm)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((registration) => registration.status === statusFilter);
    }

    setFilteredRegistrations(filtered);
  }, [searchTerm, statusFilter, competition]);

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

  if (status === "loading" || loading) {
    return <LoadingCrescent text="กำลังโหลดรายละเอียดการแข่งขัน..." />;
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

  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm p-8">
          <CardContent className="text-center">
            <div className="bg-orange-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="h-16 w-16 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-orange-600 mb-2">ไม่พบข้อมูล</h3>
            <p className="text-slate-500 mb-4">ไม่พบข้อมูลการแข่งขันที่ระบุ</p>
            <Link href="/dashboard/competition-management">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับรายการแข่งขัน
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalRegistrations = filteredRegistrations.length;
  const approvedRegistrations = filteredRegistrations.filter(reg => reg.status === "APPROVED").length;
  const pendingRegistrations = filteredRegistrations.filter(reg => reg.status === "PENDING").length;
  const rejectedRegistrations = filteredRegistrations.filter(reg => reg.status === "REJECTED").length;
  const availableSlots = competition.maxTeams - competition.registrations.length;
  const registrationPercentage = (competition.registrations.length / competition.maxTeams) * 100;

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
                <h1 className="text-4xl font-bold">{competition.title}</h1>
                <p className="text-white/90 text-lg">รายละเอียดและการจัดการทีมที่สมัคร</p>
              </div>
            </div>
            <Link href="/dashboard/competition-management">
              <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                กลับรายการแข่งขัน
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">ทีมที่สมัครแล้ว: {competition.registrations.length}/{competition.maxTeams} ทีม</span>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
        <CardContent className="p-8">
          {/* Competition Info Card */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Trophy className="h-6 w-6" />
                ข้อมูลการแข่งขัน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">คำอธิบาย</span>
                  </div>
                  <p className="text-slate-700">{competition.description}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">หมวดหมู่</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{competition.category}</Badge>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">จำนวนทีมสูงสุด</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{competition.maxTeams} ทีม</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">ความคืบหน้า</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{competition.registrations.length}/{competition.maxTeams}</span>
                      <span>{registrationPercentage.toFixed(0)}%</span>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{totalRegistrations}</div>
                <p className="text-sm text-blue-600">ทีมที่กรองแล้ว</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">{approvedRegistrations}</div>
                <p className="text-sm text-green-600">อนุมัติแล้ว</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 via-white to-yellow-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <Activity className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-yellow-700 mb-1">{pendingRegistrations}</div>
                <p className="text-sm text-yellow-600">รอพิจารณา</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 via-white to-red-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <Activity className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-700 mb-1">{rejectedRegistrations}</div>
                <p className="text-sm text-red-600">ปฏิเสธแล้ว</p>
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
                    placeholder="ค้นหาชื่อทีม, ผู้จัดการ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">สถานะ:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-48 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm p-2"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="PENDING">รอพิจารณา</option>
                  <option value="APPROVED">อนุมัติแล้ว</option>
                  <option value="REJECTED">ปฏิเสธแล้ว</option>
                </select>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>
          </div>

          {/* Teams Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Users className="h-6 w-6" />
                ทีมที่สมัครแข่งขัน
                <Badge variant="secondary" className="ml-auto">
                  {filteredRegistrations.length} ทีม
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบทีมที่สมัคร</h3>
                  <p className="text-slate-500">
                    {searchTerm || statusFilter
                      ? "ไม่มีทีมที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีทีมสมัครในการแข่งขันนี้"
                    }
                  </p>
                  {(searchTerm || statusFilter) && (
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("");
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงทีมทั้งหมด
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                  <Table className="min-w-[1200px]">
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                      <TableRow className="border-b-2 border-slate-200">
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            ชื่อทีม
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <UserPlus className="h-4 w-4 text-green-600" />
                            ผู้จัดการทีม
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Phone className="h-4 w-4 text-purple-600" />
                            เบอร์ติดต่อ
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-orange-600" />
                            จำนวนผู้เล่น
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Target className="h-4 w-4 text-indigo-600" />
                            หมวดหมู่
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Shield className="h-4 w-4 text-teal-600" />
                            เงินค่าประกัน
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Activity className="h-4 w-4 text-yellow-600" />
                            สถานะ
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Settings className="h-4 w-4 text-slate-600" />
                            จัดการ
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.map((reg) => (
                        <TableRow key={reg.id} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="text-center p-4 font-medium">
                            {reg.teamName}
                          </TableCell>
                          <TableCell className="text-center p-4">
                            {reg.managerName}
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Phone className="h-4 w-4 text-slate-500" />
                              {reg.contactNumber}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              {reg.playerCount} คน
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                              {reg.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            {reg.depositFileName ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(
                                  reg.depositFileName!.startsWith('http') 
                                    ? reg.depositFileName! 
                                    : `/uploads/${encodeURIComponent(reg.depositFileName!)}`,
                                  '_blank'
                                )}
                                className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                ดูสลิป
                              </Button>
                            ) : (
                              <span className="text-slate-500">ไม่มีไฟล์</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <Badge 
                              className={`${
                                reg.status === "PENDING" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                reg.status === "APPROVED" ? "bg-green-100 text-green-800 border-green-200" :
                                reg.status === "REJECTED" ? "bg-red-100 text-red-800 border-red-200" :
                                "bg-gray-100 text-gray-800 border-gray-200"
                              } flex items-center gap-1`}
                            >
                              {reg.status === "PENDING" && <Clock className="h-3 w-3" />}
                              {reg.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
                              {reg.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                              {reg.status === "PENDING" ? "รอพิจารณา" :
                               reg.status === "APPROVED" ? "อนุมัติแล้ว" :
                               reg.status === "REJECTED" ? "ปฏิเสธแล้ว" : reg.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <div className="flex justify-center gap-2 flex-wrap">
                              {reg.status === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(reg.id)}
                                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    variant="outline"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReject(reg.id)}
                                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                    variant="outline"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                onClick={() => setEditRegistration(reg)}
                                className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                variant="outline"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => router.push(`/dashboard/team-players/${reg.id}`)}
                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                variant="outline"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDelete(reg.id)}
                                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                variant="outline"
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

          {/* Edit Registration Dialog */}
          <Dialog open={!!editRegistration} onOpenChange={() => setEditRegistration(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="bg-yellow-100 rounded-full p-2">
                    <Edit className="h-6 w-6 text-yellow-600" />
                  </div>
                  แก้ไขข้อมูลทีม
                </DialogTitle>
              </DialogHeader>
              {editRegistration && (
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="edit-teamName" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Users className="h-4 w-4" />
                        ชื่อทีม
                      </Label>
                      <Input
                        id="edit-teamName"
                        type="text"
                        value={editRegistration.teamName}
                        onChange={(e) => setEditRegistration({ ...editRegistration, teamName: e.target.value })}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-managerName" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <UserPlus className="h-4 w-4" />
                        ชื่อผู้จัดการทีม
                      </Label>
                      <Input
                        id="edit-managerName"
                        type="text"
                        value={editRegistration.managerName}
                        onChange={(e) => setEditRegistration({ ...editRegistration, managerName: e.target.value })}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="edit-contactNumber" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Phone className="h-4 w-4" />
                        เบอร์ติดต่อ
                      </Label>
                      <Input
                        id="edit-contactNumber"
                        type="text"
                        value={editRegistration.contactNumber}
                        onChange={(e) => setEditRegistration({ ...editRegistration, contactNumber: e.target.value })}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-playerCount" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Users className="h-4 w-4" />
                        จำนวนผู้เล่น
                      </Label>
                      <Input
                        id="edit-playerCount"
                        type="number"
                        value={editRegistration.playerCount}
                        onChange={(e) => setEditRegistration({ ...editRegistration, playerCount: parseInt(e.target.value) || 1 })}
                        min="1"
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-category" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Target className="h-4 w-4" />
                      หมวดหมู่
                    </Label>
                    <Input
                      id="edit-category"
                      type="text"
                      value={editRegistration.category}
                      onChange={(e) => setEditRegistration({ ...editRegistration, category: e.target.value })}
                      className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditRegistration(null)}
                      className="px-6"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      บันทึกการแก้ไข
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}