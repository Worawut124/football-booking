"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    <div
      className="flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-gray-900 min-h-screen py-8"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-700">
            ล็อกอิน
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">ยินดีต้อนรับสู่ระบบจองสนาม</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">อีเมลหรือเบอร์โทร</label>
              <Input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                className="mt-1 w-full border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="กรอกอีเมลหรือเบอร์โทรของคุณ"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 pr-10"
                placeholder="กรอกรหัสผ่าน"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-10 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <Button
              type="submit"
              disabled={isLoginLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition duration-200 disabled:opacity-50"
            >
              {isLoginLoading ? "กำลังล็อกอิน..." : "ล็อกอิน"}
            </Button>
          </form>

          {/* ลิงก์ลืมรหัสผ่าน */}
          <div className="mt-4 text-center">
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
              <DialogTrigger asChild>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  ลืมรหัสผ่าน?
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-green-700">
                    ลืมรหัสผ่าน
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล
                    </label>
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="กรอกอีเมลของคุณ"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isForgotLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition duration-200 disabled:opacity-50"
                    >
                      {isForgotLoading ? "กำลังส่ง..." : "ส่งอีเมลรีเซ็ต"}
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
                <p className="text-xs text-gray-500 text-center mt-3">
                  ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ
                </p>
              </DialogContent>
            </Dialog>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-green-600 hover:underline font-medium">
              สมัครสมาชิก
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
