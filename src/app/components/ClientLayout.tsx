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
  
  // แสดง Footer เฉพาะหน้าแรกเท่านั้น
  const showFooterPages = ['/'];
  const shouldShowFooter = showFooterPages.includes(pathname);

  return (
    <SessionProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          {shouldShowFooter && <Footer />}
        </div>
      </CartProvider>
    </SessionProvider>
  );
}