"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  Star,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
  Heart,
  Trophy,
  CheckCircle,
  Crown
} from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phone, password }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สมัครสมาชิกสำเร็จ!",
          text: "คุณสามารถล็อกอินได้แล้ว",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          router.push("/login");
        });
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "สมัครสมาชิกไม่สำเร็จ",
          text: data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "สมัครสมาชิกไม่สำเร็จ",
        text: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-10 opacity-20">
        <Crown className="h-16 w-16 text-green-500 animate-bounce" />
      </div>
      <div className="absolute top-40 left-20 opacity-20">
        <Star className="h-12 w-12 text-emerald-500 animate-pulse" />
      </div>
      <div className="absolute bottom-20 right-20 opacity-20">
        <Sparkles className="h-14 w-14 text-green-400 animate-bounce" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen py-12 px-4 sm:px-6">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-4 shadow-2xl">
                <UserPlus className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              เข้าร่วมกับเรา
            </h1>
            <p className="text-gray-600 text-lg">สมัครสมาชิกระบบจองสนามฟุตบอล</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-500">ฟรี • ไม่มีค่าใช้จ่าย • ใช้งานง่าย</span>
            </div>
          </div>

          {/* Register Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-green-600" />
                สมัครสมาชิก
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-green-500" />
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white/50 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg transition-all duration-200"
                    placeholder="กรอกอีเมลของคุณ"
                  />
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-green-500" />
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 bg-white/50 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg transition-all duration-200"
                    placeholder="กรอกชื่อ-นามสกุลของคุณ"
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-green-500" />
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11 bg-white/50 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg transition-all duration-200"
                    placeholder="กรอกเบอร์โทรศัพท์ของคุณ"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Lock className="h-4 w-4 text-green-500" />
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 bg-white/50 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg pr-12 transition-all duration-200"
                      placeholder="กรอกรหัสผ่านของคุณ"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร
                  </p>
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 mt-6 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      กำลังสมัครสมาชิก...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      สมัครสมาชิก
                    </>
                  )}
                </Button>
              </form>

              {/* Benefits Section */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  สิทธิประโยชน์สมาชิก
                </h3>
                <ul className="text-xs text-green-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    จองสนามออนไลน์ 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    ติดตามประวัติการจอง
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    รับข่าวสารและโปรโมชั่น
                  </li>
                </ul>
              </div>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">มีบัญชีอยู่แล้ว?</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full h-11 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-semibold transition-all duration-200"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      เข้าสู่ระบบ
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" />
                  ข้อมูลของคุณปลอดภัย • เข้ารหัสด้วย SSL
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}