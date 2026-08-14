"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type WishlistItem = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  photos: string[];
  price_usd: number;
  price_ves: number;
  total_stock_online: number;
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "cenicola_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error al cargar lista de deseos:", err);
      setWishlist([]);
    }
  }, []);

  const saveWishlist = useCallback((items: WishlistItem[]) => {
    setWishlist(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Error al guardar lista de deseos:", err);
    }
  }, []);

  const addToWishlist = useCallback(
    (item: WishlistItem) => {
      setWishlist((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        const updated = [...prev, item];
        saveWishlist(updated);
        return updated;
      });
    },
    [saveWishlist]
  );

  const removeFromWishlist = useCallback(
    (id: string) => {
      setWishlist((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        saveWishlist(updated);
        return updated;
      });
    },
    [saveWishlist]
  );

  const toggleWishlist = useCallback(
    (item: WishlistItem) => {
      setWishlist((prev) => {
        const exists = prev.some((i) => i.id === item.id);
        const updated = exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
        saveWishlist(updated);
        return updated;
      });
    },
    [saveWishlist]
  );

  const isInWishlist = useCallback(
    (id: string) => {
      return wishlist.some((i) => i.id === id);
    },
    [wishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist: mounted ? wishlist : [],
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: mounted ? wishlist.length : 0,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist debe ser usado dentro de un WishlistProvider");
  }
  return context;
}
