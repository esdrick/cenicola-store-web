import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTasa } from "@/lib/tasa-cambio";

import { normalizeText } from "@/lib/text";

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
      } else if (["niño", "nino"].includes(catLower)) {
        whereConditions.push({
          OR: [
            { name: { contains: "niño", mode: "insensitive" } },
            { name: { contains: "nino", mode: "insensitive" } },
            { type: { contains: "niño", mode: "insensitive" } },
            { type: { contains: "nino", mode: "insensitive" } },
            { description: { contains: "niño", mode: "insensitive" } },
            { description: { contains: "nino", mode: "insensitive" } },
          ],
        });
      } else if (["niña", "nina"].includes(catLower)) {
        whereConditions.push({
          OR: [
            { name: { contains: "niña", mode: "insensitive" } },
            { name: { contains: "nina", mode: "insensitive" } },
            { type: { contains: "niña", mode: "insensitive" } },
            { type: { contains: "nina", mode: "insensitive" } },
            { description: { contains: "niña", mode: "insensitive" } },
            { description: { contains: "nina", mode: "insensitive" } },
          ],
        });
      } else if (["niños", "niñas", "infantil", "ninos", "ninas"].includes(catLower)) {
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
            { description: { contains: "infantil", mode: "insensitive" } },
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

    if (search?.trim()) {
      const normQ = normalizeText(search.trim());
      const rawTerms = normQ.split(/\s+/).filter(Boolean);

      const terms: string[] = [];
      for (const t of rawTerms) {
        terms.push(t);
        if (["camisetas", "camiseta", "camisa", "camisas"].includes(t)) {
          terms.push("camiseta", "camis", "top", "franela", "remera");
        } else if (["pantalones", "pantalon", "shorts", "short"].includes(t)) {
          terms.push("pantalon", "short", "legging", "jogger", "bermuda", "mono");
        } else if (["basicas", "basica", "basicos", "basico"].includes(t)) {
          terms.push("basica", "basico", "franela");
        } else if (["mujer", "damas", "dama", "chica", "chicas"].includes(t)) {
          terms.push("mujer", "dama", "damas", "chica");
        } else if (["hombre", "caballeros", "caballero", "chico", "chicos"].includes(t)) {
          terms.push("hombre", "caballero", "caballeros", "chico");
        } else if (t === "nino") {
          terms.push("nino");
        } else if (t === "nina") {
          terms.push("nina");
        } else if (["ninos", "ninas", "infantil"].includes(t)) {
          terms.push("nino", "nina", "infantil");
        }
      }

      products = products.filter((p) => {
        const nameNorm = normalizeText(p.name);
        const typeNorm = p.type ? normalizeText(p.type) : "";
        const colorNorm = p.color ? normalizeText(p.color) : "";
        const descNorm = p.description ? normalizeText(p.description) : "";

        return terms.some((term) =>
          nameNorm.includes(term) ||
          typeNorm.includes(term) ||
          colorNorm.includes(term) ||
          descNorm.includes(term) ||
          p.variants.some((v) => normalizeText(v.size).includes(term) || normalizeText(v.sku).includes(term))
        );
      });
    }

    // Query sibling colors for all matched products
    const productNames = Array.from(new Set(products.map((p) => p.name.trim())));
    const siblingProducts = productNames.length > 0
      ? await prisma.product.findMany({
          where: {
            name: { in: productNames, mode: "insensitive" },
            is_active: true,
            variants: {
              some: {
                is_active: true,
                stock_online: { gt: 0 },
              },
            },
          },
          select: {
            id: true,
            name: true,
            color: true,
          },
        })
      : [];

    // Map by normalized product name
    const colorsByNameMap = new Map<string, Array<{ id: string; color: string }>>();
    for (const sib of siblingProducts) {
      if (!sib.color) continue;
      const key = sib.name.trim().toLowerCase();
      const list = colorsByNameMap.get(key) || [];
      if (!list.some((item) => item.color.toLowerCase() === sib.color!.toLowerCase())) {
        list.push({ id: sib.id, color: sib.color });
      }
      colorsByNameMap.set(key, list);
    }

    // Deduplicate products by normalized name so each garment model appears only once in the catalog
    const seenProductNames = new Set<string>();
    const uniqueProducts: typeof products = [];
    for (const p of products) {
      const nameKey = p.name.trim().toLowerCase();
      if (!seenProductNames.has(nameKey)) {
        seenProductNames.add(nameKey);
        uniqueProducts.push(p);
      }
    }

    const data = uniqueProducts.map((p) => {
      const minPriceUsd = Math.min(...p.variants.map((v) => Number(v.price_bcv)));
      const minPriceDivisasUsd = Math.min(
        ...p.variants.map((v) => (Number(v.price_divisas) > 0 ? Number(v.price_divisas) : Number(v.price_bcv)))
      );
      const mayorPrices = p.variants
        .map((v) => Number(v.price_mayor_bcv))
        .filter((pm) => pm > 0);
      const minPriceMayorUsd =
        mayorPrices.length > 0
          ? Math.min(...mayorPrices)
          : Number((minPriceUsd * 0.7).toFixed(2));
      const minPriceVes = minPriceUsd * bcvRate;
      const totalStockOnline = p.variants.reduce((sum, v) => sum + v.stock_online, 0);
      const nameKey = p.name.trim().toLowerCase();
      const availableColors = colorsByNameMap.get(nameKey) || (p.color ? [{ id: p.id, color: p.color }] : []);

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        color: p.color,
        available_colors: availableColors,
        description: p.description,
        photos: p.photos,
        price_usd: minPriceUsd,
        price_divisas_usd: minPriceDivisasUsd,
        price_mayor_usd: minPriceMayorUsd,
        price_ves: parseFloat(minPriceVes.toFixed(2)),
        total_stock_online: totalStockOnline,
        variants: p.variants.map((v) => {
          const variantMayor =
            Number(v.price_mayor_bcv || 0) > 0
              ? Number(v.price_mayor_bcv)
              : Number((Number(v.price_bcv) * 0.7).toFixed(2));
          return {
            id: v.id,
            size: v.size,
            sku: v.sku,
            stock_online: v.stock_online,
            price_usd: Number(v.price_bcv),
            price_divisas_usd: Number(v.price_divisas) > 0 ? Number(v.price_divisas) : Number(v.price_bcv),
            price_bundle_usd: Number(v.price_bundle_bcv || 0),
            price_bundle_divisas_usd: Number(v.price_bundle_divisas || 0),
            price_mayor_usd: variantMayor,
            price_mayor_divisas_usd: Number(v.price_mayor_divisas || 0),
            price_ves: parseFloat((Number(v.price_bcv) * bcvRate).toFixed(2)),
          };
        }),
      };
    });

    // Query all distinct active categories from the database across all active products with stock
    const allTypesResult = await prisma.product.findMany({
      where: {
        is_active: true,
        variants: {
          some: {
            is_active: true,
            stock_online: { gt: 0 },
          },
        },
      },
      select: { type: true },
      distinct: ["type"],
    });

    const categories = Array.from(
      new Set(allTypesResult.map((t) => t.type?.trim()).filter(Boolean))
    ) as string[];

    return NextResponse.json(
      {
        data,
        categories,
        bcv_rate: bcvRate,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json({ error: "Error al cargar productos de la tienda" }, { status: 500 });
  }
}
