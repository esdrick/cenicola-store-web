"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import SearchDrawer from "@/components/store/SearchDrawer";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";
import { useWishlist } from "@/components/store/WishlistContext";
import { Truck, FileText, ShieldCheck, ChevronRight, HelpCircle } from "lucide-react";

interface PolicyWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const POLICY_NAV = [
  {
    name: "Envíos y Entregas",
    href: "/politicas/envios",
    icon: Truck,
  },
  {
    name: "Términos y Condiciones",
    href: "/politicas/terminos-condiciones",
    icon: FileText,
  },
  {
    name: "Política de Privacidad",
    href: "/politicas/privacidad",
    icon: ShieldCheck,
  },
];

export default function PolicyWrapper({ title, subtitle, children }: PolicyWrapperProps) {
  const pathname = usePathname();
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
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-black selection:text-white">
      <StoreNavbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        wishlistCount={wishlistCount}
        bcvRate={bcvRate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest mb-6 font-medium">
          <Link href="/" className="hover:text-black transition-colors">
            INICIO
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-400">POLÍTICAS & LEGAL</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-black font-semibold">{title}</span>
        </div>

        {/* Editorial Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-slate-400 block mb-2">
            POLÍTICAS DE LA TIENDA & CONDICIONES DE SERVICIO
          </span>
          <h1 className="font-sans text-2xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-black">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-3xl mt-3 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Policy Navigation Tabs - Horizontal Scrollable on Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 border-b border-slate-100 scrollbar-none">
          {POLICY_NAV.map((nav) => {
            const Icon = nav.icon;
            const isActive = pathname === nav.href;
            return (
              <Link
                key={nav.href}
                href={nav.href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-black text-white border-black shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-black hover:text-black"
                }`}
              >
                <Icon className="w-4 h-4 stroke-[1.5]" />
                <span>{nav.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Document Body */}
          <div className="lg:col-span-8 space-y-8 text-slate-700 text-sm leading-relaxed">
            {children}
          </div>

          {/* Sidebar Banner & Support */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-slate-200 bg-slate-50/50 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5 text-black">
                <HelpCircle className="w-5 h-5 stroke-[1.5]" />
                <h3 className="font-bold text-xs uppercase tracking-[0.2em]">
                  ¿NECESITAS AYUDA ADICIONAL?
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si tienes preguntas sobre tu pedido, cambios o fletes, nuestro equipo de atención en Venezuela está disponible por WhatsApp.
              </p>
              <div className="pt-2 space-y-2">
                <a
                  href="https://wa.me/584129831561"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                  <span>WHATSAPP ATENCIÓN</span>
                </a>
                <Link
                  href="/contacto"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white text-black border border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-black transition-colors"
                >
                  <span>TIENDAS FÍSICAS</span>
                </Link>
              </div>
            </div>

            <div className="border border-slate-200 p-6 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                COMPROMISO Q´FRANELAS
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confección de alta calidad, precios competitivos y envíos garantizados a todo el territorio nacional. Moda moderna y accesible hecha para ti.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium tracking-wider">
                <span>INFORMACIÓN LEGAL</span>
                <span className="font-semibold text-slate-600">RIF: J-50444768-4</span>
              </div>
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
