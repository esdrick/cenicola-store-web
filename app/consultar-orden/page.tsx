"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import SearchDrawer from "@/components/store/SearchDrawer";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";
import { useWishlist } from "@/components/store/WishlistContext";
import OrderProgressStepper from "@/components/store/OrderProgressStepper";
import {
  ArrowLeft,
  Clock,
  Package,
  Truck,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Upload,
} from "lucide-react";
import ReuploadPaymentModal from "@/components/store/ReuploadPaymentModal";

type OrderPaymentResult = {
  id?: string;
  payment_type: string;
  amount_usd?: number;
  amount_ves?: number | null;
  reference?: string;
  status?: string;
  rejection_reason?: string | null;
  payment_photo?: string | null;
};

type OrderSearchResult = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_lastname: string;
  customer_id_doc?: string;
  total_usd: number;
  total_bcv_usd?: number;
  total_divisas_usd?: number;
  pricing_method?: string;
  created_at: string;
  payments?: OrderPaymentResult[];
  items: Array<{
    id: string;
    product_name: string;
    size: string;
    color?: string;
    quantity: number;
    subtotal_usd: number;
  }>;
};

export default function ConsultarOrdenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center p-4 text-xs font-mono">Cargando...</div>}>
      <ConsultarOrdenContent />
    </Suspense>
  );
}

function ConsultarOrdenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramOrder = searchParams?.get("order") || "";
  const paramEmail = searchParams?.get("email") || "";

  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OrderSearchResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false);
  const [selectedReuploadOrder, setSelectedReuploadOrder] = useState<{
    orderNumber: string;
    email: string;
    isDivisasOrder: boolean;
  } | null>(null);

  // Navbar, Carrito, Búsqueda y Lista de Deseos
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [bcvRate, setBcvRate] = useState<number>(1);
  const { wishlistCount } = useWishlist();

  const performSearch = (searchEmail: string, searchOrderNum: string) => {
    if (!searchEmail.trim() || !searchOrderNum.trim()) {
      setErrorMsg("Ingresa tu correo y número de pedido.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResults(null);

    fetch("/api/store/orders/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: searchEmail.trim(), order_number: searchOrderNum.trim() }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.error) {
          setErrorMsg(data.error);
        } else if (data.orders && data.orders.length > 0) {
          setResults(data.orders);
          setExpandedOrderIds(data.orders.map((o: OrderSearchResult) => o.id));
        } else {
          setErrorMsg("No se encontró ningún pedido que coincida con ese Correo y Número de Pedido.");
        }
      })
      .catch(() => {
        setLoading(false);
        setErrorMsg("Error de conexión al consultar el pedido.");
      });
  };

  const handleReuploadSuccess = () => {
    if (email.trim() && orderNumber.trim()) {
      performSearch(email, orderNumber);
    }
  };

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cenicola_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error("Error loading cart:", e);
    }

    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.bcv_rate) setBcvRate(data.bcv_rate);
      })
      .catch(() => null);

    if (paramOrder.trim() && paramEmail.trim()) {
      setOrderNumber(paramOrder.trim());
      setEmail(paramEmail.trim());
      performSearch(paramEmail.trim(), paramOrder.trim());
    }
  }, [paramOrder, paramEmail]);

  const handleUpdateQuantity = (variant_id: string, qty: number) => {
    const updated = cart.map((i) => (i.variant_id === variant_id ? { ...i, quantity: qty } : i)).filter((i) => i.quantity > 0);
    setCart(updated);
    localStorage.setItem("cenicola_cart", JSON.stringify(updated));
  };

  const handleRemoveItem = (variant_id: string) => {
    const updated = cart.filter((i) => i.variant_id !== variant_id);
    setCart(updated);
    localStorage.setItem("cenicola_cart", JSON.stringify(updated));
  };

  const toggleOrderExpand = (id: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(email, orderNumber);
  };

  const getStatusBadge = (ord: OrderSearchResult) => {
    if (ord.status === "cancelada") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5 text-red-600" /> Cancelado
        </span>
      );
    }

    const latestPayment = ord.payments && ord.payments.length > 0 ? ord.payments[0] : null;
    const isPaymentRejected = latestPayment?.status === "rechazado";

    if (isPaymentRejected && ord.status === "pendiente_pago") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5 text-red-600" /> Pago Rechazado
        </span>
      );
    }

    switch (ord.status) {
      case "pendiente_pago":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> En Revisión
          </span>
        );
      case "pago_verificado":
      case "en_embalaje":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Package className="w-3.5 h-3.5 text-blue-600" /> En Embalaje
          </span>
        );
      case "listo_para_retiro":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Package className="w-3.5 h-3.5 text-emerald-600" /> Listo para Retirar
          </span>
        );
      case "completada":
      case "enviada":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-emerald-600" /> Enviado
          </span>
        );
      case "cancelada":
      case "rechazada":
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xs uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      <StoreNavbar
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        wishlistCount={wishlistCount}
        bcvRate={bcvRate}
      />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 space-y-4">
        {/* Top Header Bar matching checkout and account page style */}
        <div className="flex justify-between items-center pb-1 text-xs uppercase tracking-wider">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-black transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VOLVER A TIENDA</span>
          </Link>

          <span className="text-slate-400 font-semibold tracking-wider">
            CONSULTAR PEDIDO
          </span>
        </div>

        <div className="w-full max-w-2xl lg:max-w-3xl mx-auto">
          <section className="border border-slate-200 p-5 sm:p-8 space-y-5 bg-white rounded-xs">
            <div className="pb-2.5 border-b border-slate-200">
              <h1 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                CONSULTA EL ESTADO DE TU PEDIDO
              </h1>
            </div>

            <p className="text-xs text-slate-600 font-normal">
              Ingresa tu correo electrónico y el número de pedido para conocer su estado actual:
            </p>

            <form onSubmit={handleSearch} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-black mb-1.5">
                    Número de Pedido *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Ej. ORD-1002"
                    className="w-full px-3.5 py-2.5 text-xs text-black border border-slate-300 focus:outline-none focus:border-black rounded-xs bg-white placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 px-4 text-xs font-semibold uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 rounded-xs cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando...</span>
                  </>
                ) : (
                  "Ver Estado del Pedido"
                )}
              </button>
            </form>

            {/* Track Results */}
            {results && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-black">
                  RESULTADO DE LA BÚSQUEDA ({results.length})
                </p>

                {results.map((ord) => {
                  const isExpanded = expandedOrderIds.includes(ord.id);
                  const isVesOrder = Number(ord.total_bcv_usd || 0) > 0;
                  const vesPaymentTypes = ["efectivo_bs", "transferencia", "pago_movil"];
                  const vesPaymentSum = ord.payments?.reduce((sum: number, p: OrderPaymentResult) => {
                    if (vesPaymentTypes.includes(String(p.payment_type)) && p.amount_ves) {
                      return sum + Number(p.amount_ves);
                    }
                    return sum;
                  }, 0) || 0;

                  const totalVesDisplay = isVesOrder
                    ? vesPaymentSum > 0
                      ? vesPaymentSum
                      : Number(ord.total_bcv_usd || ord.total_usd) * bcvRate
                    : 0;

                  return (
                    <div key={ord.id} className="border border-slate-200 bg-white rounded-xs overflow-hidden transition-all">
                      <div
                        onClick={() => toggleOrderExpand(ord.id)}
                        className="p-4 bg-white border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none w-full"
                      >
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Número de Orden</span>
                            <span className="font-mono font-bold text-sm text-black">#{ord.order_number}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Cliente</span>
                            <span className="text-xs text-black font-semibold uppercase">{ord.customer_name} {ord.customer_lastname}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Total</span>
                            <span className="font-mono font-bold text-sm text-black">
                              ${Number(ord.total_usd).toFixed(2)}
                              {totalVesDisplay > 0 && (
                                <span className="text-[11px] font-mono font-normal text-slate-500 ml-1.5">
                                  (Bs. {totalVesDisplay.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 shrink-0 ml-auto text-right">
                          <div>{getStatusBadge(ord)}</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOrderExpand(ord.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black border border-slate-300 bg-white px-3 py-1.5 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                          >
                            <span>{isExpanded ? "Ocultar" : "Detalles"}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 sm:p-5 space-y-5 bg-white animate-in fade-in-0 duration-200">
                          {(() => {
                            if (ord.status === "cancelada") {
                              return <OrderProgressStepper status="cancelada" />;
                            }

                            const latestPayment = ord.payments && ord.payments.length > 0 ? ord.payments[0] : null;
                            const isPaymentRejected = latestPayment?.status === "rechazado";

                            if (!isPaymentRejected || ord.status !== "pendiente_pago") {
                              return <OrderProgressStepper status={ord.status} />;
                            }

                            return (
                              <div className="bg-red-50 border border-red-200 p-4 sm:p-5 rounded-xs space-y-3">
                                <div className="flex items-center gap-2 text-red-900 font-bold uppercase text-xs">
                                  <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                                  <span>Atención: Pago Rechazado</span>
                                </div>
                                <p className="text-xs text-red-800 font-normal">
                                  No pudimos validar tu comprobante de pago para este pedido.
                                </p>
                                <div className="bg-white p-3 rounded-xs border border-red-200 space-y-1">
                                  <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider block">
                                    Motivo del Rechazo:
                                  </span>
                                  <p className="text-red-900 font-medium text-xs font-mono">
                                    {latestPayment?.rejection_reason || "Comprobante de pago no válido o referencia incorrecta."}
                                  </p>
                                </div>
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isDivisasOrder =
                                        ord.pricing_method === "divisas" ||
                                        Number(ord.total_divisas_usd || 0) > 0 ||
                                        Boolean(ord.payments?.some((p) => ["zelle", "usdt", "efectivo_usd"].includes(p.payment_type)));
                                      setSelectedReuploadOrder({ orderNumber: ord.order_number, email, isDivisasOrder });
                                      setReuploadModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-xs transition-colors cursor-pointer shadow-xs"
                                  >
                                    <Upload className="w-4 h-4" />
                                    <span>Volver a subir comprobante de pago</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {ord.items && ord.items.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                              <span className="text-xs font-semibold text-black uppercase tracking-wider block">
                                PRENDAS EN EL PEDIDO ({ord.items.length}):
                              </span>
                              <div className="divide-y divide-slate-100 border-b border-slate-100 pb-2">
                                {ord.items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center text-xs py-2">
                                    <span className="text-black font-semibold uppercase tracking-wide truncate max-w-[220px] sm:max-w-xs">
                                      {item.product_name} {item.size && <span className="text-slate-500 font-mono text-[11px]">({item.size})</span>}
                                    </span>
                                    <span className="text-black font-mono font-bold">
                                      {item.quantity} × ${Number(item.subtotal_usd).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

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
        bcvRate={bcvRate}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />

      {selectedReuploadOrder && (
        <ReuploadPaymentModal
          isOpen={reuploadModalOpen}
          onClose={() => setReuploadModalOpen(false)}
          orderNumber={selectedReuploadOrder.orderNumber}
          customerEmail={selectedReuploadOrder.email}
          isDivisasOrder={selectedReuploadOrder.isDivisasOrder}
          onSuccess={handleReuploadSuccess}
        />
      )}

      <StoreFooter />
    </div>
  );
}
