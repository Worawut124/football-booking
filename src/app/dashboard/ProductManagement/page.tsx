"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Swal from "sweetalert2";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ShoppingCart,
  DollarSign,
  Archive,
  Tag,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Star,
  BarChart3,
  FileText
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  createdAt: Date;
  category: Category | null;
  categoryId: number | null;
  imageData: string | null;
}

interface Category {
  id: number;
  name: string;
  createdAt: Date;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [addFormData, setAddFormData] = useState<{ name: string; price: number; stock: number; categoryId: number | null; imageData: string | null }>({
    name: "",
    price: 0,
    stock: 0,
    categoryId: null,
    imageData: null,
  });
  const [editFormData, setEditFormData] = useState<{ name: string; price: number; stock: number; categoryId: number | null; imageData: string | null }>({
    name: "",
    price: 0,
    stock: 0,
    categoryId: null,
    imageData: null,
  });
  const [addCategoryForm, setAddCategoryForm] = useState({ name: "" });
  const [editCategoryForm, setEditCategoryForm] = useState({ name: "" });
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const itemsPerPage = 8;

  async function fetchProducts() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/products", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data: Product[] = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setError(null);
    } else {
      const errorData = await response.json();
      setError(errorData.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  }

  async function fetchCategories() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/categories", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data: Category[] = await response.json();
      setCategories(data);
      setError(null);
    } else {
      const errorData = await response.json();
      setError(errorData.error || "เกิดข้อผิดพลาดในการดึงหมวดหมู่");
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.categoryId?.toString() === selectedCategory);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, selectedCategory, products]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formDataToSend = new FormData();
    formDataToSend.append("name", addFormData.name);
    formDataToSend.append("price", addFormData.price.toString());
    formDataToSend.append("stock", addFormData.stock.toString());
    if (addFormData.categoryId !== null) formDataToSend.append("categoryId", addFormData.categoryId.toString());
    if (addImageFile) formDataToSend.append("image", addImageFile);

    const response = await fetch("/api/products", {
      method: "POST",
      body: formDataToSend,
    });

    if (response.ok) {
      fetchProducts();
      setAddFormData({ name: "", price: 0, stock: 0, categoryId: null, imageData: null });
      setAddImageFile(null);
      setIsAddProductDialogOpen(false);
      setCurrentPage(1);
      Swal.fire({
        title: "เพิ่มสำเร็จ!",
        text: `สินค้า "${addFormData.name}" ถูกเพิ่มเรียบร้อยแล้ว`,
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } else {
      const errorData = await response.json();
      setError(errorData.error || "เกิดข้อผิดพลาดในการเพิ่ม");
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: errorData.error || "กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!editProduct) return;
    const formDataToSend = new FormData();
    formDataToSend.append("id", editProduct.id.toString());
    formDataToSend.append("name", editFormData.name);
    formDataToSend.append("price", editFormData.price.toString());
    formDataToSend.append("stock", editFormData.stock.toString());
    if (editFormData.categoryId !== null) formDataToSend.append("categoryId", editFormData.categoryId.toString());
    // ส่ง imageData เดิมถ้าไม่มีการอัปโหลดไฟล์ใหม่
    if (!editImageFile && editProduct.imageData) {
      formDataToSend.append("imageData", editProduct.imageData); // ส่ง base64 เดิม
    }
    if (editImageFile) formDataToSend.append("image", editImageFile); // อัปโหลดไฟล์ใหม่ถ้ามี

    const response = await fetch("/api/products", {
      method: "PUT",
      body: formDataToSend,
    });

    if (response.ok) {
      fetchProducts();
      setEditProduct(null);
      setEditFormData({ name: "", price: 0, stock: 0, categoryId: null, imageData: null });
      setEditImageFile(null);
      setCurrentPage(1);
      Swal.fire({
        title: "แก้ไขสำเร็จ!",
        text: `สินค้า "${editFormData.name}" ถูกแก้ไขเรียบร้อยแล้ว`,
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } else {
      const errorData = await response.json();
      setError(errorData.error || "เกิดข้อผิดพลาดในการแก้ไข");
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: errorData.error || "กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const body = JSON.stringify({ name: addCategoryForm.name.trim() });

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body,
    });

    if (response.ok) {
      fetchCategories();
      setAddCategoryForm({ name: "" });
      setIsAddCategoryDialogOpen(false);
      Swal.fire({
        title: "เพิ่มสำเร็จ!",
        text: `หมวดหมู่ "${addCategoryForm.name}" ถูกเพิ่มเรียบร้อยแล้ว`,
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } else {
      const errorData = await response.json();
      setError(errorData.error || "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่");
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: errorData.error || "กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!editCategory) return;
    const body = JSON.stringify({ id: editCategory.id, name: editCategoryForm.name.trim() });

    const response = await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body,
    });

    if (response.ok) {
      fetchCategories();
      setEditCategory(null);
      setEditCategoryForm({ name: "" });
      Swal.fire({
        title: "แก้ไขสำเร็จ!",
        text: `หมวดหมู่ "${editCategoryForm.name}" ถูกแก้ไขเรียบร้อยแล้ว`,
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } else {
      const errorData = await response.json();
      setError(errorData.error || "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่");
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: errorData.error || "กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const token = localStorage.getItem("token");
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "การลบสินค้าจะไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const response = await fetch("/api/products", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id }),
        });
        if (response.ok) {
          fetchProducts();
          setCurrentPage(1);
          Swal.fire("ลบสำเร็จ!", "สินค้าได้ถูกลบเรียบร้อยแล้ว", "success");
        } else {
          const errorData = await response.json();
          setError(errorData.error || "เกิดข้อผิดพลาดในการลบ");
          Swal.fire("เกิดข้อผิดพลาด!", errorData.error || "กรุณาลองใหม่", "error");
        }
      }
    });
  };

  const handleDeleteCategory = async (id: number) => {
    const token = localStorage.getItem("token");
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "การลบหมวดหมู่จะลบสินค้าที่เกี่ยวข้องด้วย!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const response = await fetch("/api/categories", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id }),
        });
        if (response.ok) {
          fetchCategories();
          Swal.fire("ลบสำเร็จ!", "หมวดหมู่ได้ถูกลบเรียบร้อยแล้ว", "success");
        } else {
          const errorData = await response.json();
          setError(errorData.error || "เกิดข้อผิดพลาดในการลบหมวดหมู่");
          Swal.fire("เกิดข้อผิดพลาด!", errorData.error || "กรุณาลองใหม่", "error");
        }
      }
    });
  };

  // คำนวณสินค้าที่แสดงในหน้า
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // จำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Calculate statistics
  const totalProducts = filteredProducts.length;
  const totalValue = filteredProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
  const totalStock = filteredProducts.reduce((sum, product) => sum + product.stock, 0);
  const lowStockProducts = filteredProducts.filter(product => product.stock < 10).length;

  // เปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white rounded-2xl p-8 mb-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">จัดการสินค้า</h1>
              <p className="text-white/90 text-lg">จัดการสินค้าและหมวดหมู่สินค้า</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90">สินค้าทั้งหมด: {totalProducts} รายการ</span>
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <Activity className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
        <CardContent className="p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">{totalProducts}</div>
                <p className="text-sm text-blue-600">สินค้าทั้งหมด</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">฿{totalValue.toLocaleString()}</div>
                <p className="text-sm text-green-600">มูลค่ารวม</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Archive className="h-6 w-6 text-purple-600" />
                  </div>
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-1">{totalStock}</div>
                <p className="text-sm text-purple-600">สต็อกรวม</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 rounded-full p-3">
                    <Star className="h-6 w-6 text-orange-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">{lowStockProducts}</div>
                <p className="text-sm text-orange-600">สต็อกต่ำ</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Add Section */}
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl shadow-lg border border-slate-200 flex-1">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">ตัวกรอง:</label>
              </div>
              
              {/* Search Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">ค้นหา:</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="ค้นหาชื่อสินค้า, หมวดหมู่..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-slate-600 whitespace-nowrap">หมวดหมู่:</label>
                <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full sm:w-48 border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm">
                    <SelectValue placeholder="ทุกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเซ็ต
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-6 py-3">
                    <Plus className="h-5 w-5" />
                    เพิ่มสินค้า
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <div className="bg-green-100 rounded-full p-2">
                        <Plus className="h-6 w-6 text-green-600" />
                      </div>
                      เพิ่มสินค้าใหม่
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="add-name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                          <Package className="h-4 w-4" />
                          ชื่อสินค้า
                        </Label>
                        <Input
                          id="add-name"
                          value={addFormData.name}
                          onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                          className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="ป้อนชื่อสินค้า"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="add-price" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                          <DollarSign className="h-4 w-4" />
                          ราคา (บาท)
                        </Label>
                        <Input
                          id="add-price"
                          type="number"
                          value={addFormData.price}
                          onChange={(e) => setAddFormData({ ...addFormData, price: parseFloat(e.target.value) || 0 })}
                          className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="add-stock" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                          <Archive className="h-4 w-4" />
                          จำนวนสต็อก
                        </Label>
                        <Input
                          id="add-stock"
                          type="number"
                          value={addFormData.stock}
                          onChange={(e) => setAddFormData({ ...addFormData, stock: parseInt(e.target.value) || 0 })}
                          className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="add-categoryId" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                          <Tag className="h-4 w-4" />
                          หมวดหมู่
                        </Label>
                        <Select 
                          value={addFormData.categoryId?.toString() || "none"} 
                          onValueChange={(value) => setAddFormData({ ...addFormData, categoryId: value === "none" ? null : parseInt(value) })}
                        >
                          <SelectTrigger className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500">
                            <SelectValue placeholder="เลือกหมวดหมู่" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">ไม่มีหมวดหมู่</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="add-image" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <ImageIcon className="h-4 w-4" />
                        รูปภาพสินค้า
                      </Label>
                      <Input
                        id="add-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAddImageFile(e.target.files ? e.target.files[0] : null)}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setAddFormData({ name: "", price: 0, stock: 0, categoryId: null, imageData: null });
                          setAddImageFile(null);
                          setIsAddProductDialogOpen(false);
                        }}
                        className="px-6"
                      >
                        ยกเลิก
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มสินค้า
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 px-6 py-3">
                    <Tag className="h-5 w-5" />
                    เพิ่มหมวดหมู่
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <div className="bg-purple-100 rounded-full p-2">
                        <Tag className="h-6 w-6 text-purple-600" />
                      </div>
                      เพิ่มหมวดหมู่ใหม่
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCategory} className="space-y-6">
                    <div>
                      <Label htmlFor="add-categoryName" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Tag className="h-4 w-4" />
                        ชื่อหมวดหมู่
                      </Label>
                      <Input
                        id="add-categoryName"
                        value={addCategoryForm.name}
                        onChange={(e) => setAddCategoryForm({ name: e.target.value })}
                        className="border-2 border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="ป้อนชื่อหมวดหมู่"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setAddCategoryForm({ name: "" });
                          setIsAddCategoryDialogOpen(false);
                        }}
                        className="px-6"
                      >
                        ยกเลิก
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 px-6"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มหมวดหมู่
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Products Table */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Package className="h-6 w-6" />
                รายการสินค้า
                <Badge variant="secondary" className="ml-auto">
                  {filteredProducts.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่พบสินค้า</h3>
                  <p className="text-slate-500">
                    {searchTerm || selectedCategory 
                      ? "ไม่มีสินค้าที่ตรงกับเงื่อนไขการค้นหา" 
                      : "ยังไม่มีสินค้าในระบบ"
                    }
                  </p>
                  {(searchTerm || selectedCategory) && (
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      แสดงสินค้าทั้งหมด
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                    <Table className="min-w-[800px]">
                      <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                        <TableRow className="border-b-2 border-slate-200">
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Package className="h-4 w-4 text-blue-600" />
                              ชื่อสินค้า
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              ราคา
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Archive className="h-4 w-4 text-purple-600" />
                              สต็อก
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Tag className="h-4 w-4 text-orange-600" />
                              หมวดหมู่
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <ImageIcon className="h-4 w-4 text-indigo-600" />
                              รูปภาพ
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar className="h-4 w-4 text-pink-600" />
                              วันที่สร้าง
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-slate-700 p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Edit className="h-4 w-4 text-slate-600" />
                              จัดการ
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentProducts.map((product) => (
                          <TableRow key={product.id} className="hover:bg-blue-50 transition-colors">
                            <TableCell className="text-center p-4 font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell className="text-center p-4">
                              <Badge variant="outline" className="border-green-200 text-green-700 font-semibold">
                                ฿{product.price.toLocaleString()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center p-4">
                              <Badge 
                                variant={product.stock < 10 ? "destructive" : "default"}
                                className={product.stock < 10 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                              >
                                {product.stock} ชิ้น
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center p-4">
                              {product.category ? (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  {product.category.name}
                                </Badge>
                              ) : (
                                <span className="text-slate-500 text-sm">ไม่มี</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center p-4">
                              {product.imageData ? (
                                <div className="flex justify-center">
                                  <img 
                                    src={product.imageData.startsWith('http') ? product.imageData : `data:image/jpeg;base64,${product.imageData}`} 
                                    alt={product.name} 
                                    className="h-16 w-16 object-cover rounded-lg border-2 border-slate-200 shadow-sm" 
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <div className="h-16 w-16 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-slate-400" />
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center p-4 text-slate-600">
                              {format(new Date(product.createdAt), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-center p-4">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditProduct(product);
                                    setEditFormData({
                                      name: product.name,
                                      price: product.price,
                                      stock: product.stock,
                                      categoryId: product.categoryId,
                                      imageData: product.imageData,
                                    });
                                  }}
                                  className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {filteredProducts.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                      <div className="text-slate-600 text-sm">
                        แสดง {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProducts.length)} จาก {filteredProducts.length} รายการ
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ก่อนหน้า
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            variant={currentPage === page ? "default" : "outline"}
                            className={currentPage === page ? "bg-blue-600 text-white" : ""}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Tag className="h-6 w-6" />
                หมวดหมู่สินค้า
                <Badge variant="secondary" className="ml-auto">
                  {categories.length} หมวดหมู่
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Tag className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">ไม่มีหมวดหมู่</h3>
                  <p className="text-slate-500">ยังไม่มีหมวดหมู่สินค้าในระบบ</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-purple-50">
                      <TableRow className="border-b-2 border-slate-200">
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Tag className="h-4 w-4 text-purple-600" />
                            ชื่อหมวดหมู่
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            วันที่สร้าง
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Edit className="h-4 w-4 text-slate-600" />
                            จัดการ
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id} className="hover:bg-purple-50 transition-colors">
                          <TableCell className="text-center p-4 font-medium">
                            {category.name}
                          </TableCell>
                          <TableCell className="text-center p-4 text-slate-600">
                            {format(new Date(category.createdAt), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-center p-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditCategory(category);
                                  setEditCategoryForm({ name: category.name });
                                }}
                                className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Edit Product Dialog */}
      <Dialog open={editProduct !== null} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="bg-yellow-100 rounded-full p-2">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
              แก้ไขสินค้า
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="edit-name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Package className="h-4 w-4" />
                  ชื่อสินค้า
                </Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-price" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="h-4 w-4" />
                  ราคา (บาท)
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                  className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="edit-stock" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Archive className="h-4 w-4" />
                  จำนวนสต็อก
                </Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editFormData.stock}
                  onChange={(e) => setEditFormData({ ...editFormData, stock: parseInt(e.target.value) || 0 })}
                  className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-categoryId" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Tag className="h-4 w-4" />
                  หมวดหมู่
                </Label>
                <Select 
                  value={editFormData.categoryId?.toString() || "none"} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, categoryId: value === "none" ? null : parseInt(value) })}
                >
                  <SelectTrigger className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ไม่มีหมวดหมู่</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-image" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <ImageIcon className="h-4 w-4" />
                รูปภาพสินค้า (ปล่อยว่างเพื่อคงรูปเดิม)
              </Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setEditImageFile(e.target.files ? e.target.files[0] : null)}
                className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditProduct(null);
                  setEditFormData({ name: "", price: 0, stock: 0, categoryId: null, imageData: null });
                  setEditImageFile(null);
                }}
                className="px-6"
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6"
              >
                <Edit className="h-4 w-4 mr-2" />
                บันทึกการแก้ไข
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategory !== null} onOpenChange={(open) => !open && setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="bg-yellow-100 rounded-full p-2">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
              แก้ไขหมวดหมู่
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="space-y-6">
            <div>
              <Label htmlFor="edit-categoryName" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Tag className="h-4 w-4" />
                ชื่อหมวดหมู่
              </Label>
              <Input
                id="edit-categoryName"
                value={editCategoryForm.name}
                onChange={(e) => setEditCategoryForm({ name: e.target.value })}
                className="border-2 border-slate-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditCategory(null);
                  setEditCategoryForm({ name: "" });
                }}
                className="px-6"
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6"
              >
                <Edit className="h-4 w-4 mr-2" />
                บันทึกการแก้ไข
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}