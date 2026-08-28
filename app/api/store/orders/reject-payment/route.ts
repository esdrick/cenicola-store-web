import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentRejectedEmail, extractCustomerEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/store/orders/reject-payment — Mark an order payment as rejected and send email notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_number, payment_id, rejection_reason } = body;

    if ((!order_number || !order_number.trim()) && (!payment_id || !payment_id.trim())) {
      return NextResponse.json(
        { error: "Se requiere el número de orden (order_number) o la ID del pago (payment_id)." },
        { status: 400 }
      );
    }

    if (!rejection_reason || !rejection_reason.trim()) {
      return NextResponse.json(
        { error: "El motivo del rechazo (rejection_reason) es obligatorio." },
        { status: 400 }
      );
    }

    const cleanReason = rejection_reason.trim();

    // 1. Find Order and target payment
    let order;
    if (payment_id) {
      const payment = await prisma.orderPayment.findUnique({
        where: { id: payment_id },
        include: {
          order: {
            include: { customer: true, payments: true },
          },
        },
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

    // Find the payment to update (specific payment_id or the latest non-rejected/pending payment)
    const targetPayment = payment_id
      ? order.payments.find((p) => p.id === payment_id)
      : order.payments.find((p) => p.status !== "rechazado") || order.payments[0];

    if (!targetPayment) {
      return NextResponse.json({ error: "No se encontró un registro de pago válido para esta orden." }, { status: 404 });
    }

    // 2. Update payment status to "rechazado" & update rejection_reason
    await prisma.orderPayment.update({
      where: { id: targetPayment.id },
      data: {
        status: "rechazado",
        rejection_reason: cleanReason,
      },
    });

    // 3. Obtain customer email
    const recipientEmail = order.customer?.email || extractCustomerEmail(order.notes);

    let emailSent = false;
    let emailError: string | undefined;

    if (recipientEmail) {
      const origin = req.headers.get("origin") || req.nextUrl.origin || "https://cenicolastore.com";
      const uploadUrl = `${origin}/consultar-orden?order=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(recipientEmail)}`;

      const emailRes = await sendPaymentRejectedEmail({
        to: recipientEmail,
        customerName: `${order.customer_name} ${order.customer_lastname}`.trim(),
        orderNumber: order.order_number,
        rejectionReason: cleanReason,
        uploadUrl,
      });

      emailSent = emailRes.success;
      emailError = emailRes.error;
    }

    return NextResponse.json({
      success: true,
      message: `Pago de la orden ${order.order_number} marcado como rechazado exitosamente.`,
      email_sent: emailSent,
      recipient_email: recipientEmail || null,
      email_error: emailError || null,
    });
  } catch (err) {
    console.error("POST /api/store/orders/reject-payment error:", err);
    return NextResponse.json({ error: "Error interno al rechazar el pago." }, { status: 500 });
  }
}
