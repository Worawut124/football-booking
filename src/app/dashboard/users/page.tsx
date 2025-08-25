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
import { Trash2, Edit } from "lucide-react";
import LoadingCrescent from "@/components/ui/loading-crescent";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
        setFormData({ name: "", email: "", password: "", role: "USER" });
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
        setFormData({ name: "", email: "", password: "", role: "USER" });
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

  const handleDeleteUser = async (id: number) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "การลบผู้ใช้นี้จะไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setUsers(users.filter((user) => user.id !== id));
          Swal.fire({
            icon: "success",
            title: "ลบผู้ใช้สำเร็จ!",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          const errorData = await response.json();
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: errorData.error || "ไม่สามารถลบผู้ใช้ได้",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบผู้ใช้ได้",
        });
      }
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
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">จัดการผู้ใช้</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
              เพิ่มผู้ใช้
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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ชื่อ</TableHead>
            <TableHead>อีเมล</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>วันที่สมัคร</TableHead>
            <TableHead>การจัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-[120px]">
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
              <TableCell className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setFormData({
                      name: user.name,
                      email: user.email,
                      password: "",
                      role: user.role,
                    });
                    setIsEditDialogOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  แก้ไข
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  ลบ
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </div>
  );
}