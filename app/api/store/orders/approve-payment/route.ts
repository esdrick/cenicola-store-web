import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentApprovedEmail, extractCustomerEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/store/orders/approve-payment — Approve payment for order & send confirmation email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const { order_number, payment_id } = body;

    if ((!order_number || !order_number.trim()) && (!payment_id || !payment_id.trim())) {
      return NextResponse.json(
        { error: "Se requiere el número de orden (order_number) o la ID del pago (payment_id)." },
        { status: 400 }
      );
    }

    // 1. Find Order
    let order;
    if (payment_id) {
      const payment = await prisma.orderPayment.findUnique({
        where: { id: payment_id },
        include: { order: { include: { customer: true, payments: true } } },
      });
      if (payment) order = payment.order;
    } else {
      const cleanOrderNumber = order_number.trim().toUpperCase();
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { order_number: cleanOrderNumber },
            { order_number: { endsWith: cleanOrderNumber } },
          ],
        },
        include: {
          customer: true,
          payments: { orderBy: { created_at: "desc" } },
        },
      });
    }

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    // 2. Update Order status to "en_embalaje" & update Payment status to "verificado"
    const targetPayment = payment_id
      ? order.payments.find((p) => p.id === payment_id)
      : order.payments.find((p) => p.status !== "rechazado") || order.payments[0];

    await prisma.$transaction([
      ...(targetPayment
        ? [
            prisma.orderPayment.update({
              where: { id: targetPayment.id },
              data: {
                status: "verificado",
                verified_at: new Date(),
              },
            }),
          ]
        : []),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "en_embalaje",
          pago_verificado_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    // 3. Send payment approved email to customer
    const recipientEmail = order.customer?.email || extractCustomerEmail(order.notes);
    let emailSent = false;
    let emailError: string | undefined;

    if (recipientEmail) {
      const origin = req.headers.get("origin") || req.nextUrl.origin || "https://cenicolastore.com";
      const trackingUrl = `${origin}/consultar-orden?order=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(recipientEmail)}`;

      const emailRes = await sendPaymentApprovedEmail({
        to: recipientEmail,
        customerName: `${order.customer_name} ${order.customer_lastname}`.trim(),
        orderNumber: order.order_number,
        trackingUrl,
      });

      emailSent = emailRes.success;
      emailError = emailRes.error;
    }

    return NextResponse.json({
      success: true,
      message: `Pago de la orden #${order.order_number} aprobado exitosamente. Estado actualizado a embalaje.`,
      email_sent: emailSent,
      recipient_email: recipientEmail || null,
      email_error: emailError || null,
    });
  } catch (err) {
    console.error("POST /api/store/orders/approve-payment error:", err);
    return NextResponse.json({ error: "Error al aprobar el pago de la orden." }, { status: 500 });
  }
}
