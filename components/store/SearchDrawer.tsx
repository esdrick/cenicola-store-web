"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";

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
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
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
            setResults(data.data.slice(0, 6)); // Top 6 matching items
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
    <div className="fixed inset-0 z-50 font-sans overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-down Top Panel (Lefties Search Style) */}
      <div className="relative bg-white text-black shadow-2xl border-b border-slate-200 w-full animate-in slide-in-from-top duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* Top Row: Search Input & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-900">
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
              className="w-9 h-9 rounded-full border border-slate-300 text-black flex items-center justify-center hover:border-black hover:bg-slate-100 transition-colors ml-4 shrink-0"
              aria-label="Cerrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Categories / Search Results Container */}
          <div className="pt-6">
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
              <div className="py-8 text-center text-xs font-normal uppercase tracking-wider text-slate-400">
                Buscando prendas...
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs font-normal text-slate-500">
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

                {/* Instant Results Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {results.map((item) => {
                    const photo = item.photos[0] || "/placeholder.jpg";
                    return (
                      <Link
                        key={item.id}
                        href={`/producto/${item.id}`}
                        onClick={onClose}
                        className="group flex flex-col space-y-1.5"
                      >
                        <div className="relative aspect-[3/4] bg-slate-100 rounded-xs overflow-hidden w-full">
                          <Image
                            src={photo}
                            alt={item.name}
                            fill
                            sizes="180px"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
