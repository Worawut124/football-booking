"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน",
        confirmButtonText: "ตกลง",
      }).then(() => {
        router.push("/login");
      });
      return;
    }
    setToken(tokenParam);
  }, [searchParams, router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ!",
          text: data.message,
          confirmButtonText: "ตกลง",
        }).then(() => {
          router.push("/login");
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
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-gray-900"
      style={{
        // backgroundImage: "url(/images/img11.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-700">
            รีเซ็ตรหัสผ่าน
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">กรุณากรอกรหัสผ่านใหม่</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 pr-10"
                placeholder="กรอกรหัสผ่านใหม่"
                minLength={6}
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
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 w-full border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 pr-10"
                placeholder="ยืนยันรหัสผ่านใหม่"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-10 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition duration-200 disabled:opacity-50"
            >
              {isLoading ? "กำลังประมวลผล..." : "รีเซ็ตรหัสผ่าน"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/login")}
              className="text-green-600 hover:text-green-700"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
