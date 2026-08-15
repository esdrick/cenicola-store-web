import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTasa } from "@/lib/tasa-cambio";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");

    // Fetch live BCV rate
    const tasa = await getTasa().catch(() => null);
    const bcvRate = tasa?.rate ?? 1;

    const whereConditions: Record<string, unknown>[] = [
      { is_active: true },
      {
        variants: {
          some: {
            is_active: true,
            stock_online: { gt: 0 },
          },
        },
      },
    ];

    if (category) {
      const catLower = category.toLowerCase().trim();
      if (["mujer", "damas", "dama", "chica"].includes(catLower)) {
        whereConditions.push({
          OR: [
            { name: { contains: "mujer", mode: "insensitive" } },
            { name: { contains: "dama", mode: "insensitive" } },
            { name: { contains: "damas", mode: "insensitive" } },
            { type: { contains: "mujer", mode: "insensitive" } },
            { type: { contains: "dama", mode: "insensitive" } },
            { description: { contains: "mujer", mode: "insensitive" } },
            { description: { contains: "dama", mode: "insensitive" } },
          ],
        });
      } else if (["hombre", "caballeros", "caballero", "chico"].includes(catLower)) {
        whereConditions.push({
          OR: [
            { name: { contains: "hombre", mode: "insensitive" } },
            { name: { contains: "caballero", mode: "insensitive" } },
            { name: { contains: "caballeros", mode: "insensitive" } },
            { type: { contains: "hombre", mode: "insensitive" } },
            { type: { contains: "caballero", mode: "insensitive" } },
            { description: { contains: "hombre", mode: "insensitive" } },
            { description: { contains: "caballero", mode: "insensitive" } },
          ],
        });
      } else if (["niños", "niñas", "niño", "niña", "infantil", "ninos", "ninas"].includes(catLower)) {
        whereConditions.push({
          OR: [
            { name: { contains: "niño", mode: "insensitive" } },
            { name: { contains: "niña", mode: "insensitive" } },
            { name: { contains: "nino", mode: "insensitive" } },
            { name: { contains: "nina", mode: "insensitive" } },
            { name: { contains: "infantil", mode: "insensitive" } },
            { type: { contains: "niño", mode: "insensitive" } },
            { type: { contains: "niña", mode: "insensitive" } },
            { type: { contains: "infantil", mode: "insensitive" } },
            { description: { contains: "niño", mode: "insensitive" } },
            { description: { contains: "niña", mode: "insensitive" } },
          ],
        });
      } else {
        whereConditions.push({
          OR: [
            { type: { contains: category, mode: "insensitive" } },
            { name: { contains: category, mode: "insensitive" } },
            { description: { contains: category, mode: "insensitive" } },
          ],
        });
      }
    }

    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { type: { contains: search, mode: "insensitive" } },
          { color: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    let products = await prisma.product.findMany({
      where: { AND: whereConditions },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        description: true,
        photos: true,
        variants: {
          where: { is_active: true, stock_online: { gt: 0 } },
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
      orderBy: { created_at: "desc" },
    });

    // Fallback: If filtering produced 0 items, fetch all active items so the catalog is never completely empty
    if (products.length === 0 && category) {
      products = await prisma.product.findMany({
        where: {
          is_active: true,
          variants: { some: { is_active: true, stock_online: { gt: 0 } } },
        },
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          description: true,
          photos: true,
          variants: {
            where: { is_active: true, stock_online: { gt: 0 } },
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
        orderBy: { created_at: "desc" },
      });
    }

    const data = products.map((p) => {
      const minPriceUsd = Math.min(...p.variants.map((v) => Number(v.price_bcv)));
      const minPriceDivisasUsd = Math.min(
        ...p.variants.map((v) => (Number(v.price_divisas) > 0 ? Number(v.price_divisas) : Number(v.price_bcv)))
      );
      const minPriceVes = minPriceUsd * bcvRate;
      const totalStockOnline = p.variants.reduce((sum, v) => sum + v.stock_online, 0);

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        color: p.color,
        description: p.description,
        photos: p.photos,
        price_usd: minPriceUsd,
        price_divisas_usd: minPriceDivisasUsd,
        price_ves: parseFloat(minPriceVes.toFixed(2)),
        total_stock_online: totalStockOnline,
        variants: p.variants.map((v) => ({
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
    });

    // Extract unique categories directly from products without extra DB query
    const categories = Array.from(new Set(products.map((p) => p.type))).filter(Boolean);

    return NextResponse.json(
      {
        data,
        categories,
        bcv_rate: bcvRate,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
          "CDN-Cache-Control": "public, s-maxage=300",
          "Vercel-CDN-Cache-Control": "public, s-maxage=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json({ error: "Error al cargar productos de la tienda" }, { status: 500 });
  }
}
