"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  createdAt: Date;
  category: { name: string } | null;
  imageData: string | null;
}

export default function ProductDisplay() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const itemsPerPage = 10;
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      const response = await fetch("/api/products", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data: Product[] = await response.json();
        const normalizedData = data.map((product) => ({
          ...product,
          createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        }));
        setProducts(normalizedData);
        setError(null);
      } else {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า");
      }
    }
    fetchProducts();
  }, []);

  // ดึงรายการหมวดหมู่ที่ไม่ซ้ำกัน
  const uniqueCategories = [
    "ทั้งหมด",
    ...new Set(products.map((product) => product.category?.name || "ไม่มี").filter((name) => name)),
  ];

  // กรองสินค้าตามหมวดหมู่ที่เลือก
  const filteredProducts = selectedCategory === "ทั้งหมด" || !selectedCategory
    ? products
    : products.filter((product) => product.category?.name === selectedCategory || (!product.category && selectedCategory === "ไม่มี"));

  // คำนวณสินค้าที่แสดงในหน้า
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // จำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // เปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto py-6 px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">รายการสินค้า</h2>
      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
      
      {/* ปุ่ม Filter ตามหมวดหมู่ */}
      <div className="mb-4 flex flex-wrap gap-2">
        {uniqueCategories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => {
              setSelectedCategory(category === selectedCategory ? null : category);
              setCurrentPage(1); // รีเซ็ตหน้าเป็น 1 เมื่อเปลี่ยนหมวดหมู่
            }}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentProducts.length > 0 ? (
          currentProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {product.imageData && (
                  <img 
                    src={product.imageData.startsWith('http') ? product.imageData : `data:image/jpeg;base64,${product.imageData}`} 
                    alt={product.name} 
                    className="w-full h-68 object-cover mb-2" 
                  />
                )}
                <p className="text-muted-foreground">ราคา: {product.price} บาท</p>
                <p className="text-muted-foreground">สต็อก: {product.stock}</p>
                <p className="text-sm text-gray-500">
                  หมวดหมู่: {product.category?.name || "ไม่มี"}
                </p>
                <p className="text-sm text-gray-500">
                  วันที่เพิ่ม: {format(new Date(product.createdAt), "dd/MM/yyyy")}
                </p>
              </CardContent>
              <CardFooter>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    variant="outline"
                    disabled={product.stock === 0}
                    onClick={() =>
                      addItem(
                        {
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          imageData: product.imageData,
                          stock: product.stock,
                          categoryName: product.category?.name || null,
                        },
                        1
                      )
                    }
                  >
                    หยิบใส่ตะกร้า
                  </Button>
                  <Link
                    href={{
                      pathname: "/payment-product",
                      query: {
                        productId: product.id,
                        name: encodeURIComponent(product.name),
                        price: product.price,
                        stock: product.stock,
                        category: encodeURIComponent(product.category?.name || "ไม่มี"),
                      },
                    }}
                    passHref
                  >
                    <Button className="w-full" disabled={product.stock === 0}>
                      ซื้อทันที
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center">ไม่มีสินค้า</div>
        )}
      </div>
      {filteredProducts.length > itemsPerPage && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ก่อนหน้า
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              onClick={() => handlePageChange(page)}
              variant={currentPage === page ? "default" : "outline"}
            >
              {page}
            </Button>
          ))}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}