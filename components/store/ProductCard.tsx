"use client";

import Link from "next/link";
import { ArrowRight, Bookmark } from "lucide-react";
import { useWishlist } from "./WishlistContext";
import SafeImage from "@/components/ui/SafeImage";

type ProductCardProps = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  photos: string[];
  price_usd: number;
  price_ves: number;
  total_stock_online: number;
  variants?: Array<{ id: string; size: string; stock_online: number }>;
  viewMode?: "large" | "compact" | "list";
};

// Simple color hex dictionary for Lefties swatches
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

export default function ProductCard({
  id,
  name,
  type,
  color,
  photos,
  price_usd,
  price_ves,
  total_stock_online,
  variants = [],
  viewMode = "large",
}: ProductCardProps) {
  const mainPhoto = photos && photos[0] ? photos[0] : "";
  const hoverPhoto = photos && photos[1] ? photos[1] : mainPhoto;

  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({ id, name, type, color, photos, price_usd, price_ves, total_stock_online });
  };

  const colorKey = (color || "").toLowerCase().trim();
  const hexBg = COLOR_HEX_MAP[colorKey] || (colorKey ? colorKey : "#000000");

  // 1. REAL COMPACT LIST VIEW MODE (Small thumbnail, clean row item)
  if (viewMode === "list") {
    return (
      <div className="group bg-white py-2.5 px-3 sm:px-4 border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-black flex items-center justify-between gap-3 sm:gap-5">
        {/* Left: Small Thumbnail Image & Details */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Small Compact Image (w-12 sm:w-16, 3:4 aspect) */}
          <Link
            href={`/producto/${id}`}
            className="relative w-12 sm:w-16 aspect-[3/4] bg-slate-100 rounded-xs overflow-hidden shrink-0 block"
          >
            <SafeImage
              src={mainPhoto}
              alt={name}
              fill
              sizes="80px"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Title, Color Swatch & Sizes */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {color && (
                <span
                  className="w-2.5 h-2.5 border border-slate-300 rounded-xs inline-block shrink-0"
                  style={{ backgroundColor: hexBg }}
                  title={color}
                />
              )}
              <Link
                href={`/producto/${id}`}
                className="font-semibold text-black text-xs sm:text-sm uppercase tracking-wider hover:opacity-60 transition-opacity line-clamp-1"
              >
                {name}
              </Link>
            </div>

            {/* Sizes Badges */}
            {variants.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {variants.map((v) => (
                  <span
                    key={v.id}
                    className={`px-1.5 py-0.2 rounded-xs text-[9px] font-semibold uppercase border ${
                      v.stock_online > 0
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-slate-100 border-slate-100 text-slate-300 line-through"
                    }`}
                  >
                    {v.size}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Price & Wishlist / Details Button */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <span className="font-bold text-black text-xs sm:text-sm tracking-tight">
            ${price_usd.toFixed(2)}
          </span>

          <button
            onClick={handleWishlistClick}
            className="text-slate-400 hover:text-black transition-colors p-1"
            title={isFavorite ? "Eliminar de lista de deseos" : "Agregar a lista de deseos"}
            aria-label="Guardar en favoritos"
          >
            <Bookmark
              className={`w-4 h-4 transition-colors ${
                isFavorite ? "fill-slate-900 text-slate-900" : "stroke-[1.5] text-slate-600"
              }`}
            />
          </button>

          <Link
            href={`/producto/${id}`}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-[11px] font-normal uppercase tracking-wider hover:bg-slate-800 transition-colors rounded-xs"
          >
            Ver <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. LEFTIES MINIMALIST GRID VIEWS (Large & Compact)
  const isCompact = viewMode === "compact";

  return (
    <div className="group flex flex-col bg-white overflow-hidden text-black relative font-sans">
      {/* Product Image Showcase (Lefties High-Aspect Ratio 3:4) */}
      <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden block">
        <Link href={`/producto/${id}`} className="w-full h-full block relative">
          <SafeImage
            src={mainPhoto}
            alt={name}
            fill
            sizes={
              isCompact
                ? "(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"
                : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            }
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {hoverPhoto && hoverPhoto !== mainPhoto && (
            <SafeImage
              src={hoverPhoto}
              alt={`${name} alt`}
              fill
              showSkeleton={false}
              sizes={
                isCompact
                  ? "(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"
                  : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              }
              className="object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"
            />
          )}
        </Link>

        {total_stock_online <= 3 && total_stock_online > 0 && (
          <span
            className={`absolute bottom-2 left-2 bg-black text-white font-bold uppercase tracking-widest pointer-events-none ${
              isCompact ? "text-[7px] px-1 py-0.5" : "text-[9px] px-2 py-0.5"
            }`}
          >
            ÚLTIMAS UNIDADES
          </span>
        )}
      </div>

      {/* Lefties Minimalist Text Details */}
      <div className="pt-2.5 pb-2 flex flex-col justify-between flex-1 space-y-1">
        {/* Swatch & Bookmark Row (Exact Lefties Style) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {color ? (
              <span
                className="w-3.5 h-3.5 border border-slate-300 rounded-xs inline-block"
                style={{ backgroundColor: hexBg }}
                title={color}
              />
            ) : (
              <span className="w-3.5 h-3.5 border border-slate-300 bg-slate-900 rounded-xs inline-block" />
            )}
          </div>

          <button
            onClick={handleWishlistClick}
            className="text-slate-700 hover:text-black transition-colors p-0.5"
            title={isFavorite ? "Eliminar de lista de deseos" : "Agregar a lista de deseos"}
            aria-label="Guardar en favoritos"
          >
            <Bookmark
              className={`w-4 h-4 transition-colors ${
                isFavorite ? "fill-slate-900 text-slate-900" : "stroke-[1.5] text-slate-700"
              }`}
            />
          </button>
        </div>

        {/* Lefties Minimalist Title */}
        <Link
          href={`/producto/${id}`}
          className={`font-semibold text-black uppercase tracking-wider hover:opacity-60 transition-opacity block line-clamp-1 ${
            isCompact ? "text-[10px]" : "text-xs sm:text-[13px]"
          }`}
        >
          {name}
        </Link>

        {/* Minimal Price Tag in USD Only */}
        <div>
          <span className={`font-bold text-black tracking-tight ${isCompact ? "text-xs" : "text-sm"}`}>
            ${price_usd.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
