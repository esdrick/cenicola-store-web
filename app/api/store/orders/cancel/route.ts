import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderCancelledEmail, extractCustomerEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/store/orders/cancel — Cancel order, restore variant stock & send cancellation email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const { order_number, cancellation_reason } = body;

    if (!order_number || !order_number.trim()) {
      return NextResponse.json({ error: "Número de orden (order_number) requerido." }, { status: 400 });
    }

    const cleanOrderNumber = order_number.trim().toUpperCase();
    const cleanReason = cancellation_reason?.trim() || "Cancelación por solicitud de tienda o inactividad";

    // 1. Find Order with items
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { order_number: cleanOrderNumber },
          { order_number: { endsWith: cleanOrderNumber } },
        ],
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    if (order.status === "cancelada") {
      return NextResponse.json({ error: "Esta orden ya se encuentra cancelada." }, { status: 400 });
    }

    // 2. Perform cancellation transaction (Restore online stock for items & update status to "cancelada")
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "cancelada",
          notes: order.notes ? `${order.notes}\n[Cancelado: ${cleanReason}]` : `[Cancelado: ${cleanReason}]`,
          updated_at: new Date(),
        },
      });

      // Restore stock for items with deterministic pessimistic lock
      const uniqueVariantIds = Array.from(new Set(order.items.map((i) => i.variant_id))).sort();
      const lockedVariantsMap = new Map<string, { id: string; stock_online: number; stock_store: number }>();

      for (const varId of uniqueVariantIds) {
        const lockedRows = await tx.$queryRaw<
          Array<{ id: string; stock_online: number; stock_store: number }>
        >`
          SELECT id, stock_online, stock_store
          FROM product_variants
          WHERE id = ${varId}
          FOR UPDATE
        `;
        if (lockedRows && lockedRows.length > 0) {
          lockedVariantsMap.set(varId, lockedRows[0]);
        }
      }

      for (const item of order.items) {
        const variant = lockedVariantsMap.get(item.variant_id);
        if (variant) {
          const currentOnline = variant.stock_online;
          const restoredOnline = currentOnline + item.quantity;
          const restoredTotal = restoredOnline + variant.stock_store;

          // Update tracked stock in map for remaining iterations
          variant.stock_online = restoredOnline;

          await tx.productVariant.update({
            where: { id: item.variant_id },
            data: {
              stock_online: restoredOnline,
              stock_total: restoredTotal,
            },
          });

          await tx.inventoryMovement.create({
            data: {
              variant_id: item.variant_id,
              type: "entrada",
              channel: "online",
              qty_before: currentOnline,
              qty_change: item.quantity,
              qty_after: restoredOnline,
              reason: `Devolución por cancelación de orden #${order.order_number}`,
              order_id: order.id,
              created_by: order.created_by,
            },
          });
        }
      }
    });

    // 3. Send email to customer
    const recipientEmail = order.customer?.email || extractCustomerEmail(order.notes);
    let emailSent = false;
    let emailError: string | undefined;

    if (recipientEmail) {
      const emailRes = await sendOrderCancelledEmail({
        to: recipientEmail,
        customerName: `${order.customer_name} ${order.customer_lastname}`.trim(),
        orderNumber: order.order_number,
        cancellationReason: cleanReason,
      });

      emailSent = emailRes.success;
      emailError = emailRes.error;
    }

    return NextResponse.json({
      success: true,
      message: `Orden #${order.order_number} cancelada exitosamente y stock restaurado.`,
      email_sent: emailSent,
      recipient_email: recipientEmail || null,
      email_error: emailError || null,
    });
  } catch (err) {
    console.error("POST /api/store/orders/cancel error:", err);
    return NextResponse.json({ error: "Error al cancelar la orden." }, { status: 500 });
  }
}
