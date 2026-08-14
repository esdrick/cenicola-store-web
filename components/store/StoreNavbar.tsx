"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, User, Heart, Search, Menu, X } from "lucide-react";

type StoreNavbarProps = {
  cartCount: number;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenSearch?: () => void;
  wishlistCount?: number;
  bcvRate?: number;
};

export default function StoreNavbar({
  cartCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  wishlistCount = 0,
}: StoreNavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/store/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white text-black border-b border-slate-200" suppressHydrationWarning>
      {/* Top Ticker Bar - Clean Customer-Facing Announcement */}
      <div className="bg-black text-white py-1.5 px-3 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-medium overflow-hidden border-b border-slate-900" suppressHydrationWarning>
        {/* Mobile View: Infinite Smooth Horizontal Marquee Slider */}
        <div className="sm:hidden relative w-full overflow-hidden whitespace-nowrap">
          <div className="animate-marquee items-center gap-6">
            <span>ENVÍOS A TODA VENEZUELA · MRW · ZOOM · TEALCA</span>
            <span className="text-slate-500">•</span>
            <span>PRECIOS EN USD Y BOLÍVARES (TASA OFICIAL BCV)</span>
            <span className="text-slate-500">•</span>
            <span>MÉTODOS DE PAGO: PAGO MÓVIL · ZELLE · EFECTIVO</span>
            <span className="text-slate-500">•</span>
            <span>ENVÍOS A TODA VENEZUELA · MRW · ZOOM · TEALCA</span>
            <span className="text-slate-500">•</span>
            <span>PRECIOS EN USD Y BOLÍVARES (TASA OFICIAL BCV)</span>
            <span className="text-slate-500">•</span>
            <span>MÉTODOS DE PAGO: PAGO MÓVIL · ZELLE · EFECTIVO</span>
            <span className="text-slate-500">•</span>
          </div>
        </div>

        {/* Desktop View: Static Spaced Bar */}
        <div className="hidden sm:flex justify-between items-center w-full">
          <span>ENVÍOS A TODA VENEZUELA · MRW · ZOOM · TEALCA</span>
          <span>PRECIOS EN USD Y BS (TASA OFICIAL BCV) · PAGO MÓVIL & ZELLE</span>
        </div>
      </div>

      {/* Main Lefties Navbar - Compact & Slim Height on Mobile */}
      <div className="w-full px-3 sm:px-8 lg:px-12 h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Toggle & Category Links */}
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-black hover:opacity-70"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] uppercase tracking-[0.2em] font-medium text-black">
            <Link href="/" className="hover:opacity-60 transition-opacity">
              INICIO
            </Link>
            <Link href="/catalogo" className="hover:opacity-60 transition-opacity">
              VER TODO
            </Link>
            <Link href="/catalogo?category=Mujer" className="hover:opacity-60 transition-opacity">
              MUJER
            </Link>
            <Link href="/catalogo?category=Hombre" className="hover:opacity-60 transition-opacity">
              HOMBRE
            </Link>
            <Link href="/catalogo?category=Niños" className="hover:opacity-60 transition-opacity">
              NIÑOS
            </Link>
          </nav>
        </div>

        {/* Center: Lefties-Style Minimalist Typographic Logo */}
        <Link href="/" className="text-center group shrink-0">
          <span className="font-sans text-lg sm:text-2xl lg:text-3xl font-bold tracking-[0.1em] text-black block uppercase group-hover:opacity-70 transition-opacity">
            Q&apos;FRANELAS
          </span>
        </Link>

        {/* Right: Search, Wishlist, Account, Cart */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
          {/* Search Trigger Button */}
          {onOpenSearch ? (
            <button
              onClick={onOpenSearch}
              className="p-1 text-black hover:opacity-60 transition-opacity"
              title="Buscar prendas"
              aria-label="Buscar prendas"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            </button>
          ) : (
            <Link href="/catalogo" className="p-1 text-black hover:opacity-60 transition-opacity" title="Buscar prendas">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            </Link>
          )}

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="p-1 text-black hover:opacity-60 transition-opacity relative flex items-center gap-1"
            title="Lista de Deseos"
            aria-label="Lista de Deseos"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            {mounted && wishlistCount > 0 && (
              <span className="text-[9px] sm:text-[10px] font-bold text-red-600 font-mono tracking-tighter" suppressHydrationWarning>
                ({wishlistCount})
              </span>
            )}
          </button>

          {/* Account Icon Only */}
          <Link
            href="/mi-cuenta"
            className="p-1 text-black hover:opacity-60 transition-opacity flex items-center"
            title={mounted && customer ? customer.name : "Mi Cuenta"}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative p-1 text-black hover:opacity-60 transition-opacity flex items-center gap-1"
            aria-label="Carrito de compras"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase" suppressHydrationWarning>
              ({mounted ? cartCount : 0})
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-5 py-4 space-y-3 text-xs font-medium uppercase tracking-[0.15em] text-black">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:opacity-60 border-b border-slate-100">
            INICIO
          </Link>
          <Link href="/catalogo" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:opacity-60 border-b border-slate-100">
            VER TODO
          </Link>
          <Link href="/catalogo?category=Mujer" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:opacity-60 text-slate-700 border-b border-slate-100">
            MUJER
          </Link>
          <Link href="/catalogo?category=Hombre" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:opacity-60 text-slate-700 border-b border-slate-100">
            HOMBRE
          </Link>
          <Link href="/catalogo?category=Niños" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:opacity-60 text-slate-700 border-b border-slate-100">
            NIÑOS
          </Link>
          <div className="pt-2 flex justify-between items-center text-[10px] tracking-widest text-slate-500">
            <Link href={mounted && customer ? "/mi-cuenta" : "/checkout"} onClick={() => setMobileMenuOpen(false)} className="text-black font-bold" suppressHydrationWarning>
              {mounted && customer ? "MI CUENTA" : "INICIAR SESIÓN / REGISTRO"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
