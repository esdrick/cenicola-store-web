"use client";

import { X, Check, SlidersHorizontal } from "lucide-react";

export type FilterState = {
  sortBy: "default" | "price_asc" | "price_desc";
  sizes: string[];
  colors: string[];
  minPrice: number | "";
  maxPrice: number | "";
};

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  availableSizes?: string[];
  availableColors?: string[];
  totalResults: number;
};

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// Color map for visual swatches
const COLOR_MAP: Record<string, { bg: string; border?: string }> = {
  negro: { bg: "#000000" },
  blanco: { bg: "#FFFFFF", border: "#D1D5DB" },
  azul: { bg: "#2563EB" },
  rojo: { bg: "#DC2626" },
  verde: { bg: "#16A34A" },
  amarillo: { bg: "#EAB308" },
  marron: { bg: "#854D0E" },
  marrón: { bg: "#854D0E" },
  beige: { bg: "#E5E7EB", border: "#9CA3AF" },
  gris: { bg: "#6B7280" },
  rosa: { bg: "#EC4899" },
  rosado: { bg: "#EC4899" },
  morado: { bg: "#9333EA" },
  fucsia: { bg: "#D946EF" },
  naranja: { bg: "#F97316" },
};

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  availableSizes = DEFAULT_SIZES,
  availableColors = [],
  totalResults,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  const toggleSize = (size: string) => {
    const isSelected = filters.sizes.includes(size);
    const updated = isSelected
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: updated });
  };

  const toggleColor = (color: string) => {
    const isSelected = filters.colors.includes(color);
    const updated = isSelected
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFilterChange({ ...filters, colors: updated });
  };

  const handleSortChange = (sort: FilterState["sortBy"]) => {
    onFilterChange({ ...filters, sortBy: sort });
  };

  const colorList = Array.from(
    new Set([
      ...Object.keys(COLOR_MAP),
      ...availableColors.map((c) => c.toLowerCase()),
    ])
  ).filter(Boolean);

  const currentMaxSlider = filters.maxPrice === "" ? 100 : Number(filters.maxPrice);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-sm sm:max-w-md bg-white flex flex-col justify-between shadow-xl">
          {/* Lefties Minimalist Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-black">
              <SlidersHorizontal className="w-4 h-4 stroke-[1.5]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-black">
                FILTROS
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-slate-300 text-black flex items-center justify-center hover:border-black hover:bg-slate-100 transition-colors"
              aria-label="Cerrar filtros"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Section 1: ORDENAR POR */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-black block">
                ORDENAR POR
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSortChange(
                      filters.sortBy === "price_asc" ? "default" : "price_asc"
                    )
                  }
                  className={`py-2 px-3 text-xs font-normal text-center border transition-all rounded-xs ${
                    filters.sortBy === "price_asc"
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-slate-300 hover:border-black"
                  }`}
                >
                  Precio ascendente
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSortChange(
                      filters.sortBy === "price_desc" ? "default" : "price_desc"
                    )
                  }
                  className={`py-2 px-3 text-xs font-normal text-center border transition-all rounded-xs ${
                    filters.sortBy === "price_desc"
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-slate-300 hover:border-black"
                  }`}
                >
                  Precio descendente
                </button>
              </div>
            </div>

            {/* Section 2: TALLA */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-black block">
                  TALLA
                </label>
                {filters.sizes.length > 0 && (
                  <button
                    onClick={() => onFilterChange({ ...filters, sizes: [] })}
                    className="text-[10px] text-slate-500 underline hover:text-black"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                ROPA
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const isSelected = filters.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`min-w-[44px] py-1.5 px-3 text-center text-xs font-normal uppercase border transition-all rounded-xs ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-slate-300 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: COLOR */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-black block">
                  COLOR
                </label>
                {filters.colors.length > 0 && (
                  <button
                    onClick={() => onFilterChange({ ...filters, colors: [] })}
                    className="text-[10px] text-slate-500 underline hover:text-black"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {colorList.map((colorName) => {
                  const info = COLOR_MAP[colorName] || { bg: colorName };
                  const isSelected = filters.colors.includes(colorName);
                  return (
                    <button
                      key={colorName}
                      type="button"
                      title={colorName}
                      onClick={() => toggleColor(colorName)}
                      className={`relative w-7 h-7 border transition-all flex items-center justify-center rounded-xs ${
                        isSelected
                          ? "ring-2 ring-black ring-offset-1 scale-105"
                          : "hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: info.bg,
                        borderColor: info.border || "#D1D5DB",
                      }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            colorName === "blanco" || colorName === "beige"
                              ? "text-black"
                              : "text-white"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 4: PRECIO (Lefties Range Slider Style) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-black block">
                  PRECIO
                </label>
                <span className="text-xs font-normal text-slate-900 font-mono">
                  ${filters.minPrice || 0} - ${filters.maxPrice || 100}
                </span>
              </div>

              {/* Minimalist Range Input Slider */}
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentMaxSlider}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      maxPrice: Number(e.target.value),
                    })
                  }
                  className="w-full h-1 bg-black accent-black rounded-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Lefties Drawer Footer Fixed Action Buttons */}
          <div className="p-6 border-t border-slate-200 space-y-2.5 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-black text-white font-semibold text-xs uppercase tracking-widest rounded-xs hover:bg-slate-800 transition-colors"
            >
              VER SELECCIÓN ({totalResults})
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="w-full py-3 bg-white text-black font-semibold text-xs uppercase tracking-widest border border-slate-900 rounded-xs hover:bg-slate-100 transition-colors"
            >
              BORRAR FILTROS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
