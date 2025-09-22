"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Swal from "sweetalert2";
import LoadingCrescent from "@/components/ui/loading-crescent";
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  Star,
  Sparkles,
  ArrowRight,
  Target,
  Award,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";

interface Competition {
  id: number;
  title: string;
  description: string;
  category: string;
  imageName?: string;
  ageCategory?: string;
  maxTeams?: number;
  registeredTeams?: number;
}

export default function CompetitionListPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch("/api/competition-list");
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await response.json();
      setCompetitions(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดรายการแข่งขันได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  if (!competitions.length) {
    return <LoadingCrescent text="กำลังโหลดรายการแข่งขัน..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 shadow-2xl">
                <Trophy className="h-16 w-16 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-bounce" />
              <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                รายการแข่งขันฟุตบอล
              </h1>
              <Sparkles className="h-8 w-8 text-yellow-300 animate-bounce" />
            </div>
            <p className="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto mb-8 leading-relaxed">
              🏆 เข้าร่วมการแข่งขันฟุตบอลระดับมืออาชีพ พร้อมรางวัลมากมาย ⚽
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Target className="h-5 w-5 text-green-300" />
                <span className="text-sm font-medium">แข่งขันมืออาชีพ</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Award className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-medium">รางวัลมากมาย</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Zap className="h-5 w-5 text-blue-300" />
                <span className="text-sm font-medium">สมัครง่าย รวดเร็ว</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-blue-100 px-6 py-3 rounded-full mb-4">
            <Trophy className="h-6 w-6 text-green-600" />
            <span className="text-green-800 font-semibold text-lg">การแข่งขันที่เปิดรับสมัคร</span>
            <Trophy className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            เลือกการแข่งขันที่คุณสนใจ
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {competitions.map((competition) => (
            <Card key={competition.id} className="group overflow-hidden shadow-xl border-0 bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative overflow-hidden">
                <img
                  src={competition.imageName ? (competition.imageName.startsWith('http') ? competition.imageName : `/uploads/${competition.imageName}`) : "/placeholder.jpg"}
                  alt={competition.title}
                  className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 shadow-lg">
                    <Star className="h-3 w-3 mr-1" />
                    แข่งขัน
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {competition.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 leading-relaxed line-clamp-2">
                  {competition.description}
                </p>
                
                {/* Competition Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-gray-700">หมวดหมู่:</span>
                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                      {competition.category}
                    </Badge>
                  </div>
                  
                  {competition.ageCategory && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-700">รุ่นอายุ:</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        {competition.ageCategory}
                      </Badge>
                    </div>
                  )}
                  
                  {competition.maxTeams && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-gray-700">ทีมที่สมัคร:</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {competition.registeredTeams || 0}/{competition.maxTeams} ทีม
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            ((competition.registeredTeams || 0) / competition.maxTeams) >= 0.8 
                              ? 'bg-gradient-to-r from-red-400 to-red-600' 
                              : ((competition.registeredTeams || 0) / competition.maxTeams) >= 0.6 
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-r from-green-400 to-blue-500'
                          }`}
                          style={{ 
                            width: `${Math.min(((competition.registeredTeams || 0) / competition.maxTeams) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      
                      {/* Status Text */}
                      <div className="text-xs text-center">
                        {((competition.registeredTeams || 0) / competition.maxTeams) >= 1 ? (
                          <span className="text-red-600 font-semibold">🔴 เต็มแล้ว</span>
                        ) : ((competition.registeredTeams || 0) / competition.maxTeams) >= 0.8 ? (
                          <span className="text-orange-600 font-semibold">🟡 ใกล้เต็ม</span>
                        ) : (
                          <span className="text-green-600 font-semibold">🟢 เปิดรับสมัคร</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button
                  className={`w-full shadow-lg hover:shadow-xl transition-all duration-200 group ${
                    competition.maxTeams && (competition.registeredTeams || 0) >= competition.maxTeams
                      ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                  } text-white`}
                  onClick={() => {
                    if (competition.maxTeams && (competition.registeredTeams || 0) >= competition.maxTeams) {
                      return;
                    }
                    router.push(`/football-competition-public?competitionId=${competition.id}`);
                  }}
                  disabled={!!(competition.maxTeams && (competition.registeredTeams || 0) >= competition.maxTeams)}
                >
                  <span className="flex items-center justify-center gap-2">
                    {competition.maxTeams && (competition.registeredTeams || 0) >= competition.maxTeams 
                      ? 'เต็มแล้ว' 
                      : 'สมัครแข่งขัน'
                    }
                    {!(competition.maxTeams && (competition.registeredTeams || 0) >= competition.maxTeams) && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {competitions.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีการแข่งขันในขณะนี้</h3>
            <p className="text-gray-500">กรุณาติดตามการแข่งขันใหม่ๆ ในอนาคต</p>
          </div>
        )}
      </div>
    </div>
  );
}