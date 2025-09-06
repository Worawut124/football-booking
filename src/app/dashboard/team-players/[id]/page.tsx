"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
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

  const [registration, setRegistration] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    jerseyNumber: "",
    birthYear: ""
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
        setPlayers(playersData);
      } else {
        // If no players found, set empty array
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

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      birthYear: player.birthYear
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
      const response = await fetch('/api/team-players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: editingPlayer.id,
          name: editForm.name,
          jerseyNumber: editForm.jerseyNumber,
          birthYear: editForm.birthYear,
        }),
      });

      if (response.ok) {
        await fetchTeamData(); // Refresh the data
        setIsEditDialogOpen(false);
        setEditingPlayer(null);
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "แก้ไขข้อมูลนักเตะเรียบร้อยแล้ว",
          confirmButtonText: "ตกลง",
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถแก้ไขข้อมูลได้",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      console.error("Error updating player:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถแก้ไขข้อมูลได้",
        confirmButtonText: "ตกลง",
      });
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
          await fetchTeamData(); // Refresh the data
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
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
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
      <Card className="shadow-md">
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
                    <TableCell>{player.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                        {player.jerseyNumber}
                      </div>
                    </TableCell>
                    <TableCell>{player.birthYear}</TableCell>
                    <TableCell>
                      {new Date(player.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPlayer(player)}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลนักเตะ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                ชื่อ-นามสกุล
              </label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="jerseyNumber" className="text-right">
                เบอร์เสื้อ
              </label>
              <Input
                id="jerseyNumber"
                type="number"
                value={editForm.jerseyNumber}
                onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="birthYear" className="text-right">
                ปีเกิด (พ.ศ.)
              </label>
              <Input
                id="birthYear"
                type="number"
                value={editForm.birthYear}
                onChange={(e) => setEditForm({ ...editForm, birthYear: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleUpdatePlayer}>
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
