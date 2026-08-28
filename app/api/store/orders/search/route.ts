import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/store/orders/search — Secure lookup requiring BOTH email AND order_number
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, order_number } = body;

    if (!email || !email.trim() || !order_number || !order_number.trim()) {
      return NextResponse.json(
        { error: "Debes ingresar tanto tu correo electrónico como el número de pedido" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOrderNumber = order_number.trim().toUpperCase();

    // Match order by order_number AND customer email for maximum privacy
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { order_number: cleanOrderNumber },
          { order_number: { endsWith: cleanOrderNumber } },
        ],
        customer: {
          email: { equals: cleanEmail, mode: "insensitive" },
        },
      },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        payments: {
          orderBy: { created_at: "desc" },
        },
        shipment: true,
      },
    });

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "No se encontró ningún pedido que coincida con ese correo electrónico y número de pedido." },
        { status: 404 }
      );
    }

    const formattedOrders = orders.map((ord) => ({
      id: ord.id,
      order_number: ord.order_number,
      status: ord.status,
      customer_name: ord.customer_name,
      customer_lastname: ord.customer_lastname,
      customer_id_doc: ord.customer_id_doc,
      total_usd: Number(ord.total_usd),
      total_bcv_usd: Number(ord.total_bcv_usd || 0),
      total_divisas_usd: Number(ord.total_divisas_usd || 0),
      pricing_method: ord.pricing_method,
      created_at: ord.created_at.toISOString(),
      items: ord.items.map((item) => {
        const snap = item.variant_snapshot as Record<string, string> | null;
        return {
          id: item.id,
          product_name: item.variant?.product?.name ?? snap?.product_name ?? "Prenda",
          color: item.variant?.product?.color ?? snap?.color ?? "",
          size: item.variant?.size ?? snap?.size ?? "",
          quantity: item.quantity,
          unit_price_usd: Number(item.unit_price_usd),
          subtotal_usd: Number(item.subtotal_usd),
          photo: item.variant?.product?.photos?.[0] ?? null,
        };
      }),
      payments: ord.payments.map((p) => ({
        id: p.id,
        payment_type: p.payment_type,
        amount_usd: Number(p.amount_usd),
        amount_ves: p.amount_ves ? Number(p.amount_ves) : null,
        reference: p.reference,
        status: p.status,
        rejection_reason: p.rejection_reason,
        payment_photo: p.payment_photo,
      })),
      shipment: ord.shipment
        ? {
            tracking_number: ord.shipment.tracking_number,
            photo_package: ord.shipment.photo_package,
            packed_at: ord.shipment.packed_at ? ord.shipment.packed_at.toISOString() : null,
          }
        : null,
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (err) {
    console.error("POST /api/store/orders/search:", err);
    return NextResponse.json({ error: "Error al realizar la consulta" }, { status: 500 });
  }
}
