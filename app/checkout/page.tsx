"use client";

import { useState, useEffect } from "react";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import SearchDrawer from "@/components/store/SearchDrawer";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { getVolumeTierInfo, getWhatsAppUrl, type WhatsAppOrderPayload } from "@/lib/whatsapp";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(1);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerLastname, setCustomerLastname] = useState("");
  const [docType, setDocType] = useState("V");
  const [docNumber, setDocNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("Pago Móvil");

  // Load Cart & BCV Rate
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cenicola_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      setCart([]);
    }

    // Check logged in customer session
    fetch("/api/store/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.customer) {
          setCustomerName(data.customer.name || "");
          setCustomerLastname(data.customer.lastname || "");
          setDocType(data.customer.doc_type || "V");
          setDocNumber(data.customer.doc_number || "");
          setPhone(data.customer.phone || "");
          setAddress(data.customer.address || "");
        }
      })
      .catch(() => null);

    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.bcv_rate) setBcvRate(data.bcv_rate);
      })
      .catch(() => null);
  }, []);

  const saveCart = (newCart: CartItemType[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("cenicola_cart", JSON.stringify(newCart));
    } catch {
      // ignore
    }
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

  // Determine if selected payment method uses Divisas discount
  const isDivisasPayment = ["Zelle", "USDT"].includes(selectedPaymentType);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Compute cart with Payment Method (BCV vs Divisa) & Volume Tier Pricing (Sum of all items in cart)
  const cartWithTiers = cart.map((item) => {
    const activeBasePrice = isDivisasPayment
      ? (item.price_divisas_usd && item.price_divisas_usd > 0 ? item.price_divisas_usd : item.price_usd)
      : item.price_usd;

    const activeBundlePrice = isDivisasPayment
      ? (item.price_bundle_divisas_usd && item.price_bundle_divisas_usd > 0 ? item.price_bundle_divisas_usd : item.price_bundle_usd)
      : item.price_bundle_usd;

    const activeMayorPrice = isDivisasPayment
      ? (item.price_mayor_divisas_usd && item.price_mayor_divisas_usd > 0 ? item.price_mayor_divisas_usd : item.price_mayor_usd)
      : item.price_mayor_usd;

    const tierInfo = getVolumeTierInfo(
      item.quantity,
      {
        ...item,
        price_usd: activeBasePrice,
        price_bundle_usd: activeBundlePrice,
        price_mayor_usd: activeMayorPrice,
      },
      totalCartCount
    );

    const unitPrice = tierInfo.effectiveUnitPrice;
    const bcvSubtotal = item.price_usd * item.quantity;
    const subtotalUsd = unitPrice * item.quantity;
    const divisaDiscountAmount = (item.price_usd - activeBasePrice) * item.quantity;

    return {
      ...item,
      activeBasePrice,
      tierInfo,
      effectiveUnitPrice: unitPrice,
      bcvSubtotal,
      subtotalUsd,
      divisaDiscountAmount: Math.max(0, divisaDiscountAmount),
    };
  });

  const totalRegularBcvUsd = cartWithTiers.reduce((sum, item) => sum + item.bcvSubtotal, 0);
  const totalDivisasDiscountUsd = cartWithTiers.reduce((sum, item) => sum + item.divisaDiscountAmount, 0);
  const totalUsd = cartWithTiers.reduce((sum, item) => sum + item.subtotalUsd, 0);
  const totalVolumeDiscountUsd = Math.max(0, totalRegularBcvUsd - totalDivisasDiscountUsd - totalUsd);
  const totalVes = totalUsd * bcvRate;

  // Build WhatsApp payload & redirect
  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = `${customerName} ${customerLastname}`.trim() || "Cliente Web";
    const fullDoc = docNumber.trim() ? `${docType}-${docNumber.trim()}` : "No especificado";

    const payload: WhatsAppOrderPayload = {
      customerName: fullName,
      docNumber: fullDoc,
      customerPhone: phone.trim() || "No especificado",
      address: address.trim() || "Retiro / Por coordinar",
      paymentMethod: selectedPaymentType,
      notes: notes.trim() || undefined,
      bcvRate,
      items: cartWithTiers.map((i) => ({
        variant_id: i.variant_id,
        product_name: i.name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        unit_price_usd: i.effectiveUnitPrice,
        tier: i.tierInfo.tier,
        subtotal_usd: i.subtotalUsd,
      })),
      totalUsd,
      totalVes,
    };

    const url = getWhatsAppUrl(payload);
    window.open(url, "_blank");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans text-black">
        <StoreNavbar cartCount={0} onOpenCart={() => setCartDrawerOpen(true)} bcvRate={bcvRate} />
        <main className="w-full max-w-3xl mx-auto px-4 py-20 flex-1 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-normal uppercase tracking-wider text-black">Tu bolsa de compras está vacía</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Agrega prendas a tu bolsa de compras antes de finalizar el pedido.
          </p>
          <Link
            href="/catalogo"
            className="inline-block bg-black text-white px-6 py-3 text-xs font-normal uppercase tracking-widest hover:bg-slate-800 transition-colors rounded-xs"
          >
            Explorar Catálogo de Ropa
          </Link>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black" suppressHydrationWarning>
      <StoreNavbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        bcvRate={bcvRate}
      />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Lefties Minimal Back Link */}
        <div className="mb-6 border-b border-slate-100 pb-3 flex items-center justify-between">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1 text-xs font-normal uppercase tracking-wider text-black hover:opacity-60 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la colección
          </Link>
          <h1 className="text-xs font-normal uppercase tracking-widest text-slate-500">
            FINALIZAR PEDIDO
          </h1>
        </div>

        <form onSubmit={handleSendWhatsApp} className="space-y-8">
          {/* SECTION 1 (TOP): RESUMEN DE PEDIDO DETALLADO */}
          <section className="border border-slate-200 p-5 sm:p-7 space-y-5 bg-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                1. RESUMEN DE TU PEDIDO ({cart.reduce((s, i) => s + i.quantity, 0)} PRENDAS)
              </h2>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="text-[11px] text-slate-500 hover:text-black underline uppercase"
              >
                Editar
              </button>
            </div>

            {/* Itemized List */}
            <div className="divide-y divide-slate-100">
              {cartWithTiers.map((item) => (
                <div key={item.variant_id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  {/* Photo & Item Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 aspect-[3/4] bg-slate-100 shrink-0 overflow-hidden rounded-xs">
                      <SafeImage src={item.photo} alt={item.name} fill sizes="60px" className="object-cover" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-black uppercase tracking-wider line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Talla: <span className="font-semibold text-black">{item.size}</span>
                        {item.color && ` | Color: ${item.color}`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Cantidad: <span className="font-semibold text-black">{item.quantity}</span> x ${item.effectiveUnitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Subtotal & Tier Badge */}
                  <div className="text-right shrink-0 space-y-0.5">
                    <span className="font-bold text-black text-sm block">
                      ${item.subtotalUsd.toFixed(2)}
                    </span>
                    {item.tierInfo.tier !== "detal" && (
                      <span className="text-[9px] font-semibold text-black bg-slate-100 px-1.5 py-0.5 uppercase tracking-wider block">
                        {item.tierInfo.badgeLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Totals & Detailed Discount Breakdown (USD Only) */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal base (BCV):</span>
                <span>${totalRegularBcvUsd.toFixed(2)}</span>
              </div>

              {isDivisasPayment && totalDivisasDiscountUsd > 0 && (
                <div className="flex justify-between items-center text-black font-normal bg-slate-50 p-2 border border-slate-200 uppercase tracking-wider text-[11px]">
                  <span>Descuento divisa aplicado:</span>
                  <span className="font-semibold">-${totalDivisasDiscountUsd.toFixed(2)}</span>
                </div>
              )}

              {totalVolumeDiscountUsd > 0 && (
                <div className="flex justify-between items-center text-black font-normal bg-slate-50 p-2 border border-slate-200 uppercase tracking-wider text-[11px]">
                  <span>Descuento paquete/docena aplicado:</span>
                  <span className="font-semibold">-${totalVolumeDiscountUsd.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-black">
                <span className="font-bold uppercase tracking-wider text-sm">TOTAL GENERAL:</span>
                <span className="font-extrabold text-2xl tracking-tight">
                  ${totalUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 2: DATOS DE CLIENTE */}
          <section className="border border-slate-200 p-5 sm:p-7 space-y-4 bg-white">
            <div className="pb-3 border-b border-slate-200">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                2. DATOS DE ENVÍO Y CONTACTO
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs"
                  placeholder="Ej. María"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={customerLastname}
                  onChange={(e) => setCustomerLastname(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs"
                  placeholder="Ej. Pérez"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Cédula / RIF
                </label>
                <div className="flex gap-2">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="px-2 py-2 border border-slate-300 text-xs text-black bg-slate-50 font-semibold focus:outline-none focus:border-black rounded-xs"
                  >
                    <option value="V">V-</option>
                    <option value="J">J-</option>
                    <option value="E">E-</option>
                    <option value="P">P-</option>
                  </select>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs"
                    placeholder="12345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs"
                  placeholder="Ej. 04121234567"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Dirección de Envío / Agencia (MRW, Zoom, Tealca)
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs"
                  placeholder="Ej. Agencia MRW Sabana Grande, Caracas / o dirección de entrega..."
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: MÉTODO DE PAGO (LISTA DESPLEGABLE) & NOTA */}
          <section className="border border-slate-200 p-5 sm:p-7 space-y-4 bg-white">
            <div className="pb-3 border-b border-slate-200">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                3. MÉTODO DE PAGO Y NOTAS DE ENTREGA
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Selecciona Método de Pago Preferido:
                </label>
                <select
                  value={selectedPaymentType}
                  onChange={(e) => setSelectedPaymentType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 text-xs font-semibold text-black bg-white focus:outline-none focus:border-black rounded-xs uppercase tracking-wider"
                >
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Zelle">Zelle</option>
                  <option value="USDT">USDT</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Nota Opcional de Entrega
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs"
                  placeholder="Ej. Horario de entrega o detalles de empaque..."
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: BOTÓN PRINCIPAL ENVIAR POR WHATSAPP */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="w-full bg-black hover:bg-slate-800 text-white font-normal py-4 px-6 text-xs uppercase tracking-widest flex items-center justify-center transition-all rounded-xs shadow-sm hover:shadow active:scale-[0.99]"
            >
              ENVIAR PEDIDO
            </button>
            <p className="text-[11px] text-slate-500 text-center uppercase tracking-wider font-normal">
              Envía el pedido y un agente de atención se contactará contigo para finalizar la compra.
            </p>
          </div>
        </form>
      </main>

      <SearchDrawer
        isOpen={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        onSearchSubmit={(q) => router.push(`/catalogo?q=${encodeURIComponent(q)}`)}
      />

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        bcvRate={bcvRate}
      />

      <StoreFooter />
    </div>
  );
}
