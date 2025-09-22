"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Swal from "sweetalert2";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  ArrowLeft,
  Shield,
  Crown,
  Users,
  Sparkles,
  Star,
  Edit,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ตัวย่อชื่อสำหรับ Avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`
      : names[0][0];
  };

  // ฟังก์ชันแสดงไอคอนตามบทบาท
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-5 w-5 text-red-500" />;
      case "OWNER":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Users className="h-5 w-5 text-blue-500" />;
    }
  };

  // ฟังก์ชันแสดงชื่อบทบาท
  const getRoleName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "ผู้ดูแลระบบ";
      case "OWNER":
        return "เจ้าของสนาม";
      default:
        return "สมาชิก";
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: session.user.phone || "",
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
        phone: formData.phone,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-2xl">
                <User className="h-10 w-10 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                    จัดการข้อมูลส่วนตัว
                  </h1>
                </div>
                <p className="text-lg opacity-90">
                  👤 แก้ไขและอัพเดทข้อมูลของคุณ
                </p>
              </div>
            </div>
            <Link href="/">
              <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-gray-800 transition-all duration-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับหน้าแรก
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        {getInitials(session.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {session.user?.name || "ผู้ใช้"}
                      </h2>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {getRoleIcon(session.user?.role || "USER")}
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {getRoleName(session.user?.role || "USER")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500">อีเมล</div>
                        <div className="font-medium">{session.user?.email}</div>
                      </div>
                    </div>
                    {session.user?.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-sm text-gray-500">เบอร์โทรศัพท์</div>
                          <div className="font-medium">{session.user.phone}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Edit Form Card */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <Edit className="h-6 w-6" />
                    แก้ไขข้อมูลส่วนตัว
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User className="h-4 w-4 text-green-500" />
                        ชื่อ-นามสกุล
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="กรอกชื่อ-นามสกุลของคุณ"
                        className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Mail className="h-4 w-4 text-blue-500" />
                        อีเมล
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="กรอกอีเมลของคุณ"
                        className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Phone className="h-4 w-4 text-green-500" />
                        เบอร์โทรศัพท์
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="กรอกเบอร์โทรศัพท์ของคุณ"
                        className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {/* Password Section */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lock className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-800">เปลี่ยนรหัสผ่าน (ไม่บังคับ)</h3>
                      </div>
                      
                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          รหัสผ่านใหม่
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="กรอกรหัสผ่านใหม่"
                            className="focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                          ยืนยันรหัสผ่านใหม่
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="ยืนยันรหัสผ่านใหม่"
                            className="focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          บันทึกข้อมูล
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}