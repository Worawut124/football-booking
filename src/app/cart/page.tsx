"use client";

import { useCart } from "@/components/CartContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Upload,
  CheckCircle,
  Star,
  Sparkles,
  Calculator,
  ShoppingBag,
  ArrowRight,
  Tag,
  Banknote
} from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalQuantity } = useCart();
  const [shippingAddress, setShippingAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("bankTransfer");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!items.length) return;
    if (!shippingAddress.trim()) {
      setError("กรุณากรอกที่อยู่จัดส่ง");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      for (const item of items) {
        const form = new FormData();
        form.append("productId", String(item.id));
        form.append("name", item.name);
        form.append("price", String(item.price));
        form.append("stock", String(item.quantity));
        form.append("category", item.categoryName || "ไม่มี");
        form.append("shippingAddress", shippingAddress);
        form.append("orderDate", new Date().toISOString());
        form.append("deliveryMethod", deliveryMethod);
        if (slipFile) form.append("slipImage", slipFile);

        const res = await fetch("/api/orders", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "ไม่สามารถสร้างคำสั่งซื้อได้");
        }
      }
      clearCart();
      alert("สั่งซื้อสำเร็จ");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

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
                ตะกร้าสินค้า
              </h1>
              <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
            </div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
              🛒 ตรวจสอบสินค้าและดำเนินการสั่งซื้อ 🎯
            </p>
            {totalQuantity > 0 && (
              <div className="mt-6">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-lg">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {totalQuantity} รายการ • ฿{totalPrice.toLocaleString()}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {error}
            </div>
          </div>
        )}

        {!items.length ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">ตะกร้าสินค้าว่างเปล่า</h3>
            <p className="text-gray-500 mb-6">ยังไม่มีสินค้าในตะกร้า เริ่มเลือกซื้อสินค้าได้เลย</p>
            <Link href="/Products">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200">
                <ShoppingBag className="h-5 w-5 mr-2" />
                เลือกซื้อสินค้า
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">รายการสินค้า</h2>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {totalQuantity} รายการ
                </Badge>
              </div>
              
              {items.map((item) => (
                <Card key={item.id} className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="relative">
                        {item.imageData ? (
                          <img
                            src={item.imageData.startsWith("http") ? item.imageData : `data:image/jpeg;base64,${item.imageData}`}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold text-green-600">
                            ฿{item.price.toLocaleString()}
                          </span>
                          {item.categoryName && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              <Tag className="h-3 w-3 mr-1" />
                              {item.categoryName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-4 w-4 text-blue-500" />
                          <span>สต็อกคงเหลือ: {item.stock} ชิ้น</span>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 mt-4">
                          <span className="text-sm font-medium text-gray-700">จำนวน:</span>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 1)}
                              className="w-16 text-center font-semibold"
                              type="number"
                              min={1}
                              max={item.stock}
                            />
                            <Button
                              onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            onClick={() => removeItem(item.id)}
                            variant="destructive"
                            size="sm"
                            className="ml-auto hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            ลบ
                          </Button>
                        </div>
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-right sm:self-start">
                        <div className="text-sm text-gray-500">รวม</div>
                        <div className="text-xl font-bold text-green-600">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="shadow-xl border-0 bg-white sticky top-4">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-green-700">
                    <Calculator className="h-6 w-6" />
                    สรุปคำสั่งซื้อ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">จำนวนสินค้า</span>
                      <span className="font-semibold">{totalQuantity} ชิ้น</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">ราคารวมทั้งสิ้น</span>
                        <span className="text-2xl font-bold text-green-600">
                          ฿{totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
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
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="กรุณากรอกที่อยู่จัดส่งพร้อมชื่อ-นามสกุล และเบอร์โทรศัพท์..."
                    className="w-full resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={4}
                  />
                </CardContent>
              </Card>
              
              {/* Payment Method Card */}
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <CreditCard className="h-6 w-6" />
                    วิธีการชำระเงิน
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="bankTransfer"
                        checked={deliveryMethod === "bankTransfer"}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${deliveryMethod === "bankTransfer" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                        {deliveryMethod === "bankTransfer" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-green-500" />
                        <span className="font-medium">โอนผ่านธนาคาร</span>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="cash"
                        checked={deliveryMethod === "cash"}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${deliveryMethod === "cash" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                        {deliveryMethod === "cash" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">เก็บเงินปลายทาง</span>
                      </div>
                    </label>
                  </div>
                  
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="slip-upload"
                    />
                    <label htmlFor="slip-upload" className="cursor-pointer">
                      <span className="text-sm text-gray-600">
                        แนบสลิปการโอนเงิน (ถ้ามี)
                      </span>
                      <br />
                      <span className="text-xs text-gray-500">
                        คลิกเพื่อเลือกไฟล์
                      </span>
                    </label>
                    {slipFile && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500 inline mr-2" />
                        <span className="text-sm text-green-700">
                          {slipFile.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 space-y-3">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    disabled={loading}
                    className="w-full hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    ล้างตะกร้า
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={loading || !items.length}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {loading ? "กำลังดำเนินการ..." : "ชำระเงิน"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

