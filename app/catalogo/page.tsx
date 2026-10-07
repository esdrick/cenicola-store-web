import { Suspense } from "react";
import CatalogClient from "./CatalogClient";

export const revalidate = 600;

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Cargando catálogo...</div>}>
      <CatalogClient />
    </Suspense>
  );
}
