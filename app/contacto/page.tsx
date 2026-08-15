"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import SearchDrawer from "@/components/store/SearchDrawer";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";
import { useWishlist } from "@/components/store/WishlistContext";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Clock, Truck, ArrowUpRight, MessageCircle, Building2 } from "lucide-react";

export default function ContactoPage() {
  const router = useRouter();
  const [bcvRate, setBcvRate] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cenicola_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      setCart([]);
    }
  }, []);

  const saveCart = (newCart: CartItemType[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("cenicola_cart", JSON.stringify(newCart));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.bcv_rate) setBcvRate(data.bcv_rate);
      })
      .catch(() => {});
  }, []);

  const handleUpdateQuantity = (variant_id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(variant_id);
      return;
    }
    const updated = cart.map((item) =>
      item.variant_id === variant_id
        ? { ...item, quantity: Math.min(qty, item.stock_online) }
        : item
    );
    saveCart(updated);
  };

  const handleRemoveItem = (variant_id: string) => {
    const updated = cart.filter((item) => item.variant_id !== variant_id);
    saveCart(updated);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-black selection:text-white" suppressHydrationWarning>
      <StoreNavbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        wishlistCount={wishlistCount}
        bcvRate={bcvRate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
        {/* Editorial Header */}
        <div className="border-b border-slate-200 pb-8 mb-12">
          <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-slate-400 block mb-2">
            NUESTRAS TIENDAS FÍSICAS & ATENCIÓN
          </span>
          <h1 className="font-sans text-3xl sm:text-5xl font-bold uppercase tracking-tight text-black">
            ¿DÓNDE ENCONTRARNOS?
          </h1>
          <p className="text-sm text-slate-600 font-normal max-w-2xl mt-3 leading-relaxed">
            Visítanos en nuestras sedes de Caracas y Maracay para conocer toda la colección en persona, o escríbenos directamente por WhatsApp para atención personalizada y envíos a toda Venezuela.
          </p>
        </div>

        {/* Store Cards Grid - Modern Minimalist Lefties Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* MARACAY STORE CARD (SEDE PRINCIPAL) */}
          <div className="border border-slate-200 bg-white p-8 sm:p-10 flex flex-col justify-between hover:border-black transition-all shadow-xs relative overflow-hidden group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] uppercase font-bold tracking-widest">
                  <Building2 className="w-3.5 h-3.5" />
                  TIENDA MARACAY (SEDE PRINCIPAL)
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">
                  ARAGUA
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mb-3">
                  MARACAY — AV. BERMÚDEZ
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-black shrink-0 mt-1 stroke-[1.5]" />
                  <span>
                    Local 23, Edificio Las Palmas, Av. Bermúdez (al frente del C.C. El Hipódromo).
                    <br />
                    Maracay, Estado Aragua, Venezuela.
                  </span>
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-700 flex items-center gap-2.5 font-medium">
                  <Clock className="w-4 h-4 text-black shrink-0 stroke-[1.5]" />
                  <span>Horario: <strong>Lunes a Sábado: 9:00 AM – 5:00 PM</strong></span>
                </div>
                <div className="text-xs text-slate-700 flex items-center gap-2.5 font-medium">
                  <Phone className="w-4 h-4 text-black shrink-0 stroke-[1.5]" />
                  <span>Línea Principal / WhatsApp: <strong>+58 412-9831561</strong></span>
                </div>
                <div className="text-xs text-slate-700 flex items-center gap-2.5 font-medium pl-6">
                  <span>Línea Secundaria: <strong>+58 412-8373528</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="https://wa.me/584129831561"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2.5 bg-black text-white px-6 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WHATSAPP MARACAY</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="https://maps.google.com/?q=Local+23+Edificio+Las+Palmas+Av+Bermudez+Maracay+Venezuela"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-100 text-black px-5 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <span>VER EN GOOGLE MAPS</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* CARACAS STORE CARD */}
          <div className="border border-slate-200 bg-white p-8 sm:p-10 flex flex-col justify-between hover:border-black transition-all shadow-xs relative overflow-hidden group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] uppercase font-bold tracking-widest">
                  <Building2 className="w-3.5 h-3.5" />
                  TIENDA CARACAS
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">
                  DISTRITO CAPITAL
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mb-3">
                  CARACAS — MERCADO LAS FLORES
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-black shrink-0 mt-1 stroke-[1.5]" />
                  <span>
                    Mercado Las Flores, Pasillo 1, Puesto #43.
                    <br />
                    Caracas, Distrito Capital, Venezuela.
                  </span>
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-700 flex items-center gap-2.5 font-medium">
                  <Clock className="w-4 h-4 text-black shrink-0 stroke-[1.5]" />
                  <span>Horario: <strong>Lunes a Sábado: 9:00 AM – 5:00 PM</strong></span>
                </div>
                <div className="text-xs text-slate-700 flex items-center gap-2.5 font-medium">
                  <Phone className="w-4 h-4 text-black shrink-0 stroke-[1.5]" />
                  <span>Teléfono / WhatsApp: <strong>+58 424-3797460</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="https://wa.me/584243797460"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2.5 bg-black text-white px-6 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WHATSAPP CARACAS</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Shipping & Guaranteed Delivery Banner */}
        <div className="bg-slate-50 border border-slate-200 p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs uppercase tracking-wider">
          <div className="flex items-start gap-4">
            <Truck className="w-6 h-6 text-black shrink-0 stroke-[1.25] mt-0.5" />
            <div>
              <h4 className="font-bold text-black text-xs uppercase tracking-[0.2em] mb-1">
                ENVÍOS A TODA VENEZUELA
              </h4>
              <p className="text-slate-500 normal-case text-xs leading-relaxed">
                Enviamos de manera rápida y segura por MRW, Zoom y Tealca a cualquier estado del país.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Building2 className="w-6 h-6 text-black shrink-0 stroke-[1.25] mt-0.5" />
            <div>
              <h4 className="font-bold text-black text-xs uppercase tracking-[0.2em] mb-1">
                RETIRO DIRECTO EN TIENDA
              </h4>
              <p className="text-slate-500 normal-case text-xs leading-relaxed">
                Pide por la web o WhatsApp y retira directamente en nuestras tiendas de Caracas o Maracay sin costo de envío.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 text-black shrink-0 stroke-[1.25] mt-0.5" />
            <div>
              <h4 className="font-bold text-black text-xs uppercase tracking-[0.2em] mb-1">
                ATENCIÓN PERSONALIZADA
              </h4>
              <p className="text-slate-500 normal-case text-xs leading-relaxed">
                Asesoría constante para compras al detal, por paquete o por docena para tu negocio.
              </p>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />

      <SearchDrawer
        isOpen={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        onSearchSubmit={(q) => router.push(`/catalogo?q=${encodeURIComponent(q)}`)}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        bcvRate={bcvRate}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />
    </div>
  );
}
