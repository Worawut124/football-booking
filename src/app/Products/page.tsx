"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import {
  ShoppingCart,
  Zap,
  Package,
  Star,
  Filter,
  Grid3X3,
  Heart,
  Eye,
  ShoppingBag,
  Sparkles,
  Tag,
  Calendar,
  TrendingUp,
  Award
} from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 shadow-2xl">
                <ShoppingBag className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                รายการสินค้า
              </h1>
              <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
            </div>
            <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto mb-6 leading-relaxed">
              🛍️ สินค้าคุณภาพสำหรับนักกีฬา ราคาดี จัดส่งรวดเร็ว 🏆
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Award className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">คุณภาพดี</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-blue-300" />
                <span className="text-sm font-medium">จัดส่งรวดเร็ว</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-300" />
                <span className="text-sm font-medium">ราคายุติธรรม</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Package className="h-5 w-5" />
              {error}
            </div>
          </div>
        )}
        
        {/* Filter Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 px-6 py-3 rounded-full mb-4">
              <Filter className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-semibold">กรองตามหมวดหมู่</span>
              <Filter className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {uniqueCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`transition-all duration-200 ${
                  selectedCategory === category 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg' 
                    : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                }`}
                onClick={() => {
                  setSelectedCategory(category === selectedCategory ? null : category);
                  setCurrentPage(1);
                }}
              >
                <Tag className="h-4 w-4 mr-2" />
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.length > 0 ? (
            currentProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden shadow-lg border-0 bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  {product.imageData ? (
                    <img 
                      src={product.imageData.startsWith('http') ? product.imageData : `data:image/jpeg;base64,${product.imageData}`} 
                      alt={product.name} 
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    {product.stock === 0 ? (
                      <Badge className="bg-red-500 text-white border-0 shadow-lg">
                        หมดสต็อก
                      </Badge>
                    ) : product.stock <= 5 ? (
                      <Badge className="bg-orange-500 text-white border-0 shadow-lg">
                        เหลือน้อย
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white border-0 shadow-lg">
                        พร้อม
                      </Badge>
                    )}
                  </div>
                  
                  {/* Wishlist Button */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" variant="secondary" className="rounded-full p-2 bg-white/90 hover:bg-white">
                      <Heart className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">
                      ราคา{product.price.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">สต็อก:</span>
                    <span className={product.stock === 0 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                      {product.stock === 0 ? 'หมดแล้ว' : `${product.stock} ชิ้น`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Tag className="h-4 w-4 text-green-500" />
                    <span className="font-medium">หมวดหมู่:</span>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      {product.category?.name || "ไม่ระบุ"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>เพิ่มเมื่อ: {format(new Date(product.createdAt), "dd/MM/yyyy")}</span>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  {product.stock === 0 ? (
                    <Button 
                      className="w-full bg-gray-400 hover:bg-gray-500 cursor-not-allowed" 
                      disabled={true}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      สินค้าหมด
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Button
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
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
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        ตะกร้า
                      </Button>
                      <Link
                        href={{
                          pathname: "/payment-product",
                          query: {
                            productId: product.id,
                            name: encodeURIComponent(product.name),
                            price: product.price,
                            stock: product.stock,
                            category: encodeURIComponent(product.category?.name || "ไม่ระบุ"),
                          },
                        }}
                        passHref
                      >
                        <Button 
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          ซื้อทันที
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่มีสินค้าในหมวดหมู่นี้</h3>
              <p className="text-gray-500">ลองเลือกหมวดหมู่อื่น หรือกลับมาใหม่ภายหลัง</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {filteredProducts.length > itemsPerPage && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg p-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="ghost"
                className="hover:bg-green-50"
              >
                ก่อนหน้า
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  variant={currentPage === page ? "default" : "ghost"}
                  className={currentPage === page 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                    : 'hover:bg-green-50'
                  }
                >
                  {page}
                </Button>
              ))}
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="ghost"
                className="hover:bg-green-50"
              >
                ถัดไป
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}