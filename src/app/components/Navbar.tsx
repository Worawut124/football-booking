"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
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

export default function Navbar() {
  const { data: session, status } = useSession();

  // ตัวย่อชื่อสำหรับ Avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`
      : names[0][0];
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
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" className="cursor-pointer">หน้าแรก</Button>
          </Link>
          <Link href="/booking">
            <Button variant="ghost" className="cursor-pointer">จองสนาม</Button>
          </Link>
          <Link href="/competition-list">
            <Button variant="ghost" className="w-full justify-start cursor-pointer">สมัครการแข่งขัน</Button>
          </Link>
          <Link href="/Products">
            <Button variant="ghost" className="w-full justify-start cursor-pointer">สินค้า</Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" className="w-full justify-start cursor-pointer">ติดต่อ</Button>
          </Link>
          {(session?.user?.role === "ADMIN" || session?.user?.role === "OWNER") && (
            <Link href="/dashboard">
              <Button variant="ghost" className="cursor-pointer">แดชบอร์ด</Button>
            </Link>
          )}

          {/* Avatar และ Dropdown Menu */}
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                </Avatar>
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
                    <span>ประวัติการแข่งขัน</span>
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
              <div className="flex flex-col space-y-4 mt-4">
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start cursor-pointer">หน้าแรก</Button>
                </Link>
                <Link href="/booking">
                  <Button variant="ghost" className="w-full justify-start cursor-pointer">จองสนาม</Button>
                </Link>
                <Link href="/competition-list">
                  <Button variant="ghost" className="w-full justify-start cursor-pointer">สมัครการแข่งขัน</Button>
                </Link>
                  <Link href="/Products">
                  <Button variant="ghost" className="w-full justify-start cursor-pointer">สินค้า</Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">ติดต่อ</Button>
                  </Link>
                {(session?.user?.role === "ADMIN" || session?.user?.role === "OWNER") && (
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">แดชบอร์ด</Button>
                  </Link>
                )}
                {status === "authenticated" ? (
                  <>
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        จัดการข้อมูลส่วนตัว
                      </Button>
                    </Link>
                    <Link href="/Competition-history">
                      <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        ประวัติการแข่งขัน
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