"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
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
    <div className="container mx-auto py-4 px-2 sm:px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/Competition-history">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          ส่งรายชื่อนักเตะ
          <span className="text-sm text-gray-600 block">รหัสการสมัคร: {registrationId}</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {players.map((player, index) => (
          <Card key={player.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">นักเตะคนที่ {index + 1}</CardTitle>
                {players.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePlayer(player.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${player.id}`}>ชื่อ-นามสกุล</Label>
                  <Input
                    id={`name-${player.id}`}
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, "name", e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`jersey-${player.id}`}>เบอร์เสื้อผู้เล่น</Label>
                  <Input
                    id={`jersey-${player.id}`}
                    type="number"
                    min="1"
                    max="99"
                    value={player.jerseyNumber}
                    onChange={(e) => updatePlayer(player.id, "jerseyNumber", e.target.value)}
                    placeholder="กรอกเบอร์เสื้อ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`age-${player.id}`}>อายุ (ปี)</Label>
                  <Input
                    id={`age-${player.id}`}
                    type="number"
                    min="10"
                    max="60"
                    value={player.age}
                    onChange={(e) => updatePlayer(player.id, "age", e.target.value)}
                    placeholder="กรอกอายุ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`birthYear-${player.id}`}>ปีเกิด (พ.ศ.)</Label>
                  <Input
                    id={`birthYear-${player.id}`}
                    type="number"
                    min="2500"
                    max="2570"
                    value={player.birthYear}
                    onChange={(e) => updatePlayer(player.id, "birthYear", e.target.value)}
                    placeholder="คำนวณอัตโนมัติ"
                    readOnly
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={addPlayer}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            เพิ่มนักเตะ
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || !validatePlayers()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกรายชื่อนักเตะ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
