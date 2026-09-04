"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";
import SearchDrawer from "@/components/store/SearchDrawer";
import { useWishlist } from "@/components/store/WishlistContext";
import { ArrowRight, ShoppingBag } from "lucide-react";

type ProductType = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  description?: string | null;
  photos: string[];
  price_usd: number;
  price_ves: number;
  total_stock_online: number;
  variants: Array<{ id: string; size: string; stock_online: number }>;
};

export default function StoreHomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [cart, setCart] = useState<CartItemType[]>([]);

  const { wishlistCount } = useWishlist();
  const [currentSlide, setCurrentSlide] = useState(0);

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
        if (data.data) {
          setProducts(data.data);
          setCategories(data.categories || []);
          setBcvRate(data.bcv_rate || 1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fotos de las últimas prendas del catálogo para el fondo del Hero
  const catalogPhotos = products
    .flatMap((p) => p.photos || [])
    .filter(Boolean);

  const heroBackgrounds = catalogPhotos.slice(0, 5);

  useEffect(() => {
    if (heroBackgrounds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBackgrounds.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroBackgrounds.length]);

  const handleUpdateQuantity = (variant_id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(variant_id);
      return;
    }
    const updated = cart.map((item) =>
      item.variant_id === variant_id ? { ...item, quantity: Math.min(qty, item.stock_online) } : item
    );
    saveCart(updated);
  };

  const handleRemoveItem = (variant_id: string) => {
    const updated = cart.filter((item) => item.variant_id !== variant_id);
    saveCart(updated);
  };

  const defaultCategories = ["Mujer", "Hombre", "Niños"];
  const allCategoryPills = Array.from(new Set([...defaultCategories, ...categories]));

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <StoreNavbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        wishlistCount={wishlistCount}
        bcvRate={bcvRate}
      />

      <main className="flex-1">
        {/* Hero Banner: Logo Gigante en la Esquina Superior Derecha, Texto Pegado a la Izquierda */}
        <section className="relative h-[80vh] sm:h-[85vh] bg-black text-white flex items-end justify-start overflow-hidden border-b border-slate-900">
          
          {/* LOGO EN LA ESQUINA SUPERIOR DERECHA (DUPLICADO EN TAMAÑO) */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-8 lg:top-8 lg:right-10 z-30 pointer-events-none">
            <div className="relative h-40 sm:h-56 lg:h-72 w-96 sm:w-[600px] lg:w-[840px] max-w-[90vw]">
              <Image
                src="/qfranelas-logo.png"
                alt="Q' FRANELAS Logo"
                fill
                priority
                sizes="(max-width: 768px) 600px, 840px"
                className="object-contain object-right pointer-events-none drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Fotos de Catálogo de Fondo (Más claras y brillantes en móvil y desktop) */}
          <div className="absolute inset-0 bg-black">
            {heroBackgrounds.map((photo, idx) => (
              <Image
                key={photo + idx}
                src={photo}
                alt={`Q' FRANELAS Colección ${idx + 1}`}
                fill
                priority={idx === 0}
                quality={90}
                sizes="100vw"
                className={`object-cover object-right md:object-center transition-opacity duration-1000 pointer-events-none ${
                  idx === currentSlide ? "opacity-95" : "opacity-0"
                }`}
              />
            ))}
          </div>

          {/* Gradientes Aclarados en Móvil / Un toque más oscuro en Pantalla Grande (md/lg) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 sm:via-black/40 md:from-black/85 md:via-black/55 lg:via-black/60 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 z-10 pointer-events-none" />

          {/* Columna Izquierda: Texto e Identidad Pegados a la Izquierda */}
          <div className="relative z-20 w-full px-3 sm:px-8 lg:px-12 pb-8 sm:pb-14 pt-8 sm:pt-14">
            <div className="max-w-xl space-y-3 text-left">
              <span className="text-[11px] uppercase tracking-[0.25em] font-normal text-slate-200 block drop-shadow">
                COLECCIÓN 2026 · ÚLTIMAS PRENDAS
              </span>
              <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-normal uppercase tracking-tight leading-none text-white drop-shadow-md">
                NUEVAS TENDENCIAS
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-normal max-w-md pt-1 leading-relaxed drop-shadow">
                Prendas confeccionadas con la máxima calidad. Somos fabricantes: viste a la vanguardia o impulsa tu propio negocio al mejor precio. Envíos directos y seguros a toda Venezuela.
              </p>

              <div className="pt-4 flex items-center justify-start">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 text-xs font-normal uppercase tracking-widest hover:bg-slate-200 transition-colors shadow-lg"
                >
                  VER TIENDA <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Indicadores de diapositiva abajo a la derecha */}
          {heroBackgrounds.length > 1 && (
            <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-20 flex items-center gap-2">
              {heroBackgrounds.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                  aria-label={`Ir a foto ${i + 1}`}
                />
              ))}
            </div>
          )}

        </section>

        {/* Lefties Category Strip */}
        <section className="w-full px-4 sm:px-8 lg:px-12 py-8 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <Link
              href="/catalogo"
              className="px-5 py-2 border border-black bg-black text-white text-xs font-normal uppercase tracking-widest shrink-0 transition-colors"
            >
              TODA LA COLECCIÓN
            </Link>
            {allCategoryPills.map((cat) => (
              <Link
                key={cat}
                href={`/catalogo?category=${encodeURIComponent(cat)}`}
                className="px-5 py-2 border border-slate-300 bg-white text-black text-xs font-normal uppercase tracking-widest shrink-0 hover:border-black transition-colors"
              >
                {cat.toUpperCase()}
              </Link>
            ))}
          </div>
        </section>

        {/* Lefties Featured Grid */}
        <section className="w-full px-4 sm:px-8 lg:px-12 py-12">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-[10px] font-normal uppercase tracking-[0.2em] text-slate-500 block">
                CATÁLOGO DESTACADO
              </span>
              <h2 className="font-sans text-xl sm:text-2xl font-normal uppercase tracking-tight text-black mt-1">
                COLECCIÓN DESTACADA
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-xs font-normal uppercase tracking-wider text-black hover:opacity-60 transition-opacity flex items-center gap-1"
            >
              Ver Todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-slate-100 animate-pulse h-80" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white p-8 space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 text-xs font-normal uppercase tracking-wider">
                No hay prendas disponibles en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} {...product} viewMode="large" />
              ))}
            </div>
          )}
        </section>
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
