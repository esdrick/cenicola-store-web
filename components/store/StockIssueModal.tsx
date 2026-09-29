"use client";

import { useEffect } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";
import { X } from "lucide-react";

export type AffectedStockItem = {
  variant_id: string;
  name: string;
  size: string;
  color?: string | null;
  photo?: string | null;
  requested_quantity: number;
  available_stock: number;
  is_out_of_stock: boolean;
  is_insufficient_stock: boolean;
};

interface StockIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  affectedItems: AffectedStockItem[];
  hasOutOfStock: boolean;
  hasInsufficientStock: boolean;
  onRemoveOutOfStock: () => void;
  onAdjustQuantities: () => void;
  onOpenCart?: () => void;
}

export default function StockIssueModal({
  isOpen,
  onClose,
  affectedItems,
  hasOutOfStock,
  hasInsufficientStock,
  onRemoveOutOfStock,
  onAdjustQuantities,
  onOpenCart,
}: StockIssueModalProps) {
  const isVisible = isOpen && affectedItems && affectedItems.length > 0;

  // Lock body scroll only when modal is visibly rendered, and restore on dismiss/resolve
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleQuickFix = () => {
    if (hasOutOfStock) {
      onRemoveOutOfStock();
    } else if (hasInsufficientStock) {
      onAdjustQuantities();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xs max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3.5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
              Disponibilidad Online
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-black">
              Actualización de Cesta
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-black transition-colors cursor-pointer rounded-xs"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative text */}
        <p className="text-xs text-slate-600 font-normal leading-relaxed">
          {hasOutOfStock
            ? "Uno o más artículos seleccionados se han agotado en nuestro inventario. Elimínalos para continuar con tu compra."
            : "Algunas cantidades en tu pedido superan las unidades disponibles actualmente. Ajusta el stock para continuar."}
        </p>

        {/* Affected Items List */}
        <div className="border border-slate-200 rounded-xs divide-y divide-slate-100 max-h-52 overflow-y-auto bg-slate-50/50">
          {affectedItems.map((item) => (
            <div
              key={item.variant_id}
              className="p-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 aspect-[3/4] bg-slate-100 shrink-0 overflow-hidden border border-slate-200 rounded-xs">
                  {item.photo ? (
                    <SafeImage
                      src={getOptimizedCloudinaryUrl(item.photo, 400)}
                      alt={item.name}
                      fill
                      sizes="50px"
                      cloudinaryWidth={400}
                      loading="lazy"
                      className="object-cover grayscale contrast-75"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 uppercase">
                      Foto
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-black uppercase tracking-wider text-[11px] truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    Talla: {item.size} {item.color ? `· Color: ${item.color}` : ""}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Solicitados: <span className="font-mono font-medium text-slate-700">{item.requested_quantity}</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {item.is_out_of_stock ? (
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1 rounded-xs">
                    Agotado
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold uppercase tracking-wider bg-white text-slate-800 border border-slate-300 px-2 py-1 rounded-xs">
                    Stock: {item.available_stock}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleQuickFix}
            className="w-full bg-black hover:bg-slate-800 text-white font-semibold py-3.5 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-xs shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <span>
              {hasOutOfStock
                ? "Eliminar agotados y continuar"
                : "Ajustar al stock disponible"}
            </span>
          </button>

          {onOpenCart && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="w-full text-center text-[10px] uppercase tracking-widest font-semibold text-slate-500 hover:text-black underline transition-colors cursor-pointer py-1 block"
            >
              Modificar mi cesta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
