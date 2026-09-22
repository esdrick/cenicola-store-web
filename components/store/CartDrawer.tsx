"use client";

import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus, RefreshCw } from "lucide-react";
import { getVolumeTierInfo } from "@/lib/whatsapp";
import { useCart } from "./CartContext";

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
  isOpen?: boolean;
  onClose?: () => void;
  items?: CartItemType[];
  onUpdateQuantity?: (variant_id: string, quantity: number) => void;
  onRemoveItem?: (variant_id: string) => void;
  bcvRate?: number;
};

export default function CartDrawer({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  items: propsItems,
  onUpdateQuantity: propsOnUpdateQuantity,
  onRemoveItem: propsOnRemoveItem,
  bcvRate = 1,
}: CartDrawerProps) {
  const contextValues = useCart();

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : contextValues.isCartOpen;
  const onClose = propsOnClose || contextValues.closeCart;
  const items = propsItems !== undefined ? propsItems : contextValues.cart;
  const onUpdateQuantity = propsOnUpdateQuantity || contextValues.updateQuantity;
  const onRemoveItem = propsOnRemoveItem || contextValues.removeFromCart;

  const isValidatingStock = contextValues.isValidatingStock;
  const removeOutOfStockItems = contextValues.removeOutOfStockItems;
  const adjustQuantitiesToAvailableStock = contextValues.adjustQuantitiesToAvailableStock;
  const getItemStockStatus = contextValues.getItemStockStatus;

  if (!isOpen) return null;

  const totalCartCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Compute calculated items with volume tier prices based on total items in cart
  const itemsWithTier = items.map((item) => {
    const tierInfo = getVolumeTierInfo(item.quantity, item, totalCartCount);
    const unitPrice = tierInfo.effectiveUnitPrice;
    const subtotalUsd = unitPrice * item.quantity;
    const subtotalVes = subtotalUsd * bcvRate;
    const stockStatus = getItemStockStatus ? getItemStockStatus(item.variant_id) : undefined;
    const isOutOfStock =
      stockStatus?.status === "out_of_stock" ||
      stockStatus?.status === "inactive" ||
      stockStatus?.status === "not_found" ||
      (stockStatus ? stockStatus.available_stock <= 0 : false);
    const isInsufficientStock =
      stockStatus?.status === "insufficient_stock" ||
      (stockStatus && !isOutOfStock ? item.quantity > stockStatus.available_stock : false);

    return {
      ...item,
      tierInfo,
      effectiveUnitPrice: unitPrice,
      subtotalUsd,
      subtotalVes,
      stockStatus,
      isOutOfStock,
      isInsufficientStock,
    };
  });

  const hasAnyOutOfStock = itemsWithTier.some((i) => i.isOutOfStock);
  const hasAnyInsufficientStock = itemsWithTier.some((i) => i.isInsufficientStock);

  // Only calculate total for active/in-stock items
  const validItemsWithTier = itemsWithTier.filter((i) => !i.isOutOfStock);
  const rawTotalUsd = validItemsWithTier.reduce((sum, item) => sum + item.subtotalUsd, 0);
  const totalUsd = Math.ceil(rawTotalUsd);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-sm sm:max-w-md bg-white flex flex-col justify-between shadow-2xl text-black">
          {/* Lefties Minimalist Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-normal uppercase tracking-widest text-black">
                MI CESTA ({totalCartCount})
              </h2>
              {isValidatingStock && (
                <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
              )}
            </div>
            <button
              onClick={onClose}
              className="text-black hover:opacity-60 transition-opacity p-1"
              aria-label="Cerrar carrito"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          {/* Zara/Lefties Minimalist Stock Alert Banner */}
          {hasAnyOutOfStock && (
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 text-slate-800 transition-all">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-black">
                Prendas no disponibles
              </p>
              <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-0.5">
                Algunos artículos de tu cesta se han agotado. Te invitamos a seguir descubriendo nuestra colección.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={removeOutOfStockItems}
                  className="text-[10px] uppercase tracking-widest font-semibold text-black underline hover:opacity-60 transition-opacity cursor-pointer"
                >
                  Limpiar agotados
                </button>
                <span className="text-slate-300">•</span>
                <Link
                  href="/catalogo"
                  onClick={onClose}
                  className="text-[10px] uppercase tracking-widest font-medium text-slate-500 hover:text-black transition-colors"
                >
                  Ver colección
                </Link>
              </div>
            </div>
          )}

          {hasAnyInsufficientStock && !hasAnyOutOfStock && (
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 text-slate-800 transition-all">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-black">
                Stock limitado
              </p>
              <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-0.5">
                Algunas cantidades superan las unidades disponibles actualmente.
              </p>
              <button
                onClick={adjustQuantitiesToAvailableStock}
                className="mt-2 text-[10px] uppercase tracking-widest font-semibold text-black underline hover:opacity-60 transition-opacity cursor-pointer"
              >
                Ajustar cantidades al máximo
              </button>
            </div>
          )}

          {/* Global Volume Tier Status Bar */}
          {items.length > 0 && !hasAnyOutOfStock && (
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-normal text-center">
              {totalCartCount < 3 && (
                <span>Agrega {3 - totalCartCount} {3 - totalCartCount === 1 ? "prenda más" : "prendas más"} para precio Paquete</span>
              )}
              {totalCartCount >= 3 && totalCartCount < 6 && (
                <span>Precio Paquete activo · Agrega {6 - totalCartCount} más para precio al Mayor</span>
              )}
              {totalCartCount >= 6 && (
                <span>Precio al Mayor activo en todas tus prendas</span>
              )}
            </div>
          )}

          {/* Cart Items Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                <ShoppingBag className="w-8 h-8 text-slate-300 stroke-[1.2]" />
                <h3 className="text-xs font-normal uppercase tracking-widest text-black">
                  TU CESTA ESTÁ VACÍA
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
                const { effectiveUnitPrice, subtotalUsd, isOutOfStock, isInsufficientStock, stockStatus } = item;
                const availableStock = stockStatus ? stockStatus.available_stock : item.stock_online;

                return (
                  <div
                    key={item.variant_id}
                    className={`flex gap-3 py-3 border-b border-slate-100 items-start relative transition-opacity ${
                      isOutOfStock ? "opacity-50" : ""
                    }`}
                  >
                    {/* Fixed Size Thumbnail */}
                    <div className="relative w-16 h-20 bg-slate-100 overflow-hidden shrink-0 block">
                      <Link
                        href={`/producto/${item.product_id}`}
                        onClick={onClose}
                        className="w-full h-full block"
                      >
                        <SafeImage
                          src={photo}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className={`object-cover object-center ${isOutOfStock ? "grayscale contrast-75" : ""}`}
                        />
                      </Link>

                      {/* Minimalist Monochrome Out of Stock Badge */}
                      {isOutOfStock && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/85 text-white text-[7.5px] font-medium tracking-widest text-center py-0.5 uppercase">
                          AGOTADO
                        </div>
                      )}
                    </div>

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

                      {isOutOfStock ? (
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider pt-0.5">
                          Agotado temporalmente
                        </p>
                      ) : (
                        <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-black">
                            ${subtotalUsd.toFixed(2)}
                          </span>
                          {effectiveUnitPrice < item.price_usd && (
                            <>
                              <span className="text-[10px] text-slate-400 line-through">
                                ${(item.price_usd * item.quantity).toFixed(2)}
                              </span>
                              <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs uppercase tracking-wider">
                                ${effectiveUnitPrice.toFixed(2)} c/u
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Insufficient Stock Warning */}
                      {isInsufficientStock && !isOutOfStock && (
                        <div className="pt-1">
                          <span className="inline-block text-[9px] font-normal text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 uppercase tracking-wider">
                            Solo quedan {availableStock} {availableStock === 1 ? "unidad" : "unidades"}
                          </span>
                        </div>
                      )}

                      {/* Quantity Controls or Out of Stock Action */}
                      {isOutOfStock ? (
                        <div className="pt-1.5">
                          <button
                            onClick={() => onRemoveItem(item.variant_id)}
                            className="text-[10px] text-slate-400 hover:text-black underline uppercase tracking-wider font-normal cursor-pointer transition-colors"
                          >
                            Eliminar de la cesta
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 flex items-center gap-2">
                          <div className="flex items-center border border-slate-200">
                            <button
                              onClick={() => onUpdateQuantity(item.variant_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-black transition-colors disabled:opacity-20 disabled:pointer-events-none"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-normal">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.variant_id, item.quantity + 1)}
                              disabled={item.quantity >= availableStock}
                              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-black transition-colors disabled:opacity-20"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          {availableStock > 0 && availableStock <= 3 && item.quantity >= availableStock && (
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                              Máx. disp.
                            </span>
                          )}
                        </div>
                      )}
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

              {hasAnyOutOfStock ? (
                <div className="space-y-1.5">
                  <button
                    disabled
                    className="w-full bg-slate-200 text-slate-400 text-center py-3.5 px-4 text-xs font-normal uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed select-none"
                  >
                    FINALIZAR PEDIDO <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-normal">
                    Elimina las prendas agotadas para continuar
                  </p>
                </div>
              ) : hasAnyInsufficientStock ? (
                <div className="space-y-1.5">
                  <button
                    disabled
                    className="w-full bg-slate-200 text-slate-400 text-center py-3.5 px-4 text-xs font-normal uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed select-none"
                  >
                    FINALIZAR PEDIDO <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-normal">
                    Ajusta las cantidades disponibles para continuar
                  </p>
                </div>
              ) : (
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full bg-black hover:bg-slate-800 text-white text-center py-3.5 px-4 text-xs font-normal uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  FINALIZAR PEDIDO <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
