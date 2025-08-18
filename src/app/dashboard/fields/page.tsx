"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function FieldsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState<any[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLocation, setNewFieldLocation] = useState("");
  const [editField, setEditField] = useState<{ id: number; name: string; location: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
      router.push("/booking");
      return;
    }

    const fetchFields = async () => {
      const response = await fetch("/api/fields");
      const data = await response.json();
      setFields(data);
    };
    fetchFields();
  }, [status, router, session]);

  const handleAddField = async () => {
    const response = await fetch("/api/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFieldName, location: newFieldLocation }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "เพิ่มสนามสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const newField = await response.json();
      setFields([...fields, newField]);
      setNewFieldName("");
      setNewFieldLocation("");
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถเพิ่มสนามได้",
      });
    }
  };

  const handleEditField = async () => {
    if (!editField) return;

    const response = await fetch("/api/fields", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editField.id,
        name: editField.name,
        location: editField.location,
      }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "แก้ไขสนามสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      const updatedField = await response.json();
      setFields(fields.map((field) => (field.id === updatedField.id ? updatedField : field)));
      setEditField(null);
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถแก้ไขสนามได้",
      });
    }
  };

  const handleDeleteField = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบสนามนี้จริงๆ ใช่ไหม?",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบ",
      cancelButtonText: "ไม่, กลับ",
    });

    if (!result.isConfirmed) return;

    const response = await fetch("/api/fields", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "ลบสนามสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });
      setFields(fields.filter((field) => field.id !== id));
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorData.error || "ไม่สามารถลบสนามได้",
      });
    }
  };

  if (status === "loading") {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">จัดการสนาม</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex gap-4 mb-6">
          <Input
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="ชื่อสนามใหม่"
            className="w-full max-w-xs"
          />
          <Input
            value={newFieldLocation}
            onChange={(e) => setNewFieldLocation(e.target.value)}
            placeholder="สถานที่"
            className="w-full max-w-xs"
          />
          <Button onClick={handleAddField} className="bg-blue-600 hover:bg-blue-700 text-white">
            เพิ่มสนาม
          </Button>
        </div>
        <ul className="space-y-4">
          {fields.map((field) => (
            <li key={field.id} className="flex justify-between items-center">
              <span>
                {field.name} ({field.location})
              </span>
              <div className="flex gap-2">
                <Dialog open={editField?.id === field.id} onOpenChange={(open) => !open && setEditField(null)}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setEditField({ id: field.id, name: field.name, location: field.location })}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      แก้ไข
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>แก้ไขสนาม</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        value={editField?.name || ""}
                        onChange={(e) => setEditField({ ...editField!, name: e.target.value })}
                        placeholder="ชื่อสนาม"
                      />
                      <Input
                        value={editField?.location || ""}
                        onChange={(e) => setEditField({ ...editField!, location: e.target.value })}
                        placeholder="สถานที่"
                      />
                      <Button
                        onClick={handleEditField}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        บันทึก
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={() => handleDeleteField(field.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  ลบ
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}