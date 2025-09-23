"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Swal from "sweetalert2";
import { 
  Edit, 
  Plus, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  UserCheck, 
  Crown, 
  User as UserIcon,
  Sparkles,
  Trophy,
  Search,
  Filter
} from "lucide-react";
import LoadingCrescent from "@/components/ui/loading-crescent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  createdAt: string;
}

export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session) {
      if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
        router.push("/");
        return;
      }

      const fetchUsers = async () => {
        setLoading(true);
        try {
          const response = await fetch("/api/users");
          if (response.ok) {
            const data = await response.json();
            setUsers(data);
            setFilteredUsers(data);
          } else {
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [status, session, router]);

  // Filter users based on search term and role
  useEffect(() => {
    let filtered = [...users];

    // Filter by search term (name or email)
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const handleAddUser = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([...users, newUser]);
        setIsAddDialogOpen(false);
        setFormData({ name: "", email: "", phone: "", password: "", role: "USER" });
        Swal.fire({
          icon: "success",
          title: "เพิ่มผู้ใช้สำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถเพิ่มผู้ใช้ได้",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเพิ่มผู้ใช้ได้",
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((user) => (user.id === selectedUser.id ? updatedUser : user)));
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        setFormData({ name: "", email: "", phone: "", password: "", role: "USER" });
        Swal.fire({
          icon: "success",
          title: "อัพเดทผู้ใช้สำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถอัพเดทผู้ใช้ได้",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัพเดทผู้ใช้ได้",
      });
    }
  };


  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, role: newRole }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === id ? updatedUser : u)));
        Swal.fire({
          icon: "success",
          title: "อัพเดทสถานะสำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถอัพเดทสถานะได้",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัพเดทสถานะได้",
      });
    }
  };

  if (status === "loading" || loading) {
    return <LoadingCrescent text="กำลังโหลดผู้ใช้..." />;
  }

  if (!session) {
    return null;
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
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">จัดการผู้ใช้</h1>
              <p className="text-white/90 text-lg">ระบบจัดการผู้ใช้งานในระบบ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">ผู้ใช้ทั้งหมด: {filteredUsers.length} คน</span>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-6 py-3 w-full sm:w-auto">
                  <Plus className="h-5 w-5" />
                  เพิ่มผู้ใช้ใหม่
                </Button>
              </DialogTrigger>
              <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">ชื่อ</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อ"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="กรอกอีเมล"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              </div>
              <div>
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="กรอกรหัสผ่าน"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">สถานะ</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="cursor-pointer"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                บันทึก
              </Button>
            </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Search and Filter Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl shadow-lg border border-slate-200 w-full">
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
                    placeholder="ค้นหาชื่อหรืออีเมล..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">สถานะ:</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-48 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-blue-600" />
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="OWNER">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          Owner
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                ล้างตัวกรอง
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                <TableRow className="border-b-2 border-slate-200">
                  <TableHead className="min-w-[160px] text-center font-bold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <UserIcon className="h-4 w-4 text-blue-600" />
                      ชื่อ
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px] text-center font-bold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      อีเมล
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[140px] text-center font-bold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 text-purple-600" />
                      เบอร์โทรศัพท์
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[140px] text-center font-bold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="h-4 w-4 text-orange-600" />
                      สถานะ
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[160px] text-center font-bold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      วันที่สมัคร
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[180px] text-center font-bold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <Edit className="h-4 w-4 text-cyan-600" />
                      การจัดการ
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-slate-100 rounded-full p-8 w-32 h-32 flex items-center justify-center">
                          <Search className="h-16 w-16 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบผู้ใช้</h3>
                          <p className="text-slate-500">
                            {searchTerm || roleFilter 
                              ? "ไม่มีผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา" 
                              : "ยังไม่มีผู้ใช้ในระบบ"
                            }
                          </p>
                          {(searchTerm || roleFilter) && (
                            <Button
                              onClick={() => {
                                setSearchTerm("");
                                setRoleFilter("");
                              }}
                              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              แสดงผู้ใช้ทั้งหมด
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="whitespace-nowrap">{user.name}</TableCell>
              <TableCell className="whitespace-nowrap">{user.email}</TableCell>
              <TableCell className="whitespace-nowrap">{user.phone || "-"}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {format(new Date(user.createdAt), "dd MMMM yyyy", { locale: th })}
              </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({
                            name: user.name,
                            email: user.email,
                            phone: user.phone || "",
                            password: "",
                            role: user.role,
                          });
                          setIsEditDialogOpen(true);
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-4 py-2"
                      >
                        <Edit className="h-4 w-4" />
                        แก้ไข
                      </Button>
                    </div>
                  </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
      </Table>
      </div>

      {/* Dialog สำหรับแก้ไขผู้ใช้ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ใช้</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">ชื่อ</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="กรอกชื่อ"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">อีเมล</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="กรอกอีเมล"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">เบอร์โทรศัพท์</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="กรอกเบอร์โทรศัพท์"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="กรอกรหัสผ่านใหม่"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">สถานะ</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
              }}
              className="cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleEditUser}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}