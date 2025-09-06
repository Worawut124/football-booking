"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
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
  const registrationId = params.id ? parseInt(params.id as string) : 0;
  const [players, setPlayers] = useState<Player[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

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
      <Card className="shadow-md mb-6">
        <CardHeader>
          <CardTitle>ข้อมูลการแข่งขันและทีม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>การแข่งขัน:</strong> {registration.competition?.title || "ไม่ระบุ"}</p>
              <p><strong>หมวดหมู่การแข่งขัน:</strong> {registration.competition?.category || "ไม่ระบุ"}</p>
              <p><strong>คำอธิบาย:</strong> {registration.competition?.description || "ไม่มี"}</p>
            </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {player.jerseyNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{player.birthYear}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(player.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
