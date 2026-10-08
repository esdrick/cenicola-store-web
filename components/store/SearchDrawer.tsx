"use client";

import { useState, useEffect, useRef } from "react";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

type SearchResultItem = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  photos: string[];
  price_usd: number;
  price_ves: number;
};

type SearchDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSearchSubmit?: (query: string) => void;
};

export default function SearchDrawer({ isOpen, onClose, onSearchSubmit }: SearchDrawerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/store/products?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setResults(data.data.slice(0, 12)); // Top 12 matching items
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit && query.trim()) {
      onSearchSubmit(query.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 font-sans flex flex-col justify-start">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-down Top Panel */}
      <div className="relative z-10 bg-white text-black shadow-2xl border-b border-slate-200 w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-top duration-300">
        {/* Top Header Row: Search Input & Close Button (Fixed at top of panel) */}
        <div className="shrink-0 border-b border-slate-900 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between gap-3">
            <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3">
              <Search className="w-5 h-5 text-black stroke-[1.5] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="¿QUÉ ESTÁS BUSCANDO?"
                className="w-full text-base sm:text-2xl font-semibold uppercase tracking-wider text-black bg-transparent border-none focus:outline-none placeholder:text-slate-300"
              />
            </form>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-slate-300 text-black flex items-center justify-center hover:border-black hover:bg-slate-100 transition-colors ml-2 sm:ml-4 shrink-0"
              aria-label="Cerrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Results Container */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-6">
            {!query.trim() ? (
              <div className="space-y-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 block">
                  BÚSQUEDAS FRECUENTES
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Camisetas", "Mujer", "Hombre", "Niños", "Pantalones", "Básicas"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuery(tag)}
                      className="px-4 py-1.5 border border-slate-300 text-xs font-normal uppercase tracking-wider text-black hover:border-black transition-colors rounded-xs"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="py-12 text-center text-xs font-normal uppercase tracking-wider text-slate-400">
                Buscando prendas...
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center text-xs font-normal text-slate-500">
                No se encontraron prendas con &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    RESULTADOS ({results.length})
                  </span>
                  {onSearchSubmit && (
                    <button
                      type="button"
                      onClick={() => {
                        onSearchSubmit(query);
                        onClose();
                      }}
                      className="text-xs font-semibold text-black uppercase tracking-wider hover:underline flex items-center gap-1"
                    >
                      Ver todos los resultados <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Results Grid - responsive from mobile to desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {results.map((item) => {
                    const photo = item.photos && item.photos[0] ? item.photos[0] : "";
                    return (
                      <Link
                        key={item.id}
                        href={`/producto/${item.id}`}
                        onClick={onClose}
                        className="group flex flex-col space-y-1.5"
                      >
                        <div className="relative aspect-[3/4] bg-slate-100 rounded-xs overflow-hidden w-full">
                          <SafeImage
                            src={getOptimizedCloudinaryUrl(photo, 400)}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
                            cloudinaryWidth={400}
                            loading="lazy"
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase block line-clamp-1">
                          {item.type} {item.color && `· ${item.color}`}
                        </span>
                        <span className="font-semibold text-xs text-black uppercase tracking-wider line-clamp-1 group-hover:opacity-60 transition-opacity">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-black">
                          ${item.price_usd.toFixed(2)}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Bottom View All Results CTA */}
                {onSearchSubmit && (
                  <div className="pt-4 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSearchSubmit(query);
                        onClose();
                      }}
                      className="w-full py-3 px-4 border border-black bg-black text-white hover:bg-slate-800 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded-xs"
                    >
                      <span>Ver todos los resultados para &ldquo;{query}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
