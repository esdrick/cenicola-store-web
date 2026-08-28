import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <Loader2 className="w-8 h-8 animate-spin text-slate-900 mb-3" />
      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">
        Cargando...
      </p>
    </div>
  );
}
