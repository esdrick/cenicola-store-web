import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type CartItemStockCheck = {
  variant_id: string;
  requested_quantity: number;
  available_stock: number;
  is_active: boolean;
  status: "available" | "insufficient_stock" | "out_of_stock" | "inactive" | "not_found";
  name?: string;
  size?: string;
  color?: string | null;
  photo?: string | null;
  price_usd?: number;
};

export type CartValidationResponse = {
  isValid: boolean;
  hasStockIssues: boolean;
  hasOutOfStock: boolean;
  hasInsufficientStock: boolean;
  items: CartItemStockCheck[];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Datos de carrito no válidos" }, { status: 400 });
    }

    const itemsInput: Array<{ variant_id: string; quantity: number }> = body.items;

    if (itemsInput.length === 0) {
      return NextResponse.json<CartValidationResponse>({
        isValid: true,
        hasStockIssues: false,
        hasOutOfStock: false,
        hasInsufficientStock: false,
        items: [],
      });
    }

    const variantIds = itemsInput.map((i) => i.variant_id).filter(Boolean);

    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            color: true,
            photos: true,
            is_active: true,
          },
        },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let hasOutOfStock = false;
    let hasInsufficientStock = false;

    const validatedItems: CartItemStockCheck[] = itemsInput.map((item) => {
      const variant = variantMap.get(item.variant_id);
      const requestedQty = Math.max(1, Number(item.quantity) || 1);

      if (!variant) {
        hasOutOfStock = true;
        return {
          variant_id: item.variant_id,
          requested_quantity: requestedQty,
          available_stock: 0,
          is_active: false,
          status: "not_found",
        };
      }

      const isItemActive = Boolean(variant.is_active && variant.product?.is_active !== false);
      const availableStock = Math.max(0, variant.stock_online);
      const photos = Array.isArray(variant.product?.photos) ? (variant.product.photos as string[]) : [];
      const photo = photos[0] || null;

      let status: CartItemStockCheck["status"] = "available";

      if (!isItemActive) {
        status = "inactive";
        hasOutOfStock = true;
      } else if (availableStock <= 0) {
        status = "out_of_stock";
        hasOutOfStock = true;
      } else if (availableStock < requestedQty) {
        status = "insufficient_stock";
        hasInsufficientStock = true;
      }

      return {
        variant_id: variant.id,
        requested_quantity: requestedQty,
        available_stock: availableStock,
        is_active: isItemActive,
        status,
        name: variant.product?.name,
        size: variant.size,
        color: variant.product?.color,
        photo,
        price_usd: Number(variant.price_bcv || 0),
      };
    });

    const hasStockIssues = hasOutOfStock || hasInsufficientStock;

    return NextResponse.json<CartValidationResponse>({
      isValid: !hasStockIssues,
      hasStockIssues,
      hasOutOfStock,
      hasInsufficientStock,
      items: validatedItems,
    });
  } catch (error) {
    console.error("Error al validar stock del carrito:", error);
    return NextResponse.json(
      { error: "Error interno al validar disponibilidad de inventario" },
      { status: 500 }
    );
  }
}
