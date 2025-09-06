"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import Swal from "sweetalert2";

interface Player {
  id: string;
  name: string;
  birthYear: string;
}

interface TeamRegistration {
  id: number;
  teamName: string;
  managerName: string;
  category: string;
}

export default function SubmitPlayersPage() {
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;

  const [teamInfo, setTeamInfo] = useState<TeamRegistration | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "", birthYear: "" }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeamInfo();
  }, [registrationId]);

  const fetchTeamInfo = async () => {
    try {
      const response = await fetch(`/api/football-competition/${registrationId}`);
      if (response.ok) {
        const data = await response.json();
        setTeamInfo(data);
      }
    } catch (error) {
      console.error("Error fetching team info:", error);
    }
  };

  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: "",
      birthYear: ""
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(player => player.id !== id));
    }
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, [field]: value } : player
    ));
  };

  const validateForm = () => {
    for (const player of players) {
      if (!player.name.trim()) {
        Swal.fire({
          icon: "error",
          title: "ข้อมูลไม่ครบถ้วน",
          text: "กรุณากรอกชื่อนักเตะให้ครบถ้วน"
        });
        return false;
      }
      if (!player.birthYear.trim()) {
        Swal.fire({
          icon: "error",
          title: "ข้อมูลไม่ครบถ้วน",
          text: "กรุณากรอกปีเกิดให้ครบถ้วน"
        });
        return false;
      }
      const year = parseInt(player.birthYear);
      if (isNaN(year) || year < 1950 || year > new Date().getFullYear()) {
        Swal.fire({
          icon: "error",
          title: "ปีเกิดไม่ถูกต้อง",
          text: "กรุณากรอกปีเกิดที่ถูกต้อง (ค.ศ.)"
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/football-competition/${registrationId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ players })
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ!",
          text: "รายชื่อนักเตะถูกบันทึกเรียบร้อยแล้ว",
          timer: 2000,
          showConfirmButton: false
        });
        router.push("/Competition-history");
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.message || "ไม่สามารถบันทึกข้อมูลได้"
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mb-4"
        >
          ← กลับ
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ส่งรายชื่อนักเตะ
        </h1>
        
        {teamInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลทีม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">ชื่อทีม:</span>
                  <p className="text-gray-800">{teamInfo.teamName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">ผู้จัดการ:</span>
                  <p className="text-gray-800">{teamInfo.managerName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">หมวดหมู่:</span>
                  <p className="text-gray-800">{teamInfo.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">รายชื่อนักเตะ</CardTitle>
          <Button
            onClick={addPlayer}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มนักเตะ
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  {index + 1}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <Input
                      type="text"
                      placeholder="กรอกชื่อ-นามสกุล"
                      value={player.name}
                      onChange={(e) => updatePlayer(player.id, "name", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ปีเกิด (ค.ศ.)
                    </label>
                    <Input
                      type="number"
                      placeholder="เช่น 2000"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={player.birthYear}
                      onChange={(e) => updatePlayer(player.id, "birthYear", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {players.length > 1 && (
                  <Button
                    onClick={() => removePlayer(player.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>กำลังบันทึก...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกรายชื่อ
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
