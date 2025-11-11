"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Swal from "sweetalert2";
import { generatePromptPayQR } from "@/lib/promptpay";

interface PaymentConfig {
  id: number;
  qrCode: string;
  pricePerHour: number;
  pricePerHalfHour: number;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  promptPayId?: string | null;
  depositAmount: number;
}

export default function PaymentConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [formData, setFormData] = useState({
    pricePerHour: 0,
    pricePerHalfHour: 0,
    qrCodeFile: null as File | null,
    accountName: "",
    bankName: "",
    accountNumber: "",
    promptPayId: "",
    depositAmount: 100,
  });
  const [loading, setLoading] = useState(true);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session) {
      if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
        router.push("/");
        return;
      }

      const fetchConfig = async () => {
        setLoading(true);
        try {
          const response = await fetch("/api/payment-config");
          if (response.ok) {
            const data = await response.json();
            setPaymentConfig(data);
            setFormData({
              pricePerHour: data.pricePerHour,
              pricePerHalfHour: data.pricePerHalfHour,
              qrCodeFile: null,
              accountName: data.accountName || "",
              bankName: data.bankName || "",
              accountNumber: data.accountNumber || "",
              promptPayId: data.promptPayId || "",
              depositAmount: typeof data.depositAmount === 'number' ? data.depositAmount : 100,
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: "ไม่สามารถดึงข้อมูลการชำระเงินได้",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถดึงข้อมูลการชำระเงินได้",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchConfig();
    }
  }, [status, session, router]);

  const handleSubmitPriceAndQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("pricePerHour", formData.pricePerHour.toString());
      data.append("pricePerHalfHour", formData.pricePerHalfHour.toString());
      if (formData.qrCodeFile) {
        data.append("qrCode", formData.qrCodeFile);
      }
      data.append("accountName", formData.accountName || "");
      data.append("bankName", formData.bankName || "");
      data.append("accountNumber", formData.accountNumber || "");
      data.append("promptPayId", formData.promptPayId || "");
      data.append("depositAmount", String(formData.depositAmount ?? 100));

      const response = await fetch("/api/payment-config", {
        method: "PUT",
        body: data,
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setPaymentConfig(updatedConfig);
        setFormData({
          ...formData,
          pricePerHour: updatedConfig.pricePerHour,
          pricePerHalfHour: updatedConfig.pricePerHalfHour,
          qrCodeFile: null,
          accountName: updatedConfig.accountName || "",
          bankName: updatedConfig.bankName || "",
          accountNumber: updatedConfig.accountNumber || "",
          promptPayId: updatedConfig.promptPayId || "",
          depositAmount: typeof updatedConfig.depositAmount === 'number' ? updatedConfig.depositAmount : formData.depositAmount,
        });
        Swal.fire({
          icon: "success",
          title: "อัพเดทการตั้งค่าราคาและ QR Code สำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถอัพเดทการตั้งค่าราคาและ QR Code ได้",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัพเดทการตั้งค่าราคาและ QR Code ได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("pricePerHour", formData.pricePerHour.toString());
      data.append("pricePerHalfHour", formData.pricePerHalfHour.toString());
      if (formData.qrCodeFile) {
        data.append("qrCode", formData.qrCodeFile);
      }
      data.append("accountName", formData.accountName || "");
      data.append("bankName", formData.bankName || "");
      data.append("accountNumber", formData.accountNumber || "");

      const response = await fetch("/api/payment-config", {
        method: "PUT",
        body: data,
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setPaymentConfig(updatedConfig);
        setFormData({
          ...formData,
          pricePerHour: updatedConfig.pricePerHour,
          pricePerHalfHour: updatedConfig.pricePerHalfHour,
          qrCodeFile: null,
          accountName: updatedConfig.accountName || "",
          bankName: updatedConfig.bankName || "",
          accountNumber: updatedConfig.accountNumber || "",
          promptPayId: updatedConfig.promptPayId || "",
          depositAmount: typeof updatedConfig.depositAmount === 'number' ? updatedConfig.depositAmount : formData.depositAmount,
        });
        Swal.fire({
          icon: "success",
          title: "อัพเดทข้อมูลบัญชีสำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorData.error || "ไม่สามารถอัพเดทข้อมูลบัญชีได้",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอัพเดทข้อมูลบัญชีได้",
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="container mx-auto p-4">กำลังโหลด...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* การ์ดตั้งค่าราคา */}
        <Card className="w-full sm:w-1/2">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">การตั้งค่าราคาและ QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPriceAndQR} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pricePerHour">ราคาต่อชั่วโมง (บาท)</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    min="1"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerHour: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerHalfHour">ราคาต่อ 30 นาที (บาท)</Label>
                  <Input
                    id="pricePerHalfHour"
                    type="number"
                    min="1"
                    value={formData.pricePerHalfHour}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerHalfHour: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="depositAmount">ยอดมัดจำ (บาท)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="1"
                    value={formData.depositAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, depositAmount: parseInt(e.target.value || '0') })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="promptPayId">PromptPay ID</Label>
                  <Input
                    id="promptPayId"
                    type="text"
                    placeholder="เช่น เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน"
                    value={formData.promptPayId}
                    onChange={(e) => setFormData({ ...formData, promptPayId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="qrCode">QR Code ปัจจุบัน</Label>
                  {paymentConfig?.qrCode && paymentConfig.qrCode !== "/qrcode-placeholder.png" && (
                    <img
                      src={paymentConfig.qrCode}
                      alt="QR Code"
                      className="w-40 h-40 mx-auto mt-2 rounded-md"
                      onError={(e) => {
                        console.error("Failed to load QR Code image:", paymentConfig.qrCode);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  {/* PromptPay Live Preview */}
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={async () => {
                          if (!formData.promptPayId || !formData.depositAmount) {
                            Swal.fire({
                              icon: "warning",
                              title: "กรุณากรอก PromptPay ID และยอดมัดจำ",
                            });
                            return;
                          }
                          try {
                            setPreviewLoading(true);
                            const url = await generatePromptPayQR(formData.promptPayId, formData.depositAmount);
                            setQrPreview(url);
                          } catch (err) {
                            Swal.fire({ icon: "error", title: "สร้าง QR ไม่สำเร็จ" });
                          } finally {
                            setPreviewLoading(false);
                          }
                        }}
                        disabled={previewLoading}
                      >
                        {previewLoading ? "กำลังสร้าง QR..." : "พรีวิว PromptPay QR"}
                      </Button>
                      {qrPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => setQrPreview(null)}
                        >
                          ล้างพรีวิว
                        </Button>
                      )}
                    </div>
                    {qrPreview && (
                      <img src={qrPreview} alt="PromptPay QR Preview" className="w-40 h-40 mx-auto rounded-md" />
                    )}
                  </div>
                  <Label htmlFor="qrCodeFile" className="block mt-2">
                    อัปโหลด QR Code ใหม่
                  </Label>
                  <Input
                    id="qrCodeFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({ ...formData, qrCodeFile: e.target.files?.[0] || null })
                    }
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                disabled={loading}
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* การ์ดข้อมูลบัญชี */}
        <Card className="w-full sm:w-1/2">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">ข้อมูลบัญชี</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAccount} className="space-y-4">
              <div>
                <Label htmlFor="accountName">ชื่อบัญชี</Label>
                <Input
                  id="accountName"
                  type="text"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="bankName">ชื่อธนาคาร</Label>
                <Input
                  id="bankName"
                  type="text"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">เลขบัญชี</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                disabled={loading}
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
