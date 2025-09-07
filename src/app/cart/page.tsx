"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageData: string | null;
  stock: number;
  categoryName: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // ตรวจสอบว่าเป็น client-side หรือไม่
  useEffect(() => {
    setIsClient(true);
  }, []);

  // โหลดข้อมูลตะกร้าจาก sessionStorage เมื่อเริ่มต้น
  useEffect(() => {
    if (!isClient) return;

    const loadCartFromSession = () => {
      try {
        // ใช้ sessionStorage แทน localStorage เพื่อให้ข้อมูลหายเมื่อปิด browser
        const savedCart = sessionStorage.getItem('cart');
        const currentSession = sessionStorage.getItem('userSession');
        
        // ถ้ามี session และมีข้อมูลตะกร้า
        if (currentSession && savedCart) {
          const cartData = JSON.parse(savedCart);
          setItems(cartData);
        } else {
          // ถ้าไม่มี session หรือไม่มีข้อมูลตะกร้า ให้ล้างตะกร้า
          setItems([]);
        }
      } catch (error) {
        console.error('Error loading cart from session:', error);
        setItems([]);
      }
    };

    loadCartFromSession();

    // ตรวจสอบการเปลี่ยนแปลงของ session
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userSession' || e.key === 'cart') {
        loadCartFromSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);

  // บันทึกข้อมูลตะกร้าลง sessionStorage ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const currentSession = sessionStorage.getItem('userSession');
      if (currentSession) {
        sessionStorage.setItem('cart', JSON.stringify(items));
      } else {
        sessionStorage.removeItem('cart');
      }
    } catch (error) {
      console.error('Error saving cart to session:', error);
    }
  }, [items, isClient]);

  // ตรวจสอบ session และล้างตะกร้าหากจำเป็น
  const checkSessionAndClearCart = () => {
    if (!isClient) return;
    
    const currentSession = sessionStorage.getItem('userSession');
    if (!currentSession) {
      setItems([]);
    }
  };

  const addItem = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    checkSessionAndClearCart();
    
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // ตรวจสอบว่าจำนวนรวมไม่เกิน stock
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
        return prevItems.map(item =>
          item.id === product.id 
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // เพิ่มสินค้าใหม่
        const safeQuantity = Math.min(quantity, product.stock);
        return [...prevItems, { ...product, quantity: safeQuantity }];
      }
    });
  };

  const removeItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          // ตรวจสอบว่าจำนวนไม่เกิน stock
          const safeQuantity = Math.min(quantity, item.stock);
          return { ...item, quantity: safeQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    if (isClient) {
      sessionStorage.removeItem('cart');
    }
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    totalQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
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
    sessionStorage.removeItem('cart');
  }
};