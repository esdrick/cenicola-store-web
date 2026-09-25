"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { CartItemType } from "./CartDrawer";
import type { CartValidationResponse, CartItemStockCheck } from "@/app/api/store/cart/validate/route";

const LOCAL_STORAGE_KEY = "cenicola_cart";

type CartContextType = {
  cart: CartItemType[];
  cartCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (item: CartItemType) => void;
  updateQuantity: (variant_id: string, quantity: number) => void;
  removeFromCart: (variant_id: string) => void;
  clearCart: () => void;
  // Stock Validation
  validationResult: CartValidationResponse | null;
  isValidatingStock: boolean;
  validateStock: (itemsToValidate?: CartItemType[]) => Promise<CartValidationResponse | null>;
  removeOutOfStockItems: () => void;
  adjustQuantitiesToAvailableStock: () => void;
  hasStockIssues: boolean;
  hasOutOfStock: boolean;
  hasInsufficientStock: boolean;
  getItemStockStatus: (variant_id: string) => CartItemStockCheck | undefined;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<CartValidationResponse | null>(null);
  const [isValidatingStock, setIsValidatingStock] = useState(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (err) {
      console.error("Error al cargar carrito desde localStorage:", err);
      setCart([]);
    }
  }, []);

  // 2. Sync to LocalStorage on changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error("Error al guardar carrito en localStorage:", err);
    }
  }, [cart, mounted]);

  // Listen to external changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCart((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
              return parsed;
            });
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cenicola_cart_updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cenicola_cart_updated", handleStorageChange);
    };
  }, []);

  // 3. Stock Validation Function
  const validateStock = useCallback(async (itemsToValidate?: CartItemType[]): Promise<CartValidationResponse | null> => {
    const currentItems = itemsToValidate ?? cart;
    if (!currentItems || currentItems.length === 0) {
      setValidationResult({
        isValid: true,
        hasStockIssues: false,
        hasOutOfStock: false,
        hasInsufficientStock: false,
        items: [],
      });
      return null;
    }

    setIsValidatingStock(true);
    try {
      const res = await fetch("/api/store/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: currentItems.map((i) => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
        }),
      });

      if (res.ok) {
        const data: CartValidationResponse = await res.json();
        setValidationResult(data);
        return data;
      }
    } catch (err) {
      console.warn("No se pudo validar el stock del carrito:", err);
    } finally {
      setIsValidatingStock(false);
    }
    return null;
  }, [cart]);

  // Auto-validate when cart changes (after initial mount)
  useEffect(() => {
    if (!mounted || cart.length === 0) {
      if (cart.length === 0) {
        setValidationResult(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      validateStock(cart);
    }, 300);

    return () => clearTimeout(timer);
  }, [cart, mounted, validateStock]);

  // Auto-validate when user focuses the tab
  useEffect(() => {
    const handleFocus = () => {
      if (cart.length > 0) {
        validateStock(cart);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [cart, validateStock]);

  // Drawer Controls
  const openCart = useCallback(() => {
    setIsCartOpen(true);
    if (cart.length > 0) {
      validateStock(cart);
    }
  }, [cart, validateStock]);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => {
      if (!prev && cart.length > 0) {
        validateStock(cart);
      }
      return !prev;
    });
  }, [cart, validateStock]);

  // Cart Mutators
  const addToCart = useCallback((newItem: CartItemType) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.variant_id === newItem.variant_id);
      if (idx >= 0) {
        const maxStock = newItem.stock_online ?? prev[idx].stock_online ?? 999;
        return prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                ...newItem,
                quantity: Math.min(item.quantity + newItem.quantity, maxStock),
              }
            : item
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback((variant_id: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.variant_id !== variant_id);
      }
      return prev.map((i) => (i.variant_id === variant_id ? { ...i, quantity } : i));
    });
  }, []);

  const removeFromCart = useCallback((variant_id: string) => {
    setCart((prev) => prev.filter((i) => i.variant_id !== variant_id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setValidationResult(null);
  }, []);

  // Quick Action: Remove all items that have status 'out_of_stock', 'inactive', or 'not_found'
  const removeOutOfStockItems = useCallback(() => {
    if (!validationResult) return;
    const badVariantIds = new Set(
      validationResult.items
        .filter((item) => item.status === "out_of_stock" || item.status === "inactive" || item.status === "not_found" || item.available_stock <= 0)
        .map((item) => item.variant_id)
    );

    setCart((prev) => prev.filter((item) => !badVariantIds.has(item.variant_id)));
  }, [validationResult]);

  // Quick Action: Adjust quantities for items where requested > available_stock
  const adjustQuantitiesToAvailableStock = useCallback(() => {
    if (!validationResult) return;
    const stockMap = new Map(validationResult.items.map((i) => [i.variant_id, i]));

    setCart((prev) =>
      prev
        .map((item) => {
          const check = stockMap.get(item.variant_id);
          if (!check) return item;
          if (check.available_stock <= 0) return null; // out of stock
          if (item.quantity > check.available_stock) {
            return { ...item, quantity: check.available_stock, stock_online: check.available_stock };
          }
          return { ...item, stock_online: check.available_stock };
        })
        .filter((item): item is CartItemType => item !== null)
    );
  }, [validationResult]);

  const getItemStockStatus = useCallback(
    (variant_id: string) => {
      return validationResult?.items.find((i) => i.variant_id === variant_id);
    },
    [validationResult]
  );

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cart]);

  const hasStockIssues = Boolean(validationResult?.hasStockIssues);
  const hasOutOfStock = Boolean(validationResult?.hasOutOfStock);
  const hasInsufficientStock = Boolean(validationResult?.hasInsufficientStock);

  return (
    <CartContext.Provider
      value={{
        cart: mounted ? cart : [],
        cartCount: mounted ? cartCount : 0,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        validationResult,
        isValidatingStock,
        validateStock,
        removeOutOfStockItems,
        adjustQuantitiesToAvailableStock,
        hasStockIssues,
        hasOutOfStock,
        hasInsufficientStock,
        getItemStockStatus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
