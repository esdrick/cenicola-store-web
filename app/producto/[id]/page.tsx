"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";
import SearchDrawer from "@/components/store/SearchDrawer";
import { useWishlist } from "@/components/store/WishlistContext";
import { ArrowLeft, Check, AlertCircle, Bookmark, ShoppingBag } from "lucide-react";

type VariantType = {
  id: string;
  size: string;
  sku: string;
  stock_online: number;
  price_usd: number;
  price_divisas_usd?: number;
  price_bundle_usd?: number;
  price_bundle_divisas_usd?: number;
  price_mayor_usd?: number;
  price_mayor_divisas_usd?: number;
  price_ves: number;
};

type ProductDetailType = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  description?: string | null;
  photos: string[];
  price_usd: number;
  price_divisas_usd?: number;
  price_ves: number;
  bcv_rate: number;
  variants: VariantType[];
};

type RelatedProductType = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  photos: string[];
  price_usd: number;
  price_ves: number;
  total_stock_online: number;
  variants: Array<{ id: string; size: string; stock_online: number }>;
};

const COLOR_HEX_MAP: Record<string, string> = {
  negro: "#000000",
  blanco: "#FFFFFF",
  azul: "#2563EB",
  rojo: "#DC2626",
  verde: "#16A34A",
  amarillo: "#EAB308",
  marron: "#854D0E",
  marrón: "#854D0E",
  beige: "#E5E7EB",
  gris: "#6B7280",
  rosa: "#EC4899",
  rosado: "#EC4899",
  morado: "#9333EA",
  fucsia: "#D946EF",
  naranja: "#F97316",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);
  const [quantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [cart, setCart] = useState<CartItemType[]>([]);

  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();

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
    if (!productId) return;
    setLoading(true);
    fetch(`/api/store/products/${productId}`)
      .then((res) => res.json())
      .then((resData) => {
        const p = resData?.data;
        if (p && !resData.error) {
          const uniquePhotos = Array.from(new Set((p.photos || []) as string[]));
          setProduct({ ...p, photos: uniquePhotos });
          if (uniquePhotos.length > 0) {
            setSelectedPhoto(uniquePhotos[0]);
          }
          const available = p.variants?.find((v: VariantType) => v.stock_online > 0);
          if (available) setSelectedVariant(available);
          else if (p.variants && p.variants.length > 0) setSelectedVariant(p.variants[0]);

          fetch(`/api/store/products?category=${encodeURIComponent(p.type)}`)
            .then((r) => r.json())
            .then((catData) => {
              if (catData.data) {
                const filtered = catData.data.filter((item: RelatedProductType) => item.id !== p.id);
                setRelatedProducts(filtered.slice(0, 4));
              }
            })
            .catch(() => null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    if (selectedVariant.stock_online <= 0) return;

    const existingIndex = cart.findIndex((i) => i.variant_id === selectedVariant.id);
    let updatedCart: CartItemType[] = [];

    if (existingIndex >= 0) {
      updatedCart = cart.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              quantity: Math.min(item.quantity + quantity, selectedVariant.stock_online),
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          variant_id: selectedVariant.id,
          product_id: product.id,
          name: product.name,
          size: selectedVariant.size,
          color: product.color,
          photo: product.photos[0] || null,
          price_usd: selectedVariant.price_usd,
          price_divisas_usd: selectedVariant.price_divisas_usd ?? selectedVariant.price_usd,
          price_bundle_usd: selectedVariant.price_bundle_usd,
          price_bundle_divisas_usd: selectedVariant.price_bundle_divisas_usd,
          price_mayor_usd: selectedVariant.price_mayor_usd,
          price_mayor_divisas_usd: selectedVariant.price_mayor_divisas_usd,
          quantity,
          stock_online: selectedVariant.stock_online,
        },
      ];
    }

    saveCart(updatedCart);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
    setCartOpen(true);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <StoreNavbar cartCount={0} onOpenCart={() => {}} />
        <main className="max-w-5xl mx-auto px-4 py-16 flex-1 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[11px] text-slate-400 font-normal uppercase tracking-widest">
            Cargando prenda...
          </p>
        </main>
        <StoreFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <StoreNavbar cartCount={0} onOpenCart={() => {}} />
        <main className="max-w-5xl mx-auto px-4 py-16 flex-1 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <h2 className="text-xs font-normal uppercase tracking-wider text-black">Prenda No Encontrada</h2>
          <p className="text-[11px] text-slate-400">El producto no está disponible o fue retirado del catálogo.</p>
          <Link
            href="/catalogo"
            className="inline-block bg-black text-white px-5 py-2 text-[11px] font-normal uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            Volver a la colección
          </Link>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const bcvPriceUsd = (selectedVariant ? selectedVariant.price_usd : product.price_usd) ?? 0;
  const divisasPriceUsd = (selectedVariant?.price_divisas_usd ?? product.price_divisas_usd ?? bcvPriceUsd);
  const hasDivisasDiscount = divisasPriceUsd > 0 && divisasPriceUsd < bcvPriceUsd;
  const divisasSavings = bcvPriceUsd - divisasPriceUsd;

  const isFavorite = isInWishlist(product.id);
  const colorKey = (product.color || "").toLowerCase().trim();
  const hexBg = COLOR_HEX_MAP[colorKey] || (colorKey ? colorKey : "#000000");

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black" suppressHydrationWarning>
      <StoreNavbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        wishlistCount={wishlistCount}
        bcvRate={product.bcv_rate}
      />

      {/* Contained Max-Width Layout for Refined Proportions */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">
        {/* Minimal Back Breadcrumb */}
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-2.5">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1 text-[11px] font-normal uppercase tracking-wider text-black hover:opacity-60 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </Link>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-normal hidden sm:inline">
            COLECCIÓN / {product.type}
          </span>
        </div>

        {/* Product Details Compact Grid (6 cols / 6 cols layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Photo Showcase (6 cols) */}
          <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-3">
            {/* Compact Thumbnail Strip */}
            {product.photos.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0">
                {product.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`relative w-12 md:w-14 aspect-[3/4] bg-slate-100 overflow-hidden border transition-all shrink-0 ${
                      selectedPhoto === photo ? "border-black" : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={photo} alt={`${product.name} ${idx}`} fill sizes="60px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Featured Photo (Controlled Compact Height) */}
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto bg-slate-100 overflow-hidden flex-1">
              {selectedPhoto ? (
                <Image
                  src={selectedPhoto}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] uppercase tracking-widest">
                  Sin Foto
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Refined Minimal Details Panel (6 cols) */}
          <div className="lg:col-span-6 space-y-4 pt-1">
            {/* Swatch & Type Label */}
            <div className="flex items-center gap-2">
              {product.color && (
                <span
                  className="w-3 h-3 border border-slate-300 rounded-xs inline-block"
                  style={{ backgroundColor: hexBg }}
                  title={product.color}
                />
              )}
              <span className="text-[10px] font-normal uppercase tracking-widest text-slate-500">
                {product.type} {product.color && `· ${product.color}`}
              </span>
            </div>

            {/* Refined Title & Price */}
            <div>
              <h1 className="font-sans text-base sm:text-lg font-normal uppercase tracking-wider text-black">
                {product.name}
              </h1>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="font-bold text-black text-xl tracking-tight">
                  ${bcvPriceUsd.toFixed(2)}
                </span>
                {hasDivisasDiscount && (
                  <span className="text-[10px] uppercase tracking-wider text-black bg-slate-100 px-2 py-0.5 border border-slate-200 font-normal">
                    ${divisasPriceUsd.toFixed(2)} PAGANDO EN DIVISA
                  </span>
                )}
              </div>

              {hasDivisasDiscount && (
                <p className="mt-1 text-[9px] sm:text-[10px] text-slate-400 font-normal uppercase tracking-wider">
                  Ahorra ${divisasSavings.toFixed(2)} pagando en USD, Zelle o USDT
                </p>
              )}
            </div>

            {/* Size Selector */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex justify-between items-center text-[11px] font-normal">
                <span className="uppercase tracking-wider text-black">Talla:</span>
                {selectedVariant && selectedVariant.stock_online <= 3 && selectedVariant.stock_online > 0 && (
                  <span className="text-[10px] text-black font-medium uppercase tracking-wider">
                    ¡Últimas unidades!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const outOfStock = v.stock_online <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        if (!outOfStock) setSelectedVariant(v);
                      }}
                      disabled={outOfStock}
                      className={`px-3.5 py-1.5 min-w-[42px] border text-[11px] font-normal uppercase transition-all shrink-0 ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : outOfStock
                          ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                          : "bg-white text-black border-slate-300 hover:border-black"
                      }`}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              {addedSuccess && (
                <div className="p-2.5 bg-black text-white text-[11px] font-normal uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Añadida a la cesta
                  </span>
                  <button onClick={() => setCartOpen(true)} className="underline text-[10px]">
                    Ver Carrito
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock_online <= 0}
                  className="flex-1 bg-black text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 font-normal py-3 px-5 text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {!selectedVariant || selectedVariant.stock_online <= 0
                    ? "AGOTADO EN TIENDA"
                    : `AÑADIR A LA CESTA · $${bcvPriceUsd.toFixed(2)}`}
                </button>

                <button
                  onClick={() =>
                    toggleWishlist({
                      id: product.id,
                      name: product.name,
                      type: product.type,
                      color: product.color,
                      photos: product.photos,
                      price_usd: bcvPriceUsd,
                      price_ves: 0,
                      total_stock_online: product.variants?.reduce((s, v) => s + v.stock_online, 0) || 0,
                    })
                  }
                  className={`p-3 border transition-colors flex items-center justify-center shrink-0 ${
                    isFavorite
                      ? "border-black bg-black text-white"
                      : "border-slate-300 bg-white text-black hover:border-black"
                  }`}
                  title={isFavorite ? "Eliminar de la lista de deseos" : "Agregar a la lista de deseos"}
                  aria-label="Guardar en favoritos"
                >
                  <Bookmark className={`w-4 h-4 ${isFavorite ? "fill-white text-white" : "stroke-[1.5]"}`} />
                </button>
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="pt-4 border-t border-slate-100 space-y-1.5">
                <h4 className="text-[11px] font-normal uppercase tracking-wider text-black">
                  Detalles del producto:
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                  {product.description}
                </p>
              </div>
            )}

            {/* Lefties Service Value Props */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-[10px] text-slate-500 font-normal">
              <div>
                <span className="font-medium text-black block uppercase tracking-wider">Envíos Nacionales</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Despacho vía MRW, Zoom y Tealca.</p>
              </div>
              <div>
                <span className="font-medium text-black block uppercase tracking-wider">Tasa BCV Oficial</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Pagos en Bs y USD garantizados.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Grid (Lefties "TAMBIÉN TE PUEDE GUSTAR") */}
        {relatedProducts.length > 0 && (
          <section className="mt-14 pt-8 border-t border-slate-100">
            <div className="flex justify-between items-end mb-5">
              <h3 className="font-sans text-sm sm:text-base font-normal uppercase tracking-wider text-black">
                TAMBIÉN TE PUEDE GUSTAR
              </h3>
              <Link
                href="/catalogo"
                className="text-[11px] font-normal uppercase tracking-wider text-black hover:opacity-60 transition-opacity"
              >
                Ver Colección
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} {...rel} viewMode="large" />
              ))}
            </div>
          </section>
        )}
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
        bcvRate={product.bcv_rate}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />
    </div>
  );
}
