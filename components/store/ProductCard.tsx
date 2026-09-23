"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Plus, ShoppingBag } from "lucide-react";
import { useWishlist } from "./WishlistContext";
import SafeImage from "@/components/ui/SafeImage";
import { getColorHex, isLightColor } from "@/lib/colors";

type ProductCardProps = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  available_colors?: Array<{ id: string; color: string | null }>;
  photos: string[];
  price_usd: number;
  price_ves: number;
  total_stock_online: number;
  price_divisas_usd?: number;
  price_mayor_usd?: number;
  variants?: Array<{
    id: string;
    size: string;
    stock_online: number;
    price_usd?: number;
    price_divisas_usd?: number;
    price_bundle_usd?: number;
    price_bundle_divisas_usd?: number;
    price_mayor_usd?: number;
    price_mayor_divisas_usd?: number;
  }>;
  viewMode?: "large" | "compact" | "list";
  onQuickAdd?: (product: ProductCardProps) => void;
};

const formatPrice = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return "0.00";
  return val.toFixed(2);
};

export default function ProductCard(props: ProductCardProps) {
  const {
    id,
    name,
    type,
    color,
    available_colors = [],
    photos,
    price_usd,
    price_ves,
    total_stock_online,
    variants = [],
    viewMode = "large",
    onQuickAdd,
  } = props;

  const mayorPriceUsd = (() => {
    if (props.price_mayor_usd && props.price_mayor_usd > 0) return props.price_mayor_usd;
    if (variants && variants.length > 0) {
      const valid = variants.map((v) => v.price_mayor_usd || 0).filter((p) => p > 0);
      if (valid.length > 0) return Math.min(...valid);
    }
    if (price_usd && price_usd > 0) {
      return Number((price_usd * 0.7).toFixed(2));
    }
    return undefined;
  })();

  const mainPhoto = photos && photos[0] ? photos[0] : "";
  const hoverPhoto = photos && photos[1] ? photos[1] : mainPhoto;

  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({ id, name, type, color, photos, price_usd, price_ves, total_stock_online });
  };

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(props);
    }
  };

  const hexBg = getColorHex(color);

  // 1. REAL COMPACT LIST VIEW MODE (Small thumbnail, clean row item)
  if (viewMode === "list") {
    return (
      <div
        id={`product-card-${id}`}
        onClickCapture={() => {
          try {
            sessionStorage.setItem("cenicola_last_clicked_product_id", id);
            sessionStorage.setItem("cenicola_catalog_scroll_y", window.scrollY.toString());
          } catch {}
        }}
        className="group bg-white py-2.5 px-3 sm:px-4 border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-black flex items-center justify-between gap-2.5 sm:gap-5"
      >
        {/* Left: Small Thumbnail Image & Details */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
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
            <div className="flex items-center gap-1.5 min-w-0">
              {available_colors && available_colors.length > 1 ? (
                <div className="flex items-center gap-1 shrink-0">
                  {available_colors.slice(0, 3).map((cObj) => (
                    <span
                      key={cObj.id + (cObj.color || "")}
                      className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300 shrink-0"
                      style={{ backgroundColor: getColorHex(cObj.color) }}
                      title={cObj.color || "Color"}
                    />
                  ))}
                  <span className="text-[9px] text-slate-500 font-medium">
                    +{available_colors.length} col.
                  </span>
                </div>
              ) : color ? (
                <span
                  className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block shrink-0"
                  style={{ backgroundColor: hexBg }}
                  title={color}
                />
              ) : null}
              <Link
                href={`/producto/${id}`}
                className="font-semibold text-black text-xs sm:text-sm uppercase tracking-wider hover:opacity-60 transition-opacity truncate block min-w-0"
              >
                {name}
              </Link>
            </div>

            {/* Sizes Badges */}
            {variants.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
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

        {/* Right: Price & Wishlist / Quick Add Button */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex flex-col items-end text-right">
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-black text-xs sm:text-sm tracking-tight">
                ${formatPrice(price_usd)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase">
                BCV
              </span>
            </div>

            {mayorPriceUsd && mayorPriceUsd < price_usd && (
              <div className="mt-0.5 flex flex-col items-end">
                <span className="inline-block text-[8px] sm:text-[9.5px] uppercase tracking-wider text-black bg-slate-100 px-1.5 py-0.5 border border-slate-200 font-normal whitespace-nowrap">
                  ${formatPrice(mayorPriceUsd)} BCV MAYOR
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] text-slate-400 font-normal uppercase tracking-wider whitespace-nowrap mt-0.5">
                  +6 pcs
                </span>
              </div>
            )}
          </div>

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

          {onQuickAdd && (
            <button
              onClick={handleQuickAddClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-slate-800 transition-colors rounded-xs"
              title="Añadir rápido al carrito"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          )}

          <Link
            href={`/producto/${id}`}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-black text-[11px] font-normal uppercase tracking-wider hover:bg-slate-200 transition-colors rounded-xs border border-slate-200"
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
    <div
      id={`product-card-${id}`}
      onClickCapture={() => {
        try {
          sessionStorage.setItem("cenicola_last_clicked_product_id", id);
          sessionStorage.setItem("cenicola_catalog_scroll_y", window.scrollY.toString());
        } catch {}
      }}
      className="group flex flex-col bg-white overflow-hidden text-black relative font-sans"
    >
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
            className={`absolute top-2 left-2 bg-black text-white font-bold uppercase tracking-widest pointer-events-none z-10 ${
              isCompact ? "text-[7px] px-1 py-0.5" : "text-[9px] px-2 py-0.5"
            }`}
          >
            ÚLTIMAS UNIDADES
          </span>
        )}

        {/* Quick Add Button overlay (Shein style) */}
        {onQuickAdd && total_stock_online > 0 && (
          <button
            onClick={handleQuickAddClick}
            className={`absolute bottom-2 right-2 bg-black text-white rounded-xs shadow-md hover:bg-slate-800 transition-all opacity-95 sm:opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 z-10 active:scale-95 ${
              isCompact ? "p-1.5 text-[9px]" : "px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
            }`}
            title="Añadir rápido al carrito"
            aria-label="Añadir rápido"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[1.8]" />
            {!isCompact && <span>+ AÑADIR</span>}
          </button>
        )}
      </div>

      {/* Lefties Minimalist Text Details */}
      <div className="pt-2.5 pb-2 flex flex-col justify-between flex-1 space-y-1">
        {/* Swatch & Bookmark Row (Lefties / Mango Style with multiple color variants support) */}
        <div className="flex items-center justify-between min-h-[22px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {available_colors && available_colors.length > 1 ? (
              <>
                <div className="flex items-center gap-1">
                  {available_colors.slice(0, 4).map((cObj) => {
                    const cHex = getColorHex(cObj.color);
                    const isLight = isLightColor(cObj.color);
                    const isCurrent = (cObj.color || "").toLowerCase() === (color || "").toLowerCase();
                    return (
                      <span
                        key={cObj.id + (cObj.color || "")}
                        className={`w-3 h-3 rounded-full inline-block border transition-transform ${
                          isCurrent ? "scale-110 ring-1 ring-black/70" : ""
                        } ${isLight ? "border-slate-300" : "border-slate-200"}`}
                        style={{ backgroundColor: cHex }}
                        title={cObj.color || "Color"}
                      />
                    );
                  })}
                  {available_colors.length > 4 && (
                    <span className="text-[8.5px] text-slate-500 font-semibold">
                      +{available_colors.length - 4}
                    </span>
                  )}
                </div>
                <span className={`text-slate-400 font-normal uppercase tracking-wider ${isCompact ? "text-[8px]" : "text-[9px]"}`}>
                  {available_colors.length} col.
                </span>
              </>
            ) : color ? (
              <div className="flex items-center gap-1">
                <span
                  className={`w-3.5 h-3.5 border rounded-xs inline-block ${
                    isLightColor(color) ? "border-slate-300" : "border-slate-200"
                  }`}
                  style={{ backgroundColor: hexBg }}
                  title={color}
                />
                <span className={`text-slate-400 font-normal uppercase tracking-wider ${isCompact ? "text-[8px]" : "text-[9px]"}`}>
                  {color}
                </span>
              </div>
            ) : (
              <span className="w-3.5 h-3.5 border border-slate-300 bg-slate-900 rounded-xs inline-block" />
            )}
          </div>

          <button
            onClick={handleWishlistClick}
            className="text-slate-700 hover:text-black transition-colors p-0.5 shrink-0"
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

        {/* Option 2: Soft Gray Micro-Pill with Thin Font (Mango / Lefties Premium Style) */}
        <div className="pt-0.5 space-y-1">
          <div className="flex items-baseline gap-1">
            <span className={`font-bold text-black tracking-tight ${isCompact ? "text-xs" : "text-sm sm:text-base"}`}>
              ${formatPrice(price_usd)}
            </span>
            <span className={`font-semibold text-slate-500 uppercase ${isCompact ? "text-[9px]" : "text-[10px] sm:text-[11px]"}`}>
              BCV
            </span>
          </div>

          {mayorPriceUsd && mayorPriceUsd < price_usd && (
            <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className={`inline-block uppercase tracking-wider text-black bg-slate-100 px-1.5 sm:px-2 py-0.5 border border-slate-200 font-normal whitespace-nowrap ${isCompact ? "text-[7.5px] sm:text-[8.5px]" : "text-[8.5px] sm:text-[10px]"}`}>
                ${formatPrice(mayorPriceUsd)} BCV MAYOR
              </span>
              <span className={`text-slate-400 font-normal uppercase tracking-wider whitespace-nowrap ${isCompact ? "text-[7.5px] sm:text-[8.5px]" : "text-[8.5px] sm:text-[9.5px]"}`}>
                +6 piezas combinables
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
