import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cenicola_customer_session")?.value;
    const secret = getSecret();

    if (!token || !secret) {
      return NextResponse.json({ error: "No autenticado", orders: [] }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Sesión inválida", orders: [] }, { status: 401 });
    }

    const customerId = String(payload.id);
    const customerEmail = String(payload.email || "").trim().toLowerCase();

    // Find orders created strictly for this authenticated customer (by customer_id, customer email, or notes)
    const rawOrders = await prisma.order.findMany({
      where: {
        OR: [
          { customer_id: customerId },
          ...(customerEmail
            ? [
                { customer: { email: { equals: customerEmail, mode: "insensitive" as const } } },
                { notes: { contains: customerEmail, mode: "insensitive" as const } },
              ]
            : []),
        ],
      },
      orderBy: { created_at: "desc" },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    color: true,
                    photos: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { created_at: "desc" },
        },
        shipment: true,
      },
    });

    const orders = rawOrders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      created_at: o.created_at.toISOString(),
      total_usd: Number(o.total_usd),
      total_bcv_usd: Number(o.total_bcv_usd),
      total_divisas_usd: Number(o.total_divisas_usd),
      pricing_method: o.pricing_method,
      shipping_company: o.shipping_company,
      address: o.address,
      notes: o.notes,
      items: o.items.map((i) => {
        const snap = (i.variant_snapshot as Record<string, unknown>) || {};
        const photo =
          snap.photo ||
          (i.variant?.product?.photos && i.variant.product.photos[0]) ||
          null;

        return {
          id: i.id,
          product_name: snap.product_name || i.variant?.product?.name || "Prenda Cenicola",
          color: snap.color || i.variant?.product?.color || "",
          size: snap.size || i.variant?.size || "",
          quantity: i.quantity,
          unit_price_usd: Number(i.unit_price_usd),
          subtotal_usd: Number(i.subtotal_usd),
          photo,
        };
      }),
      payments: o.payments.map((p) => ({
        id: p.id,
        payment_type: p.payment_type,
        amount_usd: Number(p.amount_usd),
        amount_ves: p.amount_ves ? Number(p.amount_ves) : null,
        reference: p.reference,
        status: p.status,
        rejection_reason: p.rejection_reason,
        payment_photo: p.payment_photo,
      })),
      shipment: o.shipment
        ? {
            tracking_number: o.shipment.tracking_number,
            photo_package: o.shipment.photo_package,
            packed_at: o.shipment.packed_at ? o.shipment.packed_at.toISOString() : null,
          }
        : null,
    }));

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error("GET /api/store/orders error:", err);
    return NextResponse.json({ error: "Error al obtener las órdenes del cliente", orders: [] }, { status: 500 });
  }
}
