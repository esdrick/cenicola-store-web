"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Layout Error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white font-sans antialiased">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-3">Q´ FRANELAS</h1>
          <h2 className="text-lg font-semibold text-red-400 mb-2">Error crítico del sistema</h2>
          <p className="text-xs text-slate-300 mb-6">
            Ha ocurrido un problema al cargar el diseño principal de la aplicación.
          </p>

          <button
            onClick={() => reset()}
            className="bg-white text-slate-900 text-xs font-semibold px-5 py-2.5 rounded-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Reintentar Carga
          </button>
        </div>
      </body>
    </html>
  );
}
