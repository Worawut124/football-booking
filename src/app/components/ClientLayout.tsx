"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { CartProvider } from "@/components/CartContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // หน้าที่ไม่ต้องแสดง Footer
  const hideFooterPages = ['/Competition-history', '/user-orders'];
  const shouldHideFooter = hideFooterPages.includes(pathname);

  return (
    <SessionProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          {!shouldHideFooter && <Footer />}
        </div>
      </CartProvider>
    </SessionProvider>
  );
}