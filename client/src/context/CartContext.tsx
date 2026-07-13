import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Coupon } from '@shared/types';
import api from '../services/api';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  grandTotal: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Load cart from localStorage on init
  useEffect(() => {
    const savedCart = localStorage.getItem('trimaki_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart items', e);
      }
    }
  }, []);

  // Sync cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('trimaki_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountedPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Flat delivery fee of 50 INR, free above 1000 INR
  const deliveryFee = subtotal > 1000 || subtotal === 0 ? 0 : 50;

  // 5% GST tax rate
  const tax = subtotal * 0.05;

  // Coupon discount calculation
  const discount = appliedCoupon
    ? Math.min((subtotal * appliedCoupon.percentage) / 100, appliedCoupon.maxDiscount)
    : 0;

  const grandTotal = Math.max(0, subtotal + deliveryFee + tax - discount);

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      // Validate coupon with backend
      const coupons = await api.get<Coupon[]>('/coupons');
      const found = coupons.find(
        (c) => c.code.toUpperCase() === code.toUpperCase() && c.active
      );

      if (found && subtotal >= Number(found.minimumOrder)) {
        setAppliedCoupon(found);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to validate coupon code', e);
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        tax,
        discount,
        grandTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
export default CartProvider;
