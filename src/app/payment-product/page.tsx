"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import LoadingCrescent from "@/components/ui/loading-crescent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Swal from "sweetalert2";
import {
  ShoppingCart,
  CreditCard,
  Package,
  MapPin,
  Copy,
  Plus,
  Minus,
  Truck,
  Banknote,
  Upload,
  CheckCircle,
  Star,
  Sparkles,
  Tag,
  Calculator
} from "lucide-react";

function PageInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") ? parseInt(searchParams.get("productId")!) : 0;
  const name = searchParams.get("name") ? decodeURIComponent(searchParams.get("name")!) : "N/A";
  const price = searchParams.get("price") ? parseFloat(searchParams.get("price")!) : 0;
  const stock = searchParams.get("stock") ? parseInt(searchParams.get("stock")!) : 0;
  const category = searchParams.get("category") ? decodeURIComponent(searchParams.get("category")!) : "ไม่มี";

  const [shippingAddress, setShippingAddress] = useState("");
  const [slipImage, setSlipImage] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [accountInfo, setAccountInfo] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState("bankTransfer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/payment-config");
        if (response.ok) {
          const data = await response.json();
          setAccountInfo({
            accountName: data.accountName || "",
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
          });
        } else {
          console.error("Failed to fetch account info");
        }
      } catch (error) {
        console.error("Error fetching account info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountInfo();
  }, []);

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < stock) setQuantity(quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleCopyAccountNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accountInfo.accountNumber).catch((err) => {
      console.error("Failed to copy account number:", err);
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setErrorMessage("กรุณากรอกที่อยู่จัดส่งก่อนส่งคำสั่งซื้อ");
      return;
    }
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("productId", productId.toString());
    formData.append("name", name);
    formData.append("price", price.toString());
    formData.append("stock", quantity.toString());
    formData.append("category", category);
    formData.append("shippingAddress", shippingAddress);
    formData.append("orderDate", new Date().toISOString());
    formData.append("deliveryMethod", deliveryMethod);
    if (slipImage) formData.append("slipImage", slipImage);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "สำเร็จ!",
          text: "คำสั่งซื้อถูกบันทึกเรียบร้อยแล้ว!",
          confirmButtonText: "ตกลง",
        });
        setErrorMessage(null);
        setShippingAddress("");
        setSlipImage(null);
        setQuantity(1);
        setDeliveryMethod("bankTransfer");
      } else {
        const errorData = await response.json();
        setErrorMessage(`เกิดข้อผิดพลาด: ${errorData.message || "กรุณาลองใหม่"}`);
      }
    } catch (error) {
      setErrorMessage("เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ: " + (error as Error).message);
      console.error("Error saving order:", error);
    }
  };

  if (loading) {
    return <LoadingCrescent text="กำลังโหลดการตั้งค่าชำระเงิน..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-2xl">
                <ShoppingCart className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                ชำระเงิน
              </h1>
              <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
            </div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
              🛒 ดำเนินการสั่งซื้อสินค้าและชำระเงิน 💳
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmitOrder} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Product Info Card */}
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-green-700">
                    <Package className="h-6 w-6" />
                    ข้อมูลสินค้า
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xl font-bold text-gray-800">{name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        ฿{price.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <Tag className="h-3 w-3 mr-1" />
                        {category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">สต็อกคงเหลือ:</span>
                      <span className="font-semibold text-blue-600">{stock} ชิ้น</span>
                    </div>
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">จำนวน</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleDecrease}
                        disabled={quantity <= 1}
                        className="h-10 w-10 p-0 hover:bg-green-50 hover:border-green-300"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          if (value <= stock && value >= 1) setQuantity(value);
                        }}
                        className="w-20 text-center font-semibold"
                        min="1"
                        max={stock}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleIncrease}
                        disabled={quantity >= stock}
                        className="h-10 w-10 p-0 hover:bg-green-50 hover:border-green-300"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Total Price */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-700">ราคารวม</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        ฿{(price * quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info Card */}
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <CreditCard className="h-6 w-6" />
                    ข้อมูลการโอนเงิน
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="text-sm text-gray-600">ชื่อบัญชี</span>
                        <p className="font-semibold">{accountInfo.accountName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      <div>
                        <span className="text-sm text-gray-600">ธนาคาร</span>
                        <p className="font-semibold">{accountInfo.bankName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-purple-500" />
                        <div>
                          <span className="text-sm text-gray-600">เลขบัญชี</span>
                          <p className="font-mono font-semibold">{accountInfo.accountNumber}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleCopyAccountNumber}
                        className="hover:bg-green-50 hover:border-green-300"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Delivery & Form */}
            <div className="space-y-6">
              {/* Delivery Method Card */}
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-purple-700">
                    <Truck className="h-6 w-6" />
                    วิธีการจัดส่ง
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="bankTransfer"
                        checked={deliveryMethod === "bankTransfer"}
                        onChange={() => setDeliveryMethod("bankTransfer")}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${deliveryMethod === "bankTransfer" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                        {deliveryMethod === "bankTransfer" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-green-500" />
                        <span className="font-medium">โอนผ่านบัญชีธนาคาร</span>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="cashOnDelivery"
                        checked={deliveryMethod === "cashOnDelivery"}
                        onChange={() => setDeliveryMethod("cashOnDelivery")}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${deliveryMethod === "cashOnDelivery" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                        {deliveryMethod === "cashOnDelivery" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">เก็บเงินปลายทาง</span>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address Card */}
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-orange-700">
                    <MapPin className="h-6 w-6" />
                    ที่อยู่จัดส่ง
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Textarea
                    id="shipping-address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="กรุณากรอกที่อยู่จัดส่งพร้อมชื่อ-นามสกุล และเบอร์โทรศัพท์..."
                    className="w-full resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Upload Slip Card */}
              {deliveryMethod === "bankTransfer" && (
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center gap-3 text-cyan-700">
                      <Upload className="h-6 w-6" />
                      อัปโหลดสลิปการโอน
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <input
                        id="slip-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSlipImage(e.target.files ? e.target.files[0] : null)}
                        className="hidden"
                      />
                      <label htmlFor="slip-image" className="cursor-pointer">
                        <span className="text-sm text-gray-600">
                          คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                        </span>
                        <br />
                        <span className="text-xs text-gray-500">
                          รองรับไฟล์ JPG, PNG, GIF
                        </span>
                      </label>
                      {slipImage && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500 inline mr-2" />
                          <span className="text-sm text-green-700">
                            ไฟล์ที่เลือก: {slipImage.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                ส่งคำสั่งซื้อ
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">กำลังโหลด...</div>}>
      <PageInner />
    </Suspense>
  );
}