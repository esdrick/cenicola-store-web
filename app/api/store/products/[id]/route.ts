import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTasa } from "@/lib/tasa-cambio";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tasa = await getTasa().catch(() => null);
    const bcvRate = tasa?.rate ?? 1;

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        description: true,
        photos: true,
        is_active: true,
        variants: {
          where: { is_active: true },
          select: {
            id: true,
            size: true,
            sku: true,
            price_bcv: true,
            price_divisas: true,
            price_bundle_bcv: true,
            price_bundle_divisas: true,
            price_mayor_bcv: true,
            price_mayor_divisas: true,
            stock_online: true,
          },
          orderBy: { size: "asc" },
        },
      },
    });

    if (!product || !product.is_active) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const minPriceUsd = Math.min(...product.variants.map((v) => Number(v.price_bcv)));
    const minPriceDivisasUsd = Math.min(
      ...product.variants.map((v) => (Number(v.price_divisas) > 0 ? Number(v.price_divisas) : Number(v.price_bcv)))
    );

    const data = {
      id: product.id,
      name: product.name,
      type: product.type,
      color: product.color,
      description: product.description,
      photos: Array.from(new Set(product.photos || [])),
      price_usd: minPriceUsd,
      price_divisas_usd: minPriceDivisasUsd,
      price_ves: parseFloat((minPriceUsd * bcvRate).toFixed(2)),
      bcv_rate: bcvRate,
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        sku: v.sku,
        stock_online: v.stock_online,
        price_usd: Number(v.price_bcv),
        price_divisas_usd: Number(v.price_divisas) > 0 ? Number(v.price_divisas) : Number(v.price_bcv),
        price_bundle_usd: Number(v.price_bundle_bcv || 0),
        price_bundle_divisas_usd: Number(v.price_bundle_divisas || 0),
        price_mayor_usd: Number(v.price_mayor_bcv || 0),
        price_mayor_divisas_usd: Number(v.price_mayor_divisas || 0),
        price_ves: parseFloat((Number(v.price_bcv) * bcvRate).toFixed(2)),
      })),
    };

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
          "CDN-Cache-Control": "public, s-maxage=300",
          "Vercel-CDN-Cache-Control": "public, s-maxage=300",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/store/products/[id] error:", err);
    return NextResponse.json({ error: "Error al cargar el producto" }, { status: 500 });
  }
}
