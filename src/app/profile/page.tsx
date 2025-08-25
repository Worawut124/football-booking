"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Swal from "sweetalert2";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        password: "",
        confirmPassword: "",
      });
      setLoading(false);
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
      });
      setLoading(false);
      return;
    }

    try {
      const dataToSubmit = {
        name: formData.name,
        email: formData.email,
        ...(formData.password && { password: formData.password }),
      };

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "อัพเดทข้อมูลสำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
        router.refresh();
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถอัพเดทข้อมูลได้",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัพเดทข้อมูลได้",
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">จัดการข้อมูลส่วนตัว</h1>
        <Link href="/">
          <Button className="bg-gray-600 hover:bg-gray-700 text-white cursor-pointer">
            กลับไปหน้าแรก
          </Button>
        </Link>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">ข้อมูลส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">ชื่อ</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="กรอกชื่อของคุณ"
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
                placeholder="กรอกอีเมลของคุณ"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="กรอกรหัสผ่านใหม่"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              disabled={loading}
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}