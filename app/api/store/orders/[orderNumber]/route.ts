import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractCustomerEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/store/orders/[orderNumber] — Public guest order tracking
export async function GET(
  _request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { order_number: params.orderNumber },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true, color: true, photos: true } },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            payment_type: true,
            amount_usd: true,
            amount_ves: true,
            reference: true,
            status: true,
            rejection_reason: true,
            created_at: true,
          },
        },
        shipment: {
          select: {
            tracking_number: true,
            photo_package: true,
            photo_guide: true,
            notes: true,
            packed_at: true,
            shipped_at: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const data = {
      order_number: order.order_number,
      status: order.status,
      customer_name: order.customer_name,
      customer_lastname: order.customer_lastname,
      customer_email: extractCustomerEmail(order.notes),
      address: order.address,
      shipping_company: order.shipping_company,
      total_usd: Number(order.total_usd),
      total_bcv_usd: Number(order.total_bcv_usd),
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
      items: order.items.map((item) => {
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
      payments: order.payments.map((p) => ({
        ...p,
        amount_usd: Number(p.amount_usd),
        amount_ves: p.amount_ves ? Number(p.amount_ves) : null,
        created_at: p.created_at.toISOString(),
      })),
      shipment: order.shipment
        ? {
            tracking_number: order.shipment.tracking_number,
            photo_package: order.shipment.photo_package,
            photo_guide: order.shipment.photo_guide,
            packed_at: order.shipment.packed_at.toISOString(),
          }
        : null,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/store/orders/[orderNumber]:", err);
    return NextResponse.json({ error: "Error al consultar la orden" }, { status: 500 });
  }
}
