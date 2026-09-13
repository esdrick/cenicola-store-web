"use client";

import { useState, useEffect } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Check, ShoppingCart } from "lucide-react";
import { getVolumeTierInfo } from "@/lib/whatsapp";

export type QuickAddProductVariant = {
  id: string;
  size: string;
  stock_online: number;
  price_usd?: number;
  price_divisas_usd?: number;
  price_bundle_usd?: number;
  price_bundle_divisas_usd?: number;
  price_mayor_usd?: number;
  price_mayor_divisas_usd?: number;
};

export type QuickAddProduct = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  photos: string[];
  price_usd: number;
  price_divisas_usd?: number;
  bcv_rate?: number;
  variants: QuickAddProductVariant[];
};

type QuickAddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: QuickAddProduct | null;
  onAddToCart: (variant: QuickAddProductVariant, quantity: number) => void;
  onGoToCatalog?: () => void;
  onOpenCart?: () => void;
  onGoToCheckout?: () => void;
  cartTotalCount?: number;
  bcvRate?: number;
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

export default function QuickAddModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onGoToCatalog,
  onOpenCart,
  onGoToCheckout,
  cartTotalCount = 0,
}: QuickAddModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<QuickAddProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Auto-select first available variant in stock when product changes or modal opens
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      const firstAvailable = product.variants.find((v) => v.stock_online > 0);
      setSelectedVariant(firstAvailable || product.variants[0]);
      setQuantity(1);
      setIsAdded(false);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const mainPhoto = product.photos && product.photos[0] ? product.photos[0] : "";
  const colorKey = (product.color || "").toLowerCase().trim();
  const hexBg = COLOR_HEX_MAP[colorKey] || (colorKey ? colorKey : "#000000");

  const basePriceUsd = selectedVariant?.price_usd ?? product.price_usd;

  // Option 1: Calculate volume pricing based on global cart total (existing items + quantity being added)
  const itemQuantity = quantity;
  const projectedTotalItems = cartTotalCount + itemQuantity;
  const dummyVolumeItem = {
    variant_id: selectedVariant?.id || "",
    product_id: product.id,
    name: product.name,
    size: selectedVariant?.size || "",
    color: product.color,
    quantity: itemQuantity,
    price_usd: basePriceUsd,
    price_bundle_usd: selectedVariant?.price_bundle_usd,
    price_mayor_usd: selectedVariant?.price_mayor_usd,
  };

  const volumeInfo = getVolumeTierInfo(itemQuantity, dummyVolumeItem, projectedTotalItems);
  const unitPrice = volumeInfo.effectiveUnitPrice;
  const subtotalUsd = unitPrice * itemQuantity;

  const handleConfirmAdd = () => {
    if (!selectedVariant || selectedVariant.stock_online <= 0) return;
    onAddToCart(selectedVariant, itemQuantity);
    setIsAdded(true);
  };

  const handleKeepShopping = () => {
    onClose();
    if (onGoToCatalog) {
      onGoToCatalog();
    }
  };

  const handleGoToCheckout = () => {
    onClose();
    if (onGoToCheckout) {
      onGoToCheckout();
    } else if (onOpenCart) {
      onOpenCart();
    } else if (typeof window !== "undefined") {
      window.location.href = "/checkout";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Container: Bottom Sheet on Mobile, Centered Modal on Desktop - Slides Upwards */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full max-w-full sm:max-w-md bg-white rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-all transform duration-300 animate-in slide-in-from-bottom ease-out text-black border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-black animate-pulse" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-black">
                {isAdded ? "¡AÑADIDO AL CARRITO!" : "SELECCIONAR CANTIDAD"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-black transition-colors p-1.5 hover:bg-slate-100 rounded-none"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Product Summary Header Card */}
            <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-none">
              <div className="relative w-16 h-20 bg-slate-200 overflow-hidden shrink-0 rounded-none">
                <SafeImage
                  src={mainPhoto}
                  alt={product.name}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {product.color && (
                      <span
                        className="w-2.5 h-2.5 border border-slate-300 rounded-none inline-block shrink-0"
                        style={{ backgroundColor: hexBg }}
                        title={product.color}
                      />
                    )}
                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider line-clamp-1">
                      {product.type} {product.color && `· ${product.color}`}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-black uppercase tracking-wider line-clamp-1 mt-0.5">
                    {product.name}
                  </h4>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm text-black tracking-tight">
                    ${unitPrice.toFixed(2)}
                  </span>
                  {unitPrice < basePriceUsd && (
                    <span className="text-[10px] text-slate-400 line-through">
                      ${basePriceUsd.toFixed(2)}
                    </span>
                  )}
                  {volumeInfo.badgeLabel && (
                    <span className="text-[9px] font-semibold bg-black text-white px-1.5 py-0.2 rounded-none uppercase tracking-wider">
                      {volumeInfo.tier}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Volume Tier Incentive Progress Banner */}
            <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-none text-[10px] text-slate-600 font-normal space-y-1">
              {projectedTotalItems < 3 && (
                <div className="flex justify-between items-center">
                  <span>
                    {cartTotalCount > 0 ? (
                      <>
                        Tienes <strong className="text-black font-semibold">{cartTotalCount}</strong> en carrito + <strong className="text-black font-semibold">{itemQuantity}</strong> nueva ({projectedTotalItems} total) · Agrega <strong className="text-black font-semibold">{3 - projectedTotalItems}</strong> más para <strong>Precio Paquete</strong>
                      </>
                    ) : (
                      <>
                        Agrega <strong className="text-black font-semibold">{3 - projectedTotalItems}</strong> {3 - projectedTotalItems === 1 ? "prenda más" : "prendas más"} para activar <strong>Precio Paquete</strong>
                      </>
                    )}
                  </span>
                  <span className="text-[9px] bg-white px-1.5 py-0.5 border border-slate-300 font-bold uppercase shrink-0 ml-2 rounded-none">
                    Detal
                  </span>
                </div>
              )}

              {projectedTotalItems >= 3 && projectedTotalItems < 6 && (
                <div className="flex justify-between items-center text-emerald-700 font-medium">
                  <span>
                    {cartTotalCount > 0 ? (
                      <>
                        ✓ <strong>¡Precio Paquete activo!</strong> ({cartTotalCount} en carrito + {itemQuantity} nueva = {projectedTotalItems} total) · ¡Agrega <strong className="text-black font-semibold">{6 - projectedTotalItems}</strong> más para <strong>Docena</strong>!
                      </>
                    ) : (
                      <>
                        ✓ <strong>¡Precio Paquete activo!</strong> · ¡Agrega <strong className="text-black font-semibold">{6 - projectedTotalItems}</strong> más para <strong>Docena</strong>!
                      </>
                    )}
                  </span>
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 font-bold uppercase shrink-0 ml-2 rounded-none">
                    Paquete
                  </span>
                </div>
              )}

              {projectedTotalItems >= 6 && (
                <div className="flex justify-between items-center text-emerald-800 font-semibold">
                  <span>
                    {cartTotalCount > 0 ? (
                      <>
                        ★ <strong>¡Precio Docena activo!</strong> ({cartTotalCount} en carrito + {itemQuantity} nueva = {projectedTotalItems} prendas en total)
                      </>
                    ) : (
                      <>
                        ★ <strong>¡Precio Docena activo!</strong> (6+ prendas seleccionadas)
                      </>
                    )}
                  </span>
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 font-bold uppercase shrink-0 ml-2 rounded-none">
                    Docena
                  </span>
                </div>
              )}
            </div>

            {/* Size Selector */}
            {!isAdded && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold uppercase tracking-wider text-black">
                    TALLA SELECCIONADA: {selectedVariant?.size}
                  </span>
                  {selectedVariant && selectedVariant.stock_online <= 3 && selectedVariant.stock_online > 0 && (
                    <span className="text-[9px] text-amber-600 font-semibold uppercase tracking-wider">
                      ¡Solo {selectedVariant.stock_online} disponibles!
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const outOfStock = v.stock_online <= 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          if (!outOfStock) {
                            setSelectedVariant(v);
                            setQuantity(1);
                          }
                        }}
                        disabled={outOfStock}
                        className={`px-3.5 py-2 min-w-[44px] border text-xs font-semibold uppercase tracking-wider transition-all rounded-none ${
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
            )}

            {/* Quantity Selector Counter (Shein Style) */}
            {!isAdded && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold uppercase tracking-wider text-black">CANTIDAD A AGREGAR:</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Máximo: {selectedVariant?.stock_online || 1}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-black rounded-none overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                      aria-label="Restar cantidad"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-black select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(selectedVariant?.stock_online || 99, q + 1)
                        )
                      }
                      disabled={quantity >= (selectedVariant?.stock_online || 1)}
                      className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                      aria-label="Sumar cantidad"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>

                  {/* Preset quick buttons (Shein style) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[1, 2, 3, 6].map((presetQty) => (
                      <button
                        key={presetQty}
                        onClick={() =>
                          setQuantity(
                            Math.min(selectedVariant?.stock_online || 99, presetQty)
                          )
                        }
                        disabled={presetQty > (selectedVariant?.stock_online || 0)}
                        className={`px-2.5 py-1.5 text-[10px] font-bold border rounded-none transition-colors ${
                          quantity === presetQty
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-black disabled:opacity-30"
                        }`}
                      >
                        +{presetQty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subtotal Calculation Display */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-normal text-slate-500 uppercase tracking-wider">
                SUBTOTAL ({quantity} {quantity === 1 ? "unidad" : "unidades"}):
              </span>
              <div className="text-right">
                <span className="text-lg font-bold text-black tracking-tight block">
                  ${subtotalUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 bg-white space-y-2.5">
            {!isAdded ? (
              <button
                onClick={handleConfirmAdd}
                disabled={!selectedVariant || selectedVariant.stock_online <= 0}
                className="w-full bg-black hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold uppercase tracking-widest py-3.5 px-4 rounded-none transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
                {!selectedVariant || selectedVariant.stock_online <= 0
                  ? "AGOTADO EN TIENDA"
                  : `CONFIRMAR Y AÑADIR · $${subtotalUsd.toFixed(2)}`}
              </button>
            ) : (
              <div className="space-y-2.5 animate-in fade-in">
                {/* Success Banner */}
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-none flex items-center gap-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider justify-center">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  Prenda(s) añadida(s) correctamente
                </div>

                {/* Return / Cart Decision Buttons (Shein Shein UX) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleKeepShopping}
                    className="w-full bg-white hover:bg-slate-50 text-black border border-black text-[11px] font-semibold uppercase tracking-wider py-3 px-3 rounded-none transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> SEGUIR COMPRANDO
                  </button>

                  <button
                    onClick={handleGoToCheckout}
                    className="w-full bg-black hover:bg-slate-800 text-white text-[11px] font-semibold uppercase tracking-wider py-3 px-3 rounded-none transition-colors flex items-center justify-center gap-1.5"
                  >
                    FINALIZAR COMPRA <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
