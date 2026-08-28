"use client";

import React from "react";
import SafeImage from "@/components/ui/SafeImage";
import {
  Check,
  Package,
  ShoppingBag,
  Truck,
  CreditCard,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";

export interface OrderSuccessData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  reference: string;
  shippingCompany: string;
  address: string;
  totalUsd: number;
  totalVes?: number;
  bcvRate?: number;
  items: Array<{
    name: string;
    size?: string;
    color?: string | null;
    quantity: number;
    unitPrice: number;
    subtotalUsd: number;
    photo?: string | null;
  }>;
}

interface Props {
  isOpen: boolean;
  isProcessing?: boolean;
  orderData: OrderSuccessData | null;
  onClose: () => void;
  onGoToOrders: () => void;
  onContinueShopping: () => void;
}

export default function OrderSuccessModal({
  isOpen,
  isProcessing = false,
  orderData,
  onClose,
  onGoToOrders,
  onContinueShopping,
}: Props) {
  if (!isOpen) return null;

  // 1. STATE: Minimalist "Procesando Pedido..." Loading Screen
  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 sm:p-10 text-center shadow-2xl rounded-xs animate-in zoom-in-95 duration-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 border border-slate-200 rounded-full mb-6 relative">
            <Loader2 className="w-8 h-8 text-black animate-spin" />
          </div>

          <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-1">
            Q´franelas
          </span>

          <h3 className="text-base sm:text-lg font-bold uppercase tracking-widest text-black mb-2">
            Procesando tu pedido...
          </h3>

          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Estamos registrando tu orden, verificando la disponibilidad de inventario y procesando los datos de pago.
          </p>

          <div className="mt-6 w-full bg-slate-100 h-1 overflow-hidden rounded-full">
            <div className="bg-black h-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  const {
    orderNumber,
    customerName,
    customerEmail,
    paymentMethod,
    reference,
    shippingCompany,
    address,
    totalUsd,
    totalVes,
    items,
  } = orderData;

  // 2. STATE: Lefties-Style Minimalist "Pedido Confirmado" Receipt Screen
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] rounded-xs animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Minimalist Header */}
        <div className="bg-white border-b border-slate-200 p-6 text-center relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black transition-colors rounded-xs"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-3">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>

          <span className="block text-[10px] uppercase tracking-[0.25em] font-semibold text-slate-400 mb-1">
            Transacción Exitosa
          </span>

          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-black">
            ¡Pedido Confirmado!
          </h2>

          <p className="mt-1 text-xs text-slate-500 uppercase tracking-wider font-medium">
            Gracias por tu compra{customerName ? `, ${customerName}` : ""}
          </p>

          <div className="mt-3 inline-block bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-mono font-bold text-black uppercase tracking-wider">
            Nº de Pedido: #{orderNumber}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-black">
          {/* Status Message Box (White Card) */}
          <div className="bg-white border border-slate-200 rounded-xs p-4 text-xs text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-black uppercase tracking-wider text-[11px]">
              Estatus del Pedido: Pendiente de Verificación
            </p>
            <p>
              Hemos recibido tu orden correctamente. Tan pronto confirmemos la recepción de tu pago vía{" "}
              <strong className="text-black">{paymentMethod}</strong>{" "}
              {reference && reference !== "EFECTIVO" ? <span>(Ref: <span className="font-mono">{reference}</span>)</span> : null}, prepararemos tus prendas y te notificaremos a <strong className="text-black">{customerEmail}</strong>.
            </p>
          </div>

          {/* Shipping & Payment Minimal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border border-slate-200 p-3 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                <Truck className="w-3.5 h-3.5" />
                <span>Envío</span>
              </div>
              <p className="font-semibold text-black uppercase tracking-wide truncate">{shippingCompany}</p>
              <p className="text-slate-500 text-[11px] truncate">{address}</p>
            </div>

            <div className="border border-slate-200 p-3 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Método de Pago</span>
              </div>
              <p className="font-semibold text-black uppercase tracking-wide truncate">{paymentMethod}</p>
              {reference && <p className="text-slate-500 font-mono text-[11px] truncate">Ref: {reference}</p>}
            </div>
          </div>

          {/* Items Summary Table */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 text-[10px] uppercase tracking-widest font-semibold text-slate-400">
              <span>Productos ({items.length})</span>
              <span>Subtotal</span>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center gap-3">
                  <div className="relative w-12 h-14 bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden">
                    <SafeImage
                      src={item.photo || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-black truncate uppercase tracking-wide">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                      {item.size && <span>Talla: {item.size}</span>}
                      {item.color && <span>• Color: {item.color}</span>}
                      <span>• Cant: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 font-mono text-xs font-bold text-black">
                    ${item.subtotalUsd.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-black">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total de la Orden</p>
              <p className="text-xl font-mono font-bold text-black">${totalUsd.toFixed(2)} USD</p>
            </div>
            {totalVes && totalVes > 0 ? (
              <div className="text-right border-l border-slate-200 pl-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Equivalente BCV</p>
                <p className="text-sm font-mono font-bold text-slate-700">Bs. {totalVes.toFixed(2)}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Minimalist Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onContinueShopping}
            className="w-full sm:w-auto px-5 py-3 border border-black text-black hover:bg-slate-50 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-xs cursor-pointer order-2 sm:order-1"
          >
            <ShoppingBag className="w-4 h-4" />
            Seguir Comprando
          </button>

          <button
            type="button"
            onClick={onGoToOrders}
            className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all rounded-xs cursor-pointer order-1 sm:order-2"
          >
            <Package className="w-4 h-4" />
            Ver Estado en Mis Pedidos
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
