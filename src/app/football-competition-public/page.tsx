"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import LoadingCrescent from "@/components/ui/loading-crescent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Phone, User, Hash, Upload, FileText, CheckCircle, AlertCircle, Sparkles, Star, Calendar, MapPin } from "lucide-react";
import Swal from "sweetalert2";

function PageInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = searchParams.get("competitionId");

  const [teamName, setTeamName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [category, setCategory] = useState("");
  const [depositFile, setDepositFile] = useState<File | null>(null);
  const [competitionDetails, setCompetitionDetails] = useState<{
    id: number;
    title: string;
    description: string;
    category: string;
    imageName?: string;
    maxTeams: number;
    registrations: { id: number }[];
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("Competition ID from URL:", competitionId); // Debug
    if (competitionId) {
      Promise.all([
        fetch(`/api/competition-list?id=${competitionId}`).then((res) => res.json()),
        fetch(`/api/competition-list?categories=true`).then((res) => res.json()),
      ])
        .then(([competitionData, categoriesData]) => {
          if (competitionData && competitionData.length > 0) {
            setCompetitionDetails(competitionData[0]);
            setCategory(competitionData[0].category);
          } else {
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: "ไม่พบการแข่งขันที่ระบุ",
              confirmButtonText: "ตกลง",
            });
          }
          setCategories(categoriesData);
        })
        .catch((error) => {
          console.error("Error fetching competition:", error);
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถโหลดรายละเอียดการแข่งขันหรือหมวดหมู่ได้",
            confirmButtonText: "ตกลง",
          });
        });
    } else {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่พบ ID การแข่งขันใน URL",
        confirmButtonText: "ตกลง",
      });
    }
  }, [competitionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // ตรวจสอบข้อมูลทั้งหมด รวมถึงไฟล์
    if (!teamName || !managerName || !contactNumber || !playerCount || !category || !depositFile) {
      Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกข้อมูลและอัปโหลดหลักฐานการโอนเงินให้ครบถ้วน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    // ตรวจสอบจำนวนผู้เล่น
    const playerCountNum = parseInt(playerCount);
    if (playerCountNum < 10 || playerCountNum > 20) {
      Swal.fire({
        icon: "error",
        title: "จำนวนผู้เล่นไม่ถูกต้อง",
        text: "จำนวนผู้เล่นต้องอยู่ระหว่าง 10-20 คน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    // ตรวจสอบเบอร์โทรศัพท์
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contactNumber.replace(/-/g, ""))) {
      Swal.fire({
        icon: "error",
        title: "เบอร์โทรศัพท์ไม่ถูกต้อง",
        text: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (competitionDetails && competitionDetails.registrations.length >= competitionDetails.maxTeams) {
      Swal.fire({
        icon: "error",
        title: "เต็มแล้ว",
        text: "จำนวนทีมที่สมัครเต็มตามขีดจำกัดแล้ว",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const formData = new FormData();
    formData.append("teamName", teamName);
    formData.append("managerName", managerName);
    formData.append("contactNumber", contactNumber);
    formData.append("playerCount", playerCount);
    formData.append("category", category);
    if (depositFile) formData.append("depositFile", depositFile);

    try {
      setIsSubmitting(true);
      console.log("Submitting to:", `/api/football-competition?competitionId=${competitionId}`); // Debug
      const response = await fetch(`/api/football-competition?competitionId=${competitionId}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "สมัครการแข่งขันสำเร็จ",
          confirmButtonText: "ตกลง",
        }).then(() => {
          router.push(session ? "/dashboard" : "/");
        });
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: data.error || "เกิดข้อผิดพลาดในการสมัคร",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการสมัคร",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDepositFile(e.target.files[0]);
    }
  };

  if (!competitionId || !competitionDetails) {
    return <LoadingCrescent text="กำลังโหลดข้อมูลการแข่งขัน..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-white/20 rounded-full p-3">
                <Trophy className="h-10 w-10 text-yellow-300" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">สมัครการแข่งขัน</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              เข้าร่วมการแข่งขันฟุตบอลที่น่าตื่นเต้น พร้อมรางวัลมากมาย
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Competition Details Card */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="relative">
            <img
              src={competitionDetails.imageName || "/placeholder.jpg"}
              alt={competitionDetails.title}
              className="w-full h-80 object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.jpg";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{competitionDetails.title}</h2>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Badge className="bg-yellow-400 text-yellow-900 font-semibold">
                  การแข่งขันระดับพรีเมียม
                </Badge>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">{competitionDetails.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500 rounded-full p-2">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-blue-800">หมวดหมู่</span>
                </div>
                <p className="text-blue-700 font-medium">{competitionDetails.category}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500 rounded-full p-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-green-800">จำนวนทีม</span>
                </div>
                <p className="text-green-700 font-medium">{competitionDetails.registrations.length}/{competitionDetails.maxTeams} ทีม</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-500 rounded-full p-2">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-purple-800">สถานะ</span>
                </div>
                <Badge className={`${competitionDetails.registrations.length >= competitionDetails.maxTeams ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {competitionDetails.registrations.length >= competitionDetails.maxTeams ? 'เต็มแล้ว' : 'เปิดรับสมัคร'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-800">ลงทะเบียนทีม</CardTitle>
                <p className="text-gray-600 mt-1">กรอกข้อมูลทีมของคุณให้ครบถ้วน</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Trophy className="h-4 w-4 text-blue-500" />
                    ชื่อทีม *
                  </Label>
                  <Input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="กรอกชื่อทีมของคุณ"
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700 font-medium">
                    <User className="h-4 w-4 text-green-500" />
                    ชื่อผู้จัดการทีม *
                  </Label>
                  <Input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="กรอกชื่อผู้จัดการทีม"
                    className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Phone className="h-4 w-4 text-purple-500" />
                    เบอร์ติดต่อผู้จัดการ *
                  </Label>
                  <Input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="0XX-XXX-XXXX"
                    className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-gray-500">กรอกเบอร์โทรศัพท์ 10 หลัก</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Hash className="h-4 w-4 text-orange-500" />
                    จำนวนผู้เล่น *
                  </Label>
                  <Input
                    type="number"
                    value={playerCount}
                    onChange={(e) => setPlayerCount(e.target.value)}
                    placeholder="10-20 คน"
                    min="10"
                    max="20"
                    className="border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500">จำนวนผู้เล่นต้องอยู่ระหว่าง 10-20 คน</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  หมวดหมู่การแข่งขัน
                </Label>
                <Select value={category} onValueChange={(value) => setCategory(value)} disabled>
                  <SelectTrigger className="w-full border-2 border-gray-200 bg-gray-50">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">หมวดหมู่ถูกกำหนดตามการแข่งขันที่เลือก</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Upload className="h-4 w-4 text-red-500" />
                  หลักฐานการโอนเงิน *
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div>
                      <Input
                        type="file"
                        onChange={handleDepositFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id="file-upload"
                        required
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                      >
                        คลิกเพื่ือเลือกไฟล์
                      </label>
                      <p className="text-gray-500 text-sm">หรือลากไฟล์มาวางที่นี่</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      รองรับไฟล์: PDF, JPG, PNG (ขนาดไม่เกิน 5MB)
                    </p>
                  </div>
                  {depositFile && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{depositFile.name}</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">ข้อมูลการโอนเงิน:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• ค่าสมัคร: 1500 บาท</li>
                        <li>• ค่าประกันทีม: 500 บาท</li>
                        <li>• รวมทั้งสิ้น: 2,000 บาท</li>
                        <li>• โอนเข้าบัญชี: 858-0-51401-0 (ธนาคารกรุงไทย)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !depositFile} 
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      กำลังส่งข้อมูล...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      ยืนยันการสมัคร
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FootballCompetitionPublicPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">กำลังโหลด...</div>}>
      <PageInner />
    </Suspense>
  );
}