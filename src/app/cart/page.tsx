"use client";

import { useCart } from "@/components/CartContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useState } from "react";

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
    <div className="container mx-auto py-6 px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-6">ตะกร้าสินค้า</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!items.length ? (
        <Card>
          <CardContent className="py-6">ตะกร้าว่างเปล่า <Link href="/Products" className="text-blue-600 underline">ไปเลือกซื้อสินค้า</Link></CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-start gap-4 py-4 flex-col sm:flex-row">
                  {item.imageData && (
                    <img
                      src={item.imageData.startsWith("http") ? item.imageData : `data:image/jpeg;base64,${item.imageData}`}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded self-start"
                    />
                  )}
                  <div className="flex-1 w-full">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-600">ราคา: {item.price} บาท</div>
                    <div className="text-sm text-gray-600">คงเหลือ: {item.stock}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} variant="outline">-</Button>
                      <Input
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 1)}
                        className="w-20 text-center"
                        type="number"
                        min={1}
                        max={item.stock}
                      />
                      <Button onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))} variant="outline">+</Button>
                      <Button onClick={() => removeItem(item.id)} variant="destructive" className="ml-2">ลบ</Button>
                    </div>
                  </div>
                  <div className="font-semibold sm:self-center">{item.price * item.quantity} บาท</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>สรุปคำสั่งซื้อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span>จำนวนสินค้า</span><span>{totalQuantity} ชิ้น</span></div>
                <div className="flex justify-between font-semibold"><span>ราคารวม</span><span>{totalPrice} บาท</span></div>
                <div>
                  <label className="block text-sm mb-1">ที่อยู่จัดส่ง</label>
                  <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="ที่อยู่จัดส่ง" rows={4} />
                </div>
                <div>
                  <label className="block text-sm mb-1">วิธีจัดส่ง/ชำระเงิน</label>
                  <select className="border rounded px-3 py-2 w-full" value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                    <option value="bankTransfer">โอนผ่านธนาคาร</option>
                    <option value="cash">เงินสด</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">แนบสลิป (ถ้ามี)</label>
                  <Input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={clearCart} disabled={loading}>ล้างตะกร้า</Button>
                <Button className="ml-auto" onClick={handleCheckout} disabled={loading || !items.length}>ชำระเงิน</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

