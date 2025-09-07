"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  imageData: string | null;
  stock: number;
  quantity: number;
  categoryName?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "fb_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // ตรวจสอบว่าเป็น client-side หรือไม่
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load from sessionStorage instead of localStorage
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const currentSession = sessionStorage.getItem('userSession');
      if (currentSession) {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed: CartItem[] = JSON.parse(cached);
          setItems(Array.isArray(parsed) ? parsed : []);
        }
      } else {
        // ถ้าไม่มี session ให้ล้างตะกร้า
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [isClient]);

  // Persist to sessionStorage instead of localStorage
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const currentSession = sessionStorage.getItem('userSession');
      if (currentSession) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        // ถ้าไม่มี session ให้ล้างตะกร้า
        if (items.length > 0) {
          setItems([]);
        }
      }
    } catch {}
  }, [items, isClient]);

  // ตรวจสอบ session และล้างตะกร้าหากจำเป็น
  const checkSession = useCallback(() => {
    if (!isClient) return;
    
    const currentSession = sessionStorage.getItem('userSession');
    if (!currentSession && items.length > 0) {
      setItems([]);
    }
  }, [isClient, items.length]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    checkSession(); // ตรวจสอบ session ก่อน
    
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, Math.max(0, item.stock));
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { ...item, quantity: Math.min(quantity, Math.max(0, item.stock)) }];
    });
  }, [checkSession]);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.id === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (isClient) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [isClient]);

  const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.price, 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, totalQuantity, totalPrice }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalQuantity, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

// ฟังก์ชันสำหรับจัดการ session (ใช้เมื่อ login/logout)
export const setUserSession = (sessionId: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('userSession', sessionId);
  }
};

export const clearUserSession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('userSession');
    sessionStorage.removeItem(STORAGE_KEY);
  }
};