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
import { format } from "date-fns";
import Swal from "sweetalert2";

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
  const itemsPerPage = 5;

  async function fetchProducts() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/products", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data: Product[] = await response.json();
      setProducts(data);
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
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

  // จำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // เปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto py-6 px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-4 text-center sm:text-left">จัดการสินค้า</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* ฟอร์มเพิ่มสินค้า */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-4">เพิ่มสินค้า</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้า</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="add-name">ชื่อสินค้า</Label>
              <Input
                id="add-name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                className="sm:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="add-price">ราคา</Label>
              <Input
                id="add-price"
                type="number"
                value={addFormData.price}
                onChange={(e) => setAddFormData({ ...addFormData, price: parseFloat(e.target.value) || 0 })}
                className="sm:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="add-stock">สต็อก</Label>
              <Input
                id="add-stock"
                type="number"
                value={addFormData.stock}
                onChange={(e) => setAddFormData({ ...addFormData, stock: parseInt(e.target.value) || 0 })}
                className="sm:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="add-categoryId">หมวดหมู่</Label>
              <select
                id="add-categoryId"
                value={addFormData.categoryId === null ? "" : addFormData.categoryId}
                onChange={(e) => setAddFormData({ ...addFormData, categoryId: e.target.value === "" ? null : parseInt(e.target.value) })}
                className="sm:col-span-3 p-2 border rounded"
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="add-image">รูปภาพ</Label>
              <Input
                id="add-image"
                type="file"
                accept="image/*"
                onChange={(e) => setAddImageFile(e.target.files ? e.target.files[0] : null)}
                className="sm:col-span-3"
              />
            </div>
            <Button type="submit">เพิ่ม</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ฟอร์มแก้ไขสินค้า */}
      <Dialog open={editProduct !== null} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขสินค้า</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-name">ชื่อสินค้า</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="sm:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-price">ราคา</Label>
              <Input
                id="edit-price"
                type="number"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                className="sm:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-stock">สต็อก</Label>
              <Input
                id="edit-stock"
                type="number"
                value={editFormData.stock}
                onChange={(e) => setEditFormData({ ...editFormData, stock: parseInt(e.target.value) || 0 })}
                className="sm:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-categoryId">หมวดหมู่</Label>
              <select
                id="edit-categoryId"
                value={editFormData.categoryId === null ? "" : editFormData.categoryId}
                onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value === "" ? null : parseInt(e.target.value) })}
                className="sm:col-span-3 p-2 border rounded"
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-image">รูปภาพ (ปล่อยว่างเพื่อคงรูปเดิม)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setEditImageFile(e.target.files ? e.target.files[0] : null)}
                className="sm:col-span-3"
              />
            </div>
            <Button type="submit">บันทึก</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ฟอร์มเพิ่มหมวดหมู่ */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-4">เพิ่มหมวดหมู่</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มหมวดหมู่</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-categoryName">ชื่อหมวดหมู่</Label>
              <Input
                id="add-categoryName"
                value={addCategoryForm.name}
                onChange={(e) => setAddCategoryForm({ name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <Button type="submit">เพิ่ม</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ฟอร์มแก้ไขหมวดหมู่ */}
      <Dialog open={editCategory !== null} onOpenChange={(open) => !open && setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขหมวดหมู่</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-categoryName">ชื่อหมวดหมู่</Label>
              <Input
                id="edit-categoryName"
                value={editCategoryForm.name}
                onChange={(e) => setEditCategoryForm({ name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <Button type="submit">บันทึก</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อสินค้า</TableHead>
              <TableHead>ราคา</TableHead>
              <TableHead>สต็อก</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead>รูปภาพ</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead>จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="min-w-[140px]">{product.name}</TableCell>
                <TableCell className="min-w-[100px]">{product.price} บาท</TableCell>
                <TableCell className="min-w-[80px]">{product.stock}</TableCell>
                <TableCell className="min-w-[120px]">{product.category?.name || "ไม่มี"}</TableCell>
                <TableCell className="min-w-[140px]">
                  {product.imageData ? (
                    <img 
                      src={product.imageData.startsWith('http') ? product.imageData : `data:image/jpeg;base64,${product.imageData}`} 
                      alt={product.name} 
                      className="h-16 w-auto" 
                    />
                  ) : "ไม่มี"}
                </TableCell>
                <TableCell className="min-w-[120px]">{format(new Date(product.createdAt), "dd/MM/yyyy")}</TableCell>
                <TableCell className="min-w-[160px]">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditProduct(product);
                      setEditFormData({
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        categoryId: product.categoryId,
                        imageData: product.imageData, // เก็บ imageData เดิม
                      });
                    }}
                    className="mr-2"
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length > itemsPerPage && (
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

      {/* ตารางหมวดหมู่ */}
      <div className="mt-6 overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อหมวดหมู่</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead>จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="min-w-[160px]">{category.name}</TableCell>
                <TableCell className="min-w-[140px]">{format(new Date(category.createdAt), "dd/MM/yyyy")}</TableCell>
                <TableCell className="min-w-[160px]">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditCategory(category);
                      setEditCategoryForm({ name: category.name });
                    }}
                    className="mr-2"
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}