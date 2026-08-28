"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";
import FilterDrawer, { type FilterState } from "@/components/store/FilterDrawer";
import SearchDrawer from "@/components/store/SearchDrawer";
import { useWishlist } from "@/components/store/WishlistContext";
import { SlidersHorizontal, RefreshCw, ShoppingBag, Columns2, Grid3X3, List } from "lucide-react";

type ProductType = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  description?: string | null;
  photos: string[];
  price_usd: number;
  price_ves: number;
  total_stock_online: number;
  variants: Array<{ id: string; size: string; stock_online: number }>;
};

const DEFAULT_FILTERS: FilterState = {
  sortBy: "default",
  sizes: [],
  colors: [],
  minPrice: "",
  maxPrice: "",
};

const ITEMS_PER_PAGE = 12;

function CatalogContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("category") || "";
  const qParam = searchParams.get("q") || "";

  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(qParam);
  const [selectedCategory, setSelectedCategory] = useState(catParam);

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [cart, setCart] = useState<CartItemType[]>([]);

  // Filtering, Pagination and View Mode States
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<"large" | "compact" | "list">("large");
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  const { wishlistCount } = useWishlist();

  // Sync state with URL params without hydration mismatch
  useEffect(() => {
    const currentCat = searchParams.get("category") || "";
    const currentQ = searchParams.get("q") || "";
    setSelectedCategory(currentCat);
    setSearch(currentQ);
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchParams]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cenicola_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedView = localStorage.getItem("cenicola_catalog_view");
      if (savedView === "large" || savedView === "compact" || savedView === "list") {
        setViewMode(savedView);
      }
    } catch {
      setCart([]);
    }
  }, []);

  const saveCart = (newCart: CartItemType[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("cenicola_cart", JSON.stringify(newCart));
    } catch {
      // ignore
    }
  };

  const handleViewModeChange = (mode: "large" | "compact" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("cenicola_catalog_view", mode);
    } catch {
      // ignore
    }
  };

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (search) params.set("q", search);

    fetch(`/api/store/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setProducts(data.data);
          setCategories(data.categories || []);
          setBcvRate(data.bcv_rate || 1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const availableSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        if (v.stock_online > 0) sizesSet.add(v.size.toUpperCase());
      });
    });
    const standardOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
    return Array.from(sizesSet).sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [products]);

  const availableColors = useMemo(() => {
    const colorsSet = new Set<string>();
    products.forEach((p) => {
      if (p.color) colorsSet.add(p.color.trim());
    });
    return Array.from(colorsSet);
  }, [products]);

  // Client-side filtering & sorting logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (filters.sizes.length > 0) {
          const hasSelectedSize = p.variants?.some(
            (v) => v.stock_online > 0 && filters.sizes.includes(v.size.toUpperCase())
          );
          if (!hasSelectedSize) return false;
        }

        if (filters.colors.length > 0) {
          const prodColor = (p.color || "").toLowerCase();
          const matchesColor = filters.colors.some((c) => prodColor.includes(c.toLowerCase()));
          if (!matchesColor) return false;
        }

        if (filters.minPrice !== "" && p.price_usd < Number(filters.minPrice)) {
          return false;
        }

        if (filters.maxPrice !== "" && p.price_usd > Number(filters.maxPrice)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "price_asc") return a.price_usd - b.price_usd;
        if (filters.sortBy === "price_desc") return b.price_usd - a.price_usd;
        return 0;
      });
  }, [products, filters]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleSearchSubmit = (q: string) => {
    setSearch(q);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.sortBy !== "default") count += 1;
    if (filters.sizes.length > 0) count += filters.sizes.length;
    if (filters.colors.length > 0) count += filters.colors.length;
    if (filters.minPrice !== "") count += 1;
    if (filters.maxPrice !== "") count += 1;
    return count;
  }, [filters]);

  const resetAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedCategory("");
    setSearch("");
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const defaultCategories = ["Mujer", "Hombre", "Niños"];
  const allCategoryPills = Array.from(new Set([...defaultCategories, ...categories]));

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <StoreNavbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        wishlistCount={wishlistCount}
        bcvRate={bcvRate}
      />

      <main className="w-full px-4 sm:px-8 lg:px-12 py-5 flex-1">
        {/* Lefties Row 1: Title on Left, Vistas + Filtros on Right */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-sans text-sm sm:text-base font-normal uppercase text-black tracking-wider">
            {selectedCategory ? selectedCategory : "Toda la colección"}
          </h1>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle Controls */}
            <div className="flex items-center gap-1 text-slate-700">
              <button
                type="button"
                onClick={() => handleViewModeChange("large")}
                className={`p-0.5 transition-colors ${
                  viewMode === "large" ? "text-black" : "text-slate-400 hover:text-black"
                }`}
                title="Cuadros Grandes"
                aria-label="Cuadros Grandes"
              >
                <Columns2 className="w-4 h-4 stroke-[1.5]" />
              </button>

              <button
                type="button"
                onClick={() => handleViewModeChange("compact")}
                className={`p-0.5 transition-colors ${
                  viewMode === "compact" ? "text-black" : "text-slate-400 hover:text-black"
                }`}
                title="Cuadros Chicos"
                aria-label="Cuadros Chicos"
              >
                <Grid3X3 className="w-4 h-4 stroke-[1.5]" />
              </button>

              <button
                type="button"
                onClick={() => handleViewModeChange("list")}
                className={`p-0.5 transition-colors md:hidden ${
                  viewMode === "list" ? "text-black" : "text-slate-400 hover:text-black"
                }`}
                title="Vista Lista (Solo Móvil)"
                aria-label="Vista Lista"
              >
                <List className="w-4 h-4 stroke-[1.5]" />
              </button>

              <span className="text-xs text-black font-normal ml-1 hidden sm:inline">Vistas</span>
            </div>

            <span className="text-slate-300 text-xs">|</span>

            {/* Lefties Border Button "FILTROS" */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-black border border-black rounded-xs text-xs font-normal hover:bg-black hover:text-white transition-all shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-black text-white rounded-full text-[9px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Lefties Row 2: Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          <button
            onClick={() => handleCategorySelect("")}
            className={`px-4 py-1.5 border text-xs font-normal transition-colors shrink-0 ${
              selectedCategory === ""
                ? "bg-black text-white border-black"
                : "bg-white text-black border-slate-300 hover:border-black"
            }`}
          >
            Ver Todo
          </button>
          {allCategoryPills.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-4 py-1.5 border text-xs font-normal transition-colors shrink-0 ${
                selectedCategory === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-slate-300 hover:border-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Active Filters Badges Indicator */}
        {(activeFiltersCount > 0 || search) && (
          <div className="mb-6 flex items-center gap-2 flex-wrap text-xs bg-slate-50 p-2 border border-slate-100">
            <span className="font-normal text-slate-500 uppercase tracking-wider text-[10px]">
              Filtros activos:
            </span>
            {search && (
              <span className="bg-white border border-slate-200 px-2 py-0.5 text-slate-800 text-[11px]">
                Búsqueda: &ldquo;{search}&rdquo;
              </span>
            )}
            {filters.sortBy !== "default" && (
              <span className="bg-white border border-slate-200 px-2 py-0.5 text-slate-800 text-[11px]">
                Orden: {filters.sortBy === "price_asc" ? "Precio Ascendente" : "Precio Descendente"}
              </span>
            )}
            {filters.sizes.map((s) => (
              <span key={s} className="bg-white border border-slate-200 px-2 py-0.5 text-slate-800 text-[11px]">
                Talla: {s}
              </span>
            ))}
            {filters.colors.map((c) => (
              <span key={c} className="bg-white border border-slate-200 px-2 py-0.5 text-slate-800 text-[11px]">
                Color: {c}
              </span>
            ))}
            {(filters.minPrice !== "" || filters.maxPrice !== "") && (
              <span className="bg-white border border-slate-200 px-2 py-0.5 text-slate-800 text-[11px]">
                Precio: ${filters.minPrice || 0} - ${filters.maxPrice || "Max"}
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-slate-500 font-normal hover:text-black ml-auto text-[11px] underline"
            >
              Borrar todos
            </button>
          </div>
        )}

        {/* Catalog Grid / List Container */}
        {loading ? (
          <div
            className={
              viewMode === "list"
                ? "flex flex-col border-t border-slate-200 divide-y divide-slate-100"
                : viewMode === "compact"
                ? "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3"
                : "grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
            }
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className={`bg-slate-100 animate-pulse ${
                  viewMode === "list" ? "h-14 py-2" : "h-80"
                }`}
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white p-8 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-normal text-slate-800 text-sm">No se encontraron prendas</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta cambiar los criterios o quitar los filtros seleccionados.
            </p>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 bg-black text-white text-xs px-4 py-2 font-normal hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Limpiar Filtros
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col border-t border-slate-200 divide-y divide-slate-100"
                  : viewMode === "compact"
                  ? "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3"
                  : "grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
              }
            >
              {visibleProducts.map((p) => (
                <ProductCard key={p.id} {...p} viewMode={viewMode} />
              ))}
            </div>

            {/* Load More & Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="mt-12 mb-8 flex flex-col items-center justify-center space-y-4">
                {/* Counter & Progress bar */}
                <div className="w-full max-w-xs text-center space-y-2">
                  <p className="text-xs text-slate-500 font-normal">
                    Has visto <span className="font-semibold text-slate-900">{Math.min(visibleCount, filteredProducts.length)}</span> de{" "}
                    <span className="font-semibold text-slate-900">{filteredProducts.length}</span> prendas
                  </p>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-full transition-all duration-300 ease-out"
                      style={{
                        width: `${Math.min(100, (visibleCount / filteredProducts.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {visibleCount < filteredProducts.length && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="px-8 py-3 bg-black text-white text-xs uppercase tracking-widest font-normal hover:bg-slate-800 transition-all rounded-xs shadow-sm hover:shadow active:scale-[0.99]"
                    >
                      Cargar más prendas
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawers */}
      <SearchDrawer
        isOpen={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        onSearchSubmit={handleSearchSubmit}
      />

      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetAllFilters}
        availableSizes={availableSizes.length > 0 ? availableSizes : undefined}
        availableColors={availableColors}
        totalResults={filteredProducts.length}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        bcvRate={bcvRate}
      />

      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />

      <StoreFooter />
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Cargando catálogo...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
