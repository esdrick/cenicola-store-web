"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onError" | "onLoad" | "src"> {
  src?: ImageProps["src"] | string | null | undefined;
  fallbackText?: string;
  showSkeleton?: boolean;
}

export default function SafeImage({
  src,
  alt,
  className = "",
  fallbackText = "SIN FOTO",
  showSkeleton = true,
  ...props
}: SafeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isValidSrc =
    Boolean(src) &&
    (typeof src === "object" ||
      (typeof src === "string" &&
        src.trim().length > 0 &&
        src !== "/placeholder.jpg" &&
        src !== "undefined" &&
        src !== "null"));

  if (!isValidSrc || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 select-none">
        <ImageOff className="w-5 h-5 stroke-[1.5] mb-1 text-slate-300" />
        <span className="text-[8px] uppercase tracking-widest font-sans font-medium text-slate-400">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Skeleton Shimmer Loading State for slow internet */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse z-10 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin opacity-40" />
        </div>
      )}

      <Image
        src={src as ImageProps["src"]}
        alt={alt}
        className={`${className} transition-opacity duration-300 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...props}
      />
    </>
  );
}
