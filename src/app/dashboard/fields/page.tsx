"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingCrescent from "@/components/ui/loading-crescent";
import Swal from "sweetalert2";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
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
  Save,
  X,
  Building,
  Navigation
} from "lucide-react";

export default function FieldsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState<any[]>([]);
  const [filteredFields, setFilteredFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLocation, setNewFieldLocation] = useState("");
  const [editField, setEditField] = useState<{ id: number; name: string; location: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/booking");
      return;
    }

    const fetchFields = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/fields");
        const data = await response.json();
        setFields(data);
        setFilteredFields(data);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถโหลดข้อมูลสนามได้",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, [status, router, session]);

  // Filter fields based on search term
  useEffect(() => {
    let filtered = fields;

    if (searchTerm) {
      filtered = filtered.filter((field) =>
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFields(filtered);
  }, [searchTerm, fields]);

  const handleAddField = async () => {
    const response = await fetch("/api/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFieldName, location: newFieldLocation }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "เพิ่มสนามสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const newField = await response.json();
      setFields([...fields, newField]);
      setNewFieldName("");
      setNewFieldLocation("");
      setIsAddDialogOpen(false);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถเพิ่มสนามได้",
      });
    }
  };

  const handleEditField = async () => {
    if (!editField) return;

    const response = await fetch("/api/fields", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editField.id,
        name: editField.name,
        location: editField.location,
      }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "แก้ไขสนามสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedField = await response.json();
      setFields(fields.map((field) => (field.id === updatedField.id ? updatedField : field)));
      setEditField(null);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถแก้ไขสนามได้",
      });
    }
  };

  const handleDeleteField = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบสนามนี้จริงๆ ใช่ไหม?",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบ",
      cancelButtonText: "ไม่, กลับ",
    });

    if (!result.isConfirmed) return;

    const response = await fetch("/api/fields", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "ลบสนามสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      setFields(fields.filter((field) => field.id !== id));
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถลบสนามได้",
      });
    }
  };

  if (status === "loading" || loading) {
    return <LoadingCrescent text="กำลังโหลดข้อมูลสนาม..." />;
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
  const totalFields = filteredFields.length;

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
                <Building className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">จัดการสนาม</h1>
                <p className="text-white/90 text-lg">จัดการและเพิ่มสนามกีฬาใหม่</p>
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
            <span className="text-white/90">สนามทั้งหมด: {totalFields} สนาม</span>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
        <CardContent className="p-8">
          {/* Statistics Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{totalFields}</div>
                <p className="text-sm text-blue-600">สนามทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">{new Set(fields.map(f => f.location)).size}</div>
                <p className="text-sm text-green-600">สถานที่ต่างๆ</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">{fields.length}</div>
                <p className="text-sm text-orange-600">สนามพร้อมใช้</p>
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
                    placeholder="ค้นหาชื่อสนาม, สถานที่..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => setSearchTerm("")}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>

            {/* Add Field Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-8 py-3"
                >
                  <Plus className="h-5 w-5" />
                  เพิ่มสนามใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-2xl">
                    <div className="bg-green-100 rounded-full p-2">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                    เพิ่มสนามใหม่
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fieldName" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Building className="h-4 w-4" />
                        ชื่อสนาม
                      </Label>
                      <Input
                        id="fieldName"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="ป้อนชื่อสนาม"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldLocation" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <MapPin className="h-4 w-4" />
                        สถานที่
                      </Label>
                      <Input
                        id="fieldLocation"
                        value={newFieldLocation}
                        onChange={(e) => setNewFieldLocation(e.target.value)}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="ป้อนสถานที่"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setNewFieldName("");
                        setNewFieldLocation("");
                        setIsAddDialogOpen(false);
                      }}
                      className="px-6"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      onClick={handleAddField}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มสนาม
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Fields Grid */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Building className="h-6 w-6" />
                รายการสนาม
                <Badge variant="secondary" className="ml-auto">
                  {filteredFields.length} สนาม
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredFields.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบสนาม</h3>
                  <p className="text-slate-500">
                    {searchTerm
                      ? "ไม่มีสนามที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีสนามในระบบ"
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงสนามทั้งหมด
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFields.map((field) => (
                    <Card key={field.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-slate-50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-blue-100 rounded-full p-3">
                            <Building className="h-6 w-6 text-blue-600" />
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            พร้อมใช้
                          </Badge>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{field.name}</h3>
                            <div className="flex items-center gap-2 text-slate-600">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">{field.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center gap-2">
                          <Dialog open={editField?.id === field.id} onOpenChange={(open) => !open && setEditField(null)}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setEditField({ id: field.id, name: field.name, location: field.location })}
                                className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 flex items-center gap-2"
                                variant="outline"
                              >
                                <Edit className="h-4 w-4" />
                                แก้ไข
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-2xl">
                                  <div className="bg-yellow-100 rounded-full p-2">
                                    <Edit className="h-6 w-6 text-yellow-600" />
                                  </div>
                                  แก้ไขสนาม
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <Label htmlFor="edit-fieldName" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                      <Building className="h-4 w-4" />
                                      ชื่อสนาม
                                    </Label>
                                    <Input
                                      id="edit-fieldName"
                                      value={editField?.name || ""}
                                      onChange={(e) => setEditField({ ...editField!, name: e.target.value })}
                                      className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                      placeholder="ป้อนชื่อสนาม"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-fieldLocation" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                      <MapPin className="h-4 w-4" />
                                      สถานที่
                                    </Label>
                                    <Input
                                      id="edit-fieldLocation"
                                      value={editField?.location || ""}
                                      onChange={(e) => setEditField({ ...editField!, location: e.target.value })}
                                      className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                      placeholder="ป้อนสถานที่"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setEditField(null)}
                                    className="px-6"
                                  >
                                    ยกเลิก
                                  </Button>
                                  <Button 
                                    onClick={handleEditField}
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    บันทึกการแก้ไข
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteField(field.id)}
                            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 flex items-center gap-2"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4" />
                            ลบ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}