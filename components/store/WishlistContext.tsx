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

    if (process.env.NODE_ENV === "development" && typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) registration.unregister();
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) caches.delete(key);
        });
      }
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      }
    } catch (err) {
      console.error("Error al cargar lista de deseos:", err);
      setWishlist([]);
    }
  }, []);

  // Sync to localStorage whenever wishlist changes after mounting
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (err) {
      console.error("Error al guardar lista de deseos:", err);
    }
  }, [wishlist, mounted]);

  const addToWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlist((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
    });
  }, []);

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
