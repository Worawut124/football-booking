"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import LoadingCrescent from "@/components/ui/loading-crescent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // ใช้ Input component
import Swal from "sweetalert2";

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
    <div className="container mx-auto py-6 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">ชำระเงิน</h2>
      <form onSubmit={handleSubmitOrder} className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">ข้อมูลสินค้า</h3>
          <p className="mt-2">ชื่อสินค้า: {name}</p>
          <p className="mt-1">ราคา: {price} บาท</p>
          <p className="mt-1">สต็อก: {stock}</p>
          <p className="mt-1">หมวดหมู่: {category}</p>
          <div className="mt-2 flex items-center">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="mr-2"
            >
              -
            </Button>
            <Input
              type="number"
              value={quantity || ""} // ป้องกัน NaN โดยใช้ "" หาก quantity เป็น NaN
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                if (value <= stock && value >= 1) setQuantity(value);
              }}
              className="w-16 p-1 border rounded-md text-center"
              min="1"
              max={stock}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleIncrease}
              disabled={quantity >= stock}
              className="ml-2"
            >
              +
            </Button>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">ช่องทางการโอนเงิน</h3>
          <p className="mt-2">ชื่อบัญชี: {accountInfo.accountName}</p>
          <p className="mt-1">ชื่อธนาคาร: {accountInfo.bankName}</p>
          <p className="mt-1 flex items-center justify-between">
            เลขบัญชี: {accountInfo.accountNumber}
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleCopyAccountNumber}
              className="ml-2"
            >
              Copy
            </Button>
          </p>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">เลือกการจัดส่ง</h3>
          <div className="flex items-center space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="deliveryMethod"
                value="bankTransfer"
                checked={deliveryMethod === "bankTransfer"}
                onChange={() => setDeliveryMethod("bankTransfer")}
                className="mr-2"
              />
              โอนผ่านบัญชี
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="deliveryMethod"
                value="cashOnDelivery"
                checked={deliveryMethod === "cashOnDelivery"}
                onChange={() => setDeliveryMethod("cashOnDelivery")}
                className="mr-2"
              />
              เก็บเงินปลายทาง
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700">
            ที่อยู่จัดส่ง ชื่อ-ที่อยู่-เบอร์โทรศัพท์
          </label>
          <Textarea
            id="shipping-address"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="กรุณากรอกที่อยู่จัดส่ง..."
            className="mt-1 w-full p-2 border rounded-md"
            rows={4}
          />
        </div>
        {deliveryMethod === "bankTransfer" && (
          <div className="mb-4">
            <label htmlFor="slip-image" className="block text-sm font-medium text-gray-700">
              อัปโหลดสลิปการโอนเงิน
            </label>
            <input
              id="slip-image"
              type="file"
              accept="image/*"
              onChange={(e) => setSlipImage(e.target.files ? e.target.files[0] : null)}
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
        )}
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
        <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600">
          ส่งคำสั่งซื้อ
        </Button>
      </form>
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