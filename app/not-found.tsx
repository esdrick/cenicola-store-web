import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-sm p-8 text-center shadow-xs">
        <span className="text-5xl font-extrabold text-slate-900 tracking-tight block mb-2 font-mono">
          404
        </span>

        <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">
          Página No Encontrada
        </h1>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          La página o prenda que buscas no existe o ha sido movida. Puedes explorar nuestro catálogo completo de ropa moderna.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xs hover:bg-slate-800 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Ver Catálogo
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xs hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
