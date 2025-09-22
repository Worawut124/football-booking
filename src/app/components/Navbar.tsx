"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User } from "lucide-react";
import Image from "next/image";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCart } from "@/components/CartContext";
import { ShoppingCart } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { totalQuantity } = useCart();
  const pathname = usePathname();

  // ตัวย่อชื่อสำหรับ Avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`
      : names[0][0];
  };

  // ฟังก์ชันตรวจสอบ active path
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // ฟังก์ชันสำหรับ class ของปุ่ม
  const getButtonClass = (path: string) => {
    const baseClass = "cursor-pointer transition-all duration-200 relative";
    const activeClass = "text-green-700";
    const hoverClass = "hover:bg-green-50 hover:text-green-600";
    
    return isActive(path) 
      ? `${baseClass} ${activeClass}` 
      : `${baseClass} ${hoverClass}`;
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/images/logo.jpg"
            alt="Logo"
            width={70}
            height={70}
            className="h-15 w-auto"
          />
        </Link>
        

        {/* เมนูสำหรับเดสก์ท็อป */}
        <div className="hidden md:flex items-center space-x-2">
          <Link href="/">
            <Button variant="ghost" className={getButtonClass("/")}>
              หน้าแรก
              {isActive("/") && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              )}
            </Button>
          </Link>
          <Link href="/booking">
            <Button variant="ghost" className={getButtonClass("/booking")}>
              จองสนาม
              {isActive("/booking") && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              )}
            </Button>
          </Link>
          <Link href="/competition-list">
            <Button variant="ghost" className={getButtonClass("/competition-list")}>
              การแข่งขัน
              {isActive("/competition-list") && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              )}
            </Button>
          </Link>
          <Link href="/Products">
            <Button variant="ghost" className={getButtonClass("/Products")}>
              สินค้า
              {isActive("/Products") && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              )}
            </Button>
          </Link>
          {/* <Link href="/contact">
            <Button variant="ghost" className={getButtonClass("/contact")}>
              ติดต่อ
              {isActive("/contact") && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              )}
            </Button>
          </Link> */}
          <Link href="/cart">
            <Button variant="ghost" className={`relative ${getButtonClass("/cart")}`}>
              <ShoppingCart className="mr-2 h-4 w-4" /> ตะกร้า
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-1 text-xs text-white shadow-lg animate-pulse">
                  {totalQuantity}
                </span>
              )}
              {isActive("/cart") && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              )}
            </Button>
          </Link>
          {(session?.user?.role === "ADMIN" || session?.user?.role === "OWNER") && (
            <Link href="/dashboard">
              <Button variant="ghost" className={getButtonClass("/dashboard")}>
                แดชบอร์ด
                {isActive("/dashboard") && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                )}
              </Button>
            </Link>
          )}

          {/* Avatar และ Dropdown Menu */}
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-green-50 rounded-lg p-2 transition-all duration-200 border border-transparent hover:border-green-200 hover:shadow-sm">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">
                      {session.user?.name || "ผู้ใช้"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : 
                       session.user?.role === "OWNER" ? "เจ้าของสนาม" : "สมาชิก"}
                    </div>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>จัดการข้อมูลส่วนตัว</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/Competition-history" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>การแข่งขัน</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user-orders" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>คำสั่งซื้อสินค้า</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ออกจากระบบ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="cursor-pointer">เข้าสู่ระบบ</Button>
            </Link>
          )}
        </div>

        {/* เมนูสำหรับมือถือ */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="cursor-pointer">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <VisuallyHidden asChild>
                <SheetTitle>เมนู</SheetTitle>
              </VisuallyHidden>
              <div className="flex flex-col space-y-3 mt-4">
                <Link href="/">
                  <Button variant="ghost" className={`w-full justify-start ${getButtonClass("/")}`}>
                    หน้าแรก
                    {isActive("/") && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    )}
                  </Button>
                </Link>
                <Link href="/booking">
                  <Button variant="ghost" className={`w-full justify-start ${getButtonClass("/booking")}`}>
                    จองสนาม
                    {isActive("/booking") && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    )}
                  </Button>
                </Link>
                <Link href="/competition-list">
                  <Button variant="ghost" className={`w-full justify-start ${getButtonClass("/competition-list")}`}>
                    การแข่งขัน
                    {isActive("/competition-list") && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    )}
                  </Button>
                </Link>
                <Link href="/Products">
                  <Button variant="ghost" className={`w-full justify-start ${getButtonClass("/Products")}`}>
                    สินค้า
                    {isActive("/Products") && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    )}
                  </Button>
                </Link>
                {/* <Link href="/contact">
                  <Button variant="ghost" className={`w-full justify-start ${getButtonClass("/contact")}`}>
                    ติดต่อ
                    {isActive("/contact") && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    )}
                  </Button>
                </Link> */}
                <Link href="/cart">
                  <Button variant="ghost" className={`w-full justify-start ${getButtonClass("/cart")}`}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> ตะกร้า
                    {totalQuantity > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-1 text-xs text-white shadow-lg animate-pulse">
                        {totalQuantity}
                      </span>
                    )}
                    {isActive("/cart") && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    )}
                  </Button>
                </Link>
                {(session?.user?.role === "ADMIN" || session?.user?.role === "OWNER") && (
                  <Link href="/dashboard">
                    <Button variant="ghost" className={`w-full justify-start ${getButtonClass("/dashboard")}`}>
                      แดชบอร์ด
                      {isActive("/dashboard") && (
                        <div className="ml-auto w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      )}
                    </Button>
                  </Link>
                )}
                {status === "authenticated" ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-4 border border-green-200">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          {session.user?.name || "ผู้ใช้"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : 
                           session.user?.role === "OWNER" ? "เจ้าของสนาม" : "สมาชิก"}
                        </div>
                      </div>
                    </div>
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        จัดการข้อมูลส่วนตัว
                      </Button>
                    </Link>
                    <Link href="/Competition-history">
                      <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        การแข่งขัน
                      </Button>
                    </Link>
                    <Link href="/user-orders">
                      <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        คำสั่งซื้อสินค้า
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      ออกจากระบบ
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button className="w-full cursor-pointer">เข้าสู่ระบบ</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}