"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import { Search, Package, ArrowRight, AlertCircle } from "lucide-react";

type OrderSearchResult = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_lastname: string;
  customer_id_doc: string;
  total_usd: number;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    size: string;
    quantity: number;
    subtotal_usd: number;
  }>;
};

export default function ConsultarOrdenPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OrderSearchResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recentOrders, setRecentOrders] = useState<Array<{ number: string; date: string }>>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cenicola_my_orders");
      if (saved) {
        setRecentOrders(JSON.parse(saved));
      }
    } catch {
      setRecentOrders([]);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setErrorMsg("");
    setResults(null);

    fetch(`/api/store/orders/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.error) {
          setErrorMsg(data.error);
        } else if (data.orders && data.orders.length > 0) {
          setResults(data.orders);
        } else {
          setErrorMsg("No se encontraron órdenes asociadas a este Correo Electrónico o Número de Orden.");
        }
      })
      .catch(() => {
        setLoading(false);
        setErrorMsg("Ocurrió un error al buscar el pedido. Intenta nuevamente.");
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente_pago":
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Pendiente de Pago</span>;
      case "pago_verificado":
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Pago Verificado</span>;
      case "en_embalaje":
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">En Embalaje</span>;
      case "enviada":
        return <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Enviado</span>;
      case "completada":
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Completado</span>;
      case "cancelada":
        return <span className="bg-red-100 text-red-900 border border-red-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Cancelado</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <StoreNavbar cartCount={0} onOpenCart={() => {}} />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-extrabold text-amber-600">
            SEGUIMIENTO DE PEDIDOS
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wide text-slate-950">
            CONSULTAR MI PEDIDO
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md mx-auto">
            Ingresa tu correo electrónico o tu Número de Orden para ver el estado en tiempo real de tu compra.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white p-6 sm:p-8 rounded border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Correo Electrónico o # de Orden:
            </label>
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: maria@gmail.com o ORD-2026-0001"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-slate-950 font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-950 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
              >
                {loading ? "Buscando..." : "Buscar Pedido"}
              </button>
            </div>
          </form>

          {/* Recent Orders Shortcut if available */}
          {recentOrders.length > 0 && !results && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                Órdenes recientes realizadas en este dispositivo:
              </span>
              <div className="flex flex-wrap gap-2">
                {recentOrders.map((rec) => (
                  <Link
                    key={rec.number}
                    href={`/orden/${rec.number}`}
                    className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors"
                  >
                    <Package className="w-4 h-4 text-amber-700" />
                    #{rec.number}
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-xs text-red-900 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Results */}
        {results && (
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Resultados de la búsqueda ({results.length}):
            </h2>

            {results.map((ord) => (
              <div
                key={ord.id}
                className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-400 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-black text-lg text-slate-950">#{ord.order_number}</span>
                    {getStatusBadge(ord.status)}
                  </div>
                  <p className="text-xs text-slate-600">
                    Cliente: <strong>{ord.customer_name} {ord.customer_lastname}</strong> ({ord.customer_id_doc})
                  </p>
                  <p className="text-xs text-slate-400">
                    Fecha: {new Date(ord.created_at).toLocaleDateString("es-VE")} · Prendas: {ord.items.length}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Monto Total</span>
                    <span className="text-xl font-black text-slate-950">${ord.total_usd.toFixed(2)}</span>
                  </div>

                  <Link
                    href={`/orden/${ord.order_number}`}
                    className="inline-flex items-center gap-2 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded hover:bg-slate-800 transition-colors"
                  >
                    Ver Detalle <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
