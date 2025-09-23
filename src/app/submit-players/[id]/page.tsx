"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Users, Trophy, Calendar, Hash, User, Sparkles, Send, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

type Player = {
  id: string;
  name: string;
  jerseyNumber: string;
  age: string;
  birthYear: string;
};

export default function SubmitPlayers() {
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;
  
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "", jerseyNumber: "", age: "", birthYear: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: "",
      jerseyNumber: "",
      age: "",
      birthYear: ""
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(player => player.id !== id));
    }
  };

  // ฟังก์ชันคำนวณปีเกิด พ.ศ. จากอายุ
  const calculateBirthYear = (age: number): string => {
    const currentYear = new Date().getFullYear() + 543; // แปลงเป็น พ.ศ.
    return (currentYear - age).toString();
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers(players.map(player => {
      if (player.id === id) {
        const updatedPlayer = { ...player, [field]: value };
        
        // ถ้าแก้ไขอายุ ให้คำนวณปีเกิดอัตโนมัติ
        if (field === 'age' && value && !isNaN(Number(value))) {
          updatedPlayer.birthYear = calculateBirthYear(Number(value));
        }
        
        return updatedPlayer;
      }
      return player;
    }));
  };

  const validatePlayers = () => {
    return players.every(player => 
      player.name.trim() !== "" && 
      player.jerseyNumber.trim() !== "" && 
      player.age.trim() !== "" &&
      player.birthYear.trim() !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePlayers()) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/submit-players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          players,
          competitionRegistrationId: parseInt(registrationId)
        }),
      });

      if (response.ok) {
        alert("บันทึกรายชื่อนักเตะเรียบร้อยแล้ว");
        router.push("/Competition-history");
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        alert(`เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถบันทึกข้อมูลได้"}`);
        return;
      }
    } catch (error) {
      console.error("Error submitting players:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/Competition-history">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">ส่งรายชื่อนักเตะ</h1>
                <p className="text-blue-100 flex items-center gap-2 mt-1">
                  <Trophy className="h-4 w-4" />
                  รหัสการสมัคร: {registrationId}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 text-white/90">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="font-medium">กรอกข้อมูลนักเตะให้ครบถ้วน เพื่อความถูกต้องในการแข่งขัน</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">
        {players.map((player, index) => (
          <Card key={player.id} className="relative shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-full p-2">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800">นักเตะคนที่ {index + 1}</CardTitle>
                    <p className="text-sm text-gray-600">กรอกข้อมูลให้ครบถ้วน</p>
                  </div>
                </div>
                {players.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePlayer(player.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${player.id}`} className="flex items-center gap-2 text-gray-700 font-medium">
                    <User className="h-4 w-4 text-blue-500" />
                    ชื่อ-นามสกุล
                  </Label>
                  <Input
                    id={`name-${player.id}`}
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, "name", e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`jersey-${player.id}`} className="flex items-center gap-2 text-gray-700 font-medium">
                    <Hash className="h-4 w-4 text-green-500" />
                    เบอร์เสื้อผู้เล่น
                  </Label>
                  <Input
                    id={`jersey-${player.id}`}
                    type="number"
                    min="1"
                    max="99"
                    value={player.jerseyNumber}
                    onChange={(e) => updatePlayer(player.id, "jerseyNumber", e.target.value)}
                    placeholder="กรอกเบอร์เสื้อ"
                    className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`age-${player.id}`} className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    อายุ (ปี)
                  </Label>
                  <Input
                    id={`age-${player.id}`}
                    type="number"
                    min="10"
                    max="60"
                    value={player.age}
                    onChange={(e) => updatePlayer(player.id, "age", e.target.value)}
                    placeholder="กรอกอายุ"
                    className="border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`birthYear-${player.id}`} className="flex items-center gap-2 text-gray-700 font-medium">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    ปีเกิด (พ.ศ.)
                  </Label>
                  <Input
                    id={`birthYear-${player.id}`}
                    type="number"
                    min="2500"
                    max="2570"
                    value={player.birthYear}
                    onChange={(e) => updatePlayer(player.id, "birthYear", e.target.value)}
                    placeholder="คำนวณอัตโนมัติ"
                    readOnly
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 text-gray-700 font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-8">
          <Button
            type="button"
            onClick={addPlayer}
            variant="outline"
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-md"
          >
            <UserPlus className="h-5 w-5" />
            เพิ่มนักเตะ
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || !validatePlayers()}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 px-8 py-3"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                บันทึกรายชื่อนักเตะ
              </>
            )}
          </Button>
        </div>
        </form>
      </div>
    </div>
  );
}
