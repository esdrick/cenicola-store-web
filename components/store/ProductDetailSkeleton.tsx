"use client";

import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";

export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      <StoreNavbar cartCount={0} onOpenCart={() => {}} />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">
        {/* Breadcrumb Skeleton */}
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="h-3 w-16 bg-slate-100 animate-pulse rounded-xs" />
          <div className="h-3 w-32 bg-slate-100 animate-pulse rounded-xs hidden sm:block" />
        </div>

        {/* Product Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Photo Skeleton */}
          <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-3">
            <div className="hidden md:flex flex-col gap-2 shrink-0">
              <div className="w-14 aspect-[3/4] bg-slate-100 animate-pulse rounded-xs" />
              <div className="w-14 aspect-[3/4] bg-slate-100 animate-pulse rounded-xs" />
            </div>
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto bg-slate-100 animate-pulse rounded-xs flex-1" />
          </div>

          {/* Right Column: Details Skeleton */}
          <div className="lg:col-span-6 space-y-5 pt-1">
            <div className="h-3 w-28 bg-slate-100 animate-pulse rounded-xs" />
            <div className="space-y-2">
              <div className="h-6 w-3/4 bg-slate-100 animate-pulse rounded-xs" />
              <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-xs" />
            </div>

            <div className="h-14 w-full bg-slate-50 animate-pulse rounded-xs border border-slate-100" />

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="h-3 w-16 bg-slate-100 animate-pulse rounded-xs" />
              <div className="flex gap-2">
                <div className="h-9 w-12 bg-slate-100 animate-pulse rounded-xs" />
                <div className="h-9 w-12 bg-slate-100 animate-pulse rounded-xs" />
                <div className="h-9 w-12 bg-slate-100 animate-pulse rounded-xs" />
                <div className="h-9 w-12 bg-slate-100 animate-pulse rounded-xs" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="h-12 w-full bg-slate-200 animate-pulse rounded-xs" />
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
