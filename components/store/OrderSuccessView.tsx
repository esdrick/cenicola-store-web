"use client";

import React from "react";
import SafeImage from "@/components/ui/SafeImage";
import { Check, Truck, CreditCard, ArrowRight } from "lucide-react";

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
  orderData: OrderSuccessData;
  onGoToOrders: () => void;
  onContinueShopping: () => void;
}

function maskReference(ref: string | undefined | null): string {
  if (!ref) return "";
  const cleaned = String(ref).trim();
  if (cleaned.toUpperCase() === "EFECTIVO") return "EFECTIVO";
  if (cleaned.length <= 4) return `****${cleaned}`;
  return `****${cleaned.slice(-4)}`;
}

export default function OrderSuccessView({
  orderData,
  onGoToOrders,
  onContinueShopping,
}: Props) {
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

  const maskedRef = maskReference(reference);

  return (
    <div className="w-full max-w-2xl mx-auto py-10 sm:py-16 px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Top Icon & Thank You Heading */}
      <div className="text-center pb-8 border-b border-neutral-200">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-black mb-4">
          <Check className="w-6 h-6 text-black stroke-[2.5]" />
        </div>

        <span className="block text-[10px] uppercase tracking-[0.25em] font-semibold text-neutral-400 mb-1">
          Q´franelas
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest text-black">
          ¡Gracias por tu compra{customerName ? `, ${customerName}` : ""}!
        </h1>

        <div className="mt-3 inline-block font-mono text-xs font-bold text-black uppercase tracking-wider bg-neutral-100 px-3 py-1 border border-neutral-200">
          Nº de Pedido: #{orderNumber}
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="py-6 border-b border-neutral-200 text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-2">
        <p className="font-bold text-black uppercase tracking-wider text-xs">
          Estatus del Pedido: Pendiente de Verificación
        </p>
        <p>
          Hemos recibido tu orden correctamente. Tan pronto confirmemos la recepción de tu pago vía{" "}
          <strong className="text-black font-semibold">{paymentMethod}</strong>{" "}
          {reference && reference !== "EFECTIVO" ? <span>(Ref: <span className="font-mono">{maskedRef}</span>)</span> : null}, prepararemos tus prendas y te notificaremos a <strong className="text-black font-semibold">{customerEmail}</strong>.
        </p>
      </div>

      {/* Shipping & Payment Info Grid */}
      <div className="py-6 border-b border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-neutral-400 uppercase tracking-widest text-[10px] font-semibold">
            <Truck className="w-3.5 h-3.5" />
            <span>{shippingCompany?.toLowerCase().includes("retiro en tienda") ? "Modalidad de Entrega" : "Envío"}</span>
          </div>
          <p className="font-semibold text-black uppercase tracking-wide">{shippingCompany}</p>
          <p className="text-neutral-500">{address}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-neutral-400 uppercase tracking-widest text-[10px] font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Método de Pago</span>
          </div>
          <p className="font-semibold text-black uppercase tracking-wide">{paymentMethod}</p>
          {reference && <p className="text-neutral-500 font-mono">Ref: {maskedRef}</p>}
        </div>
      </div>

      {/* Special Store Pickup Banner */}
      {shippingCompany?.toLowerCase().includes("retiro en tienda") && (
        <div className="py-4 px-5 bg-slate-50 border border-slate-200 rounded-xs text-xs space-y-2 my-4">
          <p className="font-bold text-black uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
            🏪 Retiro Directo en Tienda ({shippingCompany.includes("Maracay") ? "Maracay" : "Caracas"})
          </p>
          <p className="text-slate-600 font-normal">
            📍 <strong>Dirección de Retiro:</strong> {address}
          </p>
          <p className="text-slate-600 font-normal">
            🕒 <strong>Horario de Atención:</strong> Lunes a Sábado: 9:00 AM – 5:00 PM
          </p>
          <p className="text-emerald-800 font-semibold pt-1">
            ⏱️ <strong>Plazo Estimado:</strong> Disponible para retirar en 24 a 48 horas hábiles.
          </p>
          {paymentMethod?.toLowerCase().includes("efectivo") && (
            <p className="text-black font-bold pt-1 border-t border-slate-200">
              💵 Monto a pagar en caja: <span className="font-mono text-sm">${totalUsd.toFixed(2)} USD</span> en efectivo (Divisas).
            </p>
          )}
        </div>
      )}

      {/* Product List */}
      <div className="py-6 border-b border-neutral-200">
        <div className="flex items-center justify-between pb-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-neutral-400">
          <span>Productos ({items.length})</span>
          <span>Subtotal</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {items.map((item, idx) => (
            <div key={idx} className="py-4 flex items-center gap-4">
              <div className="relative w-14 h-16 bg-neutral-100 border border-neutral-200 flex-shrink-0 overflow-hidden">
                <SafeImage
                  src={item.photo || "/placeholder.png"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-black truncate uppercase tracking-wide">
                  {item.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-wider mt-1">
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
      <div className="py-6 border-b border-neutral-200 flex items-center justify-between text-black">
        <div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Total de la Orden</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-black">${totalUsd.toFixed(2)} USD</p>
        </div>
        {totalVes && totalVes > 0 ? (
          <div className="text-right border-l border-neutral-200 pl-6">
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Equivalente BCV</p>
            <p className="text-sm sm:text-base font-mono font-bold text-neutral-700">Bs. {totalVes.toFixed(2)}</p>
          </div>
        ) : null}
      </div>

      {/* Action Buttons (Zara Style) */}
      <div className="pt-8 text-center space-y-4">
        <button
          type="button"
          onClick={onGoToOrders}
          className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-[0.2em] py-4 px-8 transition-all rounded-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Ver Estado en Mis Pedidos</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div>
          <button
            type="button"
            onClick={onContinueShopping}
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black underline transition-colors cursor-pointer font-medium"
          >
            Seguir Comprando
          </button>
        </div>
      </div>
    </div>
  );
}
