"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus } from "lucide-react";
import { getVolumeTierInfo } from "@/lib/whatsapp";

export type CartItemType = {
  variant_id: string;
  product_id: string;
  name: string;
  size: string;
  color?: string | null;
  photo?: string | null;
  price_usd: number;
  price_divisas_usd?: number;
  price_bundle_usd?: number;
  price_bundle_divisas_usd?: number;
  price_mayor_usd?: number;
  price_mayor_divisas_usd?: number;
  quantity: number;
  stock_online: number;
};

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemType[];
  onUpdateQuantity: (variant_id: string, quantity: number) => void;
  onRemoveItem: (variant_id: string) => void;
  bcvRate?: number;
};

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  bcvRate = 1,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Compute calculated items with volume tier prices based on total items in cart
  const itemsWithTier = items.map((item) => {
    const tierInfo = getVolumeTierInfo(item.quantity, item, totalCartCount);
    const unitPrice = tierInfo.effectiveUnitPrice;
    const subtotalUsd = unitPrice * item.quantity;
    const subtotalVes = subtotalUsd * bcvRate;
    return {
      ...item,
      tierInfo,
      effectiveUnitPrice: unitPrice,
      subtotalUsd,
      subtotalVes,
    };
  });

  const totalUsd = itemsWithTier.reduce((sum, item) => sum + item.subtotalUsd, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-sm sm:max-w-md bg-white flex flex-col justify-between shadow-xl text-black">
          {/* Lefties Minimalist Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-normal uppercase tracking-widest text-black">
              MI CARRITO ({totalCartCount})
            </h2>
            <button
              onClick={onClose}
              className="text-black hover:opacity-60 transition-opacity p-1"
              aria-label="Cerrar carrito"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          {/* Global Volume Tier Status Bar */}
          {items.length > 0 && (
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-normal text-center">
              {totalCartCount < 3 && (
                <span>Agrega {3 - totalCartCount} {3 - totalCartCount === 1 ? "prenda más" : "prendas más"} para precio Paquete</span>
              )}
              {totalCartCount >= 3 && totalCartCount < 6 && (
                <span>Precio Paquete activo · Agrega {6 - totalCartCount} más para precio Docena</span>
              )}
              {totalCartCount >= 6 && (
                <span>Precio de Docena activo en todas tus prendas</span>
              )}
            </div>
          )}

          {/* Cart Items Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                <ShoppingBag className="w-8 h-8 text-slate-300 stroke-[1.2]" />
                <h3 className="text-xs font-normal uppercase tracking-widest text-black">
                  TU CARRITO ESTÁ VACÍO
                </h3>
                <p className="text-[11px] text-slate-400 max-w-xs font-normal">
                  Explora las prendas de la colección y añádelas al carrito.
                </p>
                <Link
                  href="/catalogo"
                  onClick={onClose}
                  className="mt-3 inline-block bg-black text-white px-6 py-3 text-[11px] font-normal uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                  VER COLECCIÓN
                </Link>
              </div>
            ) : (
              itemsWithTier.map((item) => {
                const photo = item.photo || null;
                const { effectiveUnitPrice, subtotalUsd } = item;

                return (
                  <div
                    key={item.variant_id}
                    className="flex gap-3 py-3 border-b border-slate-100 items-start relative"
                  >
                    {/* Fixed Size Thumbnail (Guaranteed fixed dimensions, never stretches) */}
                    <Link
                      href={`/producto/${item.product_id}`}
                      onClick={onClose}
                      className="relative w-16 h-20 bg-slate-100 overflow-hidden shrink-0 block"
                    >
                      {photo ? (
                        <Image
                          src={photo}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 uppercase">
                          SIN FOTO
                        </div>
                      )}
                    </Link>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 pr-6 space-y-1">
                      <p className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
                        TALLA {item.size}{item.color && ` · ${item.color}`}
                      </p>

                      <Link
                        href={`/producto/${item.product_id}`}
                        onClick={onClose}
                        className="font-normal text-xs uppercase tracking-wider text-black line-clamp-1 hover:opacity-60 transition-opacity block"
                      >
                        {item.name}
                      </Link>

                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-xs font-semibold text-black">
                          ${subtotalUsd.toFixed(2)}
                        </span>
                        {effectiveUnitPrice < item.price_usd && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ${(item.price_usd * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Compact Minimal Quantity Controls */}
                      <div className="pt-2 flex items-center gap-2">
                        <div className="flex items-center border border-slate-200">
                          <button
                            onClick={() => onUpdateQuantity(item.variant_id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-black transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-normal">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.variant_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_online}
                            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-black transition-colors disabled:opacity-20"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => onRemoveItem(item.variant_id)}
                      className="absolute top-3 right-0 text-slate-400 hover:text-black transition-colors p-1"
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.2]" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Lefties Minimalist Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-white space-y-4">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-normal text-slate-500 uppercase tracking-wider text-[11px]">
                  TOTAL:
                </span>
                <span className="font-semibold text-black text-base tracking-tight">
                  ${totalUsd.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full bg-black hover:bg-slate-800 text-white text-center py-3.5 px-4 text-xs font-normal uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                FINALIZAR PEDIDO <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
