"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // ไอคอนจาก heroicons

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State สำหรับ toggle รหัส
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
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
    }
  };

  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-gray-900 min-h-screen py-8"
      style={{
        // backgroundImage: "url(/images/img11.jpg)", // ใช้ภาพจาก public/images/
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-700">
            สมัครสมาชิก สนามบอล
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">เข้าร่วมระบบจองสนามวันนี้!</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">อีเมล</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="กรอกอีเมลของคุณ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="กรอกชื่อของคุณ"
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition duration-200"
            >
              สมัครสมาชิก
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}