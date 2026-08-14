"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Heart, ShoppingBag } from "lucide-react";
import { useWishlist } from "./WishlistContext";

type WishlistDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { wishlist, removeFromWishlist } = useWishlist();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-sm sm:max-w-md bg-white flex flex-col justify-between shadow-xl text-black">
          {/* Lefties Minimalist Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-black stroke-[1.5]" />
              <h2 className="text-xs font-normal uppercase tracking-widest text-black">
                LISTA DE DESEOS ({wishlist.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-black hover:opacity-60 transition-opacity p-1"
              aria-label="Cerrar lista de deseos"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          {/* Wishlist Items Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                <Heart className="w-8 h-8 text-slate-300 stroke-[1.2]" />
                <h3 className="text-xs font-normal uppercase tracking-widest text-black">
                  TU LISTA DE DESEOS ESTÁ VACÍA
                </h3>
                <p className="text-[11px] text-slate-400 max-w-xs font-normal">
                  Guarda las prendas que más te gusten presionando el ícono de favoritos.
                </p>
                <Link
                  href="/catalogo"
                  onClick={onClose}
                  className="mt-3 inline-block bg-black text-white px-6 py-3 text-[11px] font-normal uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                  VER COLECCIÓN
                </Link>
              </div>
            ) : (
              wishlist.map((item) => {
                const photo = item.photos[0] || null;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 py-3 border-b border-slate-100 items-start relative"
                  >
                    {/* Fixed Size Thumbnail (Guaranteed fixed dimensions, never stretches) */}
                    <Link
                      href={`/producto/${item.id}`}
                      onClick={onClose}
                      className="relative w-16 h-20 bg-slate-100 overflow-hidden shrink-0 block"
                    >
                      {photo ? (
                        <Image
                          src={photo}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 uppercase">
                          SIN FOTO
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 pr-6 space-y-1">
                      <p className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
                        {item.type}{item.color && ` · ${item.color}`}
                      </p>

                      <Link
                        href={`/producto/${item.id}`}
                        onClick={onClose}
                        className="font-normal text-xs uppercase tracking-wider text-black line-clamp-1 hover:opacity-60 transition-opacity block"
                      >
                        {item.name}
                      </Link>

                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-xs font-semibold text-black">
                          ${item.price_usd.toFixed(2)}
                        </span>
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/producto/${item.id}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 text-[10px] font-normal uppercase tracking-wider text-black hover:opacity-60"
                        >
                          <ShoppingBag className="w-3 h-3 stroke-[1.2]" />
                          VER PRENDA
                        </Link>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-3 right-0 text-slate-400 hover:text-black transition-colors p-1"
                      title="Eliminar de la lista de deseos"
                      aria-label="Eliminar de la lista de deseos"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.2]" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Lefties Minimalist Footer */}
          {wishlist.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-white">
              <Link
                href="/catalogo"
                onClick={onClose}
                className="w-full bg-black hover:bg-slate-800 text-white text-center py-3.5 px-4 text-xs font-normal uppercase tracking-widest block transition-colors"
              >
                SEGUIR COMPRANDO
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
