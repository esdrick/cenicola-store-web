"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-sm p-8 text-center shadow-xs">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Ocurrió un error inesperado
        </h1>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Lamentamos los inconvenientes. Ha ocurrido un problema técnico en la aplicación. Puedes intentar recargar la vista o volver a la página principal.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xs hover:bg-slate-100 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Ir al Inicio
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-[10px] text-slate-400 font-mono">
            Código de error: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
