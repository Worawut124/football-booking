"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Trash2, Save, X } from "lucide-react";
import Swal from "sweetalert2";

interface Player {
  id: number;
  name: string;
  jerseyNumber: string;
  birthYear: string;
  createdAt: string;
}

interface Registration {
  id: number;
  teamName: string;
  managerName: string;
  contactNumber: string;
  playerCount: number;
  category: string;
  status: string;
  competition: {
    id: number;
    title: string;
    description: string;
    category: string;
  };
}

export default function TeamPlayersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{[key: number]: {name: string, jerseyNumber: string, birthYear: string}}>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/dashboard");
      return;
    }

    if (registrationId) {
      fetchTeamData();
    }
  }, [status, router, session, registrationId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch registration details
      const regResponse = await fetch(`/api/football-competition?id=${registrationId}`);
      if (!regResponse.ok) throw new Error("ไม่สามารถดึงข้อมูลทีมได้");
      const regData = await regResponse.json();
      setRegistration(regData);

      // Fetch players for this registration
      const playersResponse = await fetch(`/api/team-players?registrationId=${registrationId}`);
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        console.log("Fetched players data:", playersData);
        setPlayers(playersData);
      } else {
        console.log("No players found or error:", await playersResponse.text());
        setPlayers([]);
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลทีมได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingData({
      ...editingData,
      [player.id]: {
        name: player.name,
        jerseyNumber: player.jerseyNumber,
        birthYear: player.birthYear
      }
    });
  };

  const cancelEditing = (playerId: number) => {
    setEditingPlayerId(null);
    const newEditingData = { ...editingData };
    delete newEditingData[playerId];
    setEditingData(newEditingData);
  };

  const updateEditingData = (playerId: number, field: string, value: string) => {
    setEditingData({
      ...editingData,
      [playerId]: {
        ...editingData[playerId],
        [field]: value
      }
    });
  };

  const validatePlayerData = (data: {name: string, jerseyNumber: string, birthYear: string}) => {
    if (!data.name.trim()) {
      throw new Error("กรุณากรอกชื่อ-นามสกุล");
    }

    const jerseyNum = parseInt(data.jerseyNumber);
    if (!data.jerseyNumber || isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
      throw new Error("กรุณากรอกเบอร์เสื้อที่ถูกต้อง (1-99)");
    }

    const birthYear = parseInt(data.birthYear);
    if (!data.birthYear || isNaN(birthYear) || birthYear < 2400 || birthYear > 2600) {
      throw new Error("กรุณากรอกปีเกิด (พ.ศ.) ที่ถูกต้อง (2400-2600)");
    }

    // Check if jersey number is already taken by another player
    const duplicatePlayer = players.find(p => 
      p.id !== editingPlayerId && 
      parseInt(p.jerseyNumber) === jerseyNum
    );
    
    if (duplicatePlayer) {
      throw new Error(`เบอร์เสื้อ ${jerseyNum} ถูกใช้แล้วโดย ${duplicatePlayer.name}`);
    }
  };

  const savePlayer = async (playerId: number) => {
    const playerData = editingData[playerId];
    if (!playerData) return;

    try {
      // Validate data
      validatePlayerData(playerData);
      
      setSaving(true);
      console.log("Saving player data:", { playerId, ...playerData });

      const response = await fetch('/api/team-players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerId,
          name: playerData.name.trim(),
          jerseyNumber: playerData.jerseyNumber,
          birthYear: playerData.birthYear,
        }),
      });

      console.log("Update response status:", response.status);
      console.log("Update response headers:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log("Update success response:", responseData);
        
        // Update the player in local state
        setPlayers(prevPlayers => 
          prevPlayers.map(p => 
            p.id === playerId 
              ? { 
                  ...p, 
                  name: playerData.name.trim(),
                  jerseyNumber: playerData.jerseyNumber,
                  birthYear: playerData.birthYear
                }
              : p
          )
        );
        
        // Clear editing state
        setEditingPlayerId(null);
        const newEditingData = { ...editingData };
        delete newEditingData[playerId];
        setEditingData(newEditingData);
        
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "แก้ไขข้อมูลนักเตะเรียบร้อยแล้ว",
          confirmButtonText: "ตกลง",
        });
      } else {
        const errorText = await response.text();
        console.error("Update error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" };
        }
        
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถแก้ไขข้อมูลได้",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error: any) {
      console.error("Error saving player:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถแก้ไขข้อมูลได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = async (player: Player) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: `คุณต้องการลบนักเตะ "${player.name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/team-players?playerId=${player.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove player from local state
          setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== player.id));
          
          Swal.fire({
            icon: "success",
            title: "สำเร็จ",
            text: "ลบนักเตะเรียบร้อยแล้ว",
            confirmButtonText: "ตกลง",
          });
        } else {
          const errorData = await response.json();
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: errorData.error || "ไม่สามารถลบข้อมูลได้",
            confirmButtonText: "ตกลง",
          });
        }
      } catch (error) {
        console.error("Error deleting player:", error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบข้อมูลได้",
          confirmButtonText: "ตกลง",
        });
      }
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    return <div className="container mx-auto p-4 text-center text-red-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  if (!registration) {
    return <div className="container mx-auto p-4">ไม่พบข้อมูลทีม</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">
          รายชื่อนักเตะทีม: {registration.teamName}
        </h1>
      </div>

      {/* Competition Info */}
      <Card className="shadow-md mb-6">
        <CardHeader>
          <CardTitle>ข้อมูลการแข่งขัน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>การแข่งขัน:</strong> {registration?.competition?.title || 'ไม่ระบุ'}</p>
              <p><strong>หมวดหมู่การแข่งขัน:</strong> {registration?.competition?.category || 'ไม่ระบุ'}</p>
              <p><strong>คำอธิบาย:</strong> {registration?.competition?.description || 'ไม่ระบุ'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Info */}
      <Card className="shadow-md mb-6">
        <CardHeader>
          <CardTitle>ข้อมูลทีม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>ชื่อทีม:</strong> {registration.teamName}</p>
              <p><strong>ผู้จัดการทีม:</strong> {registration.managerName}</p>
              <p><strong>เบอร์ติดต่อ:</strong> {registration.contactNumber}</p>
              <p><strong>จำนวนผู้เล่นที่ประกาศ:</strong> {registration.playerCount} คน</p>
              <p><strong>สถานะ:</strong> <span className={`px-2 py-1 rounded text-sm ${
                registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{registration.status}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>รายชื่อนักเตะ ({players.length} คน)</span>
            <Button
              onClick={() => router.push(`/submit-players/${registrationId}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              เพิ่มรายชื่อนักเตะ
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">ยังไม่มีรายชื่อนักเตะ</p>
              <Button
                onClick={() => router.push(`/submit-players/${registrationId}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                เพิ่มรายชื่อนักเตะ
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ลำดับ</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead className="w-32">เบอร์เสื้อ</TableHead>
                  <TableHead className="w-32">ปีเกิด (พ.ศ.)</TableHead>
                  <TableHead className="w-40">วันที่เพิ่ม</TableHead>
                  <TableHead className="w-32">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      {editingPlayerId === player.id ? (
                        <Input
                          value={editingData[player.id]?.name || player.name}
                          onChange={(e) => updateEditingData(player.id, 'name', e.target.value)}
                          className="min-w-48"
                        />
                      ) : (
                        player.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPlayerId === player.id ? (
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          value={editingData[player.id]?.jerseyNumber || player.jerseyNumber}
                          onChange={(e) => updateEditingData(player.id, 'jerseyNumber', e.target.value)}
                          className="w-20"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                          {player.jerseyNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPlayerId === player.id ? (
                        <Input
                          type="number"
                          min="2400"
                          max="2600"
                          value={editingData[player.id]?.birthYear || player.birthYear}
                          onChange={(e) => updateEditingData(player.id, 'birthYear', e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        player.birthYear
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(player.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingPlayerId === player.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => savePlayer(player.id)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100"
                            >
                              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEditing(player.id)}
                              disabled={saving}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(player)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePlayer(player)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}