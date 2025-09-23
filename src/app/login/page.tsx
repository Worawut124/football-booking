"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Sparkles,
  Star,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
  Heart,
  Trophy
} from "lucide-react";

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // แยก state loading
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        emailOrPhone,
        password,
      });

      if (result?.error) {
        Swal.fire({
          icon: "error",
          title: "ล็อกอินล้มเหลว",
          text: result.error || "กรุณาตรวจสอบอีเมล/เบอร์โทรและรหัสผ่าน",
        });
      } else {
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        const role = session?.user?.role;

        Swal.fire({
          icon: "success",
          title: "ล็อกอินสำเร็จ!",
          text: "ยินดีต้อนรับกลับมา",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          if (role === "ADMIN" || role === "OWNER") {
            router.push("/dashboard");
          } else {
            router.push("/booking");
          }
        });
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกอีเมล",
        text: "กรุณากรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setIsForgotLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "ส่งอีเมลสำเร็จ!",
          text: data.message,
          confirmButtonText: "ตกลง",
        }).then(() => {
          setIsForgotPasswordOpen(false);
          setForgotEmail("");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "ข้อผิดพลาด",
          text: data.error,
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsForgotLoading(false);
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
      <div className="absolute top-20 left-10 opacity-20">
        <Trophy className="h-16 w-16 text-green-500 animate-bounce" />
      </div>
      <div className="absolute top-40 right-20 opacity-20">
        <Star className="h-12 w-12 text-emerald-500 animate-pulse" />
      </div>
      <div className="absolute bottom-20 left-20 opacity-20">
        <Sparkles className="h-14 w-14 text-green-400 animate-bounce" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen py-12 px-4 sm:px-6">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-4 shadow-2xl">
                <LogIn className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              ยินดีต้อนรับกลับ
            </h1>
            <p className="text-gray-600 text-lg">เข้าสู่ระบบจองสนามฟุตบอล</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-500 ml-2">Sirinthra Stadium</span>
            </div>
          </div>

          {/* Login Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-green-600" />
                เข้าสู่ระบบ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email/Phone Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-green-500" />
                    อีเมลหรือเบอร์โทรศัพท์
                  </label>
                  <Input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                    className="h-12 bg-white/50 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg transition-all duration-200"
                    placeholder="กรอกอีเมลหรือเบอร์โทรของคุณ"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Lock className="h-4 w-4 text-green-500" />
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-white/50 border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-lg pr-12 transition-all duration-200"
                      placeholder="กรอกรหัสผ่านของคุณ"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isLoginLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      เข้าสู่ระบบ
                    </>
                  )}
                </Button>
              </form>

              {/* Forgot Password */}
              <div className="mt-6 text-center">
                <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                  <DialogTrigger asChild>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium hover:underline transition-colors">
                      ลืมรหัสผ่าน?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        รีเซ็ตรหัสผ่าน
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          อีเมล
                        </label>
                        <Input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          className="h-11 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="กรอกอีเมลของคุณ"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={isForgotLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50"
                        >
                          {isForgotLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              กำลังส่ง...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              ส่งอีเมล
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsForgotPasswordOpen(false);
                            setForgotEmail("");
                          }}
                          className="flex-1"
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </form>
                    <div className="bg-blue-50 rounded-lg p-3 mt-4">
                      <p className="text-xs text-blue-700 text-center flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" />
                        ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">หรือ</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/register">
                    <Button
                      variant="outline"
                      className="w-full h-11 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-semibold transition-all duration-200"
                    >
                      <UserPlus className="h-5 w-5 mr-2" />
                      สมัครสมาชิกใหม่
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" />
                  ระบบปลอดภัย 100% • เข้ารหัสข้อมูลทุกการเชื่อมต่อ
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
