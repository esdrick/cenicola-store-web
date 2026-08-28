import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeReference } from "@/lib/order-utils";
import { getTasa } from "@/lib/tasa-cambio";
import type { PaymentType } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

function normalizePaymentType(rawType: string): PaymentType {
  const str = String(rawType || "").toLowerCase().trim();
  if (str.includes("movil") || str.includes("pago_movil")) return "pago_movil";
  if (str.includes("zelle")) return "zelle";
  if (str.includes("usdt")) return "usdt";
  if (str.includes("transferencia")) return "transferencia";
  if (str.includes("efectivo_usd") || (str.includes("efectivo") && str.includes("usd"))) return "efectivo_usd";
  if (str.includes("efectivo_bs") || str.includes("efectivo")) return "efectivo_bs";
  return "pago_movil";
}

// POST /api/store/orders/reupload-payment — Re-submit payment proof for existing order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_number, email, payment_type, reference, payment_photo } = body;

    if (!order_number || !order_number.trim()) {
      return NextResponse.json({ error: "Número de pedido requerido" }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Correo electrónico requerido" }, { status: 400 });
    }

    if (!reference || !reference.trim() || reference.trim().length < 4) {
      return NextResponse.json({ error: "Número de referencia de pago inválido" }, { status: 400 });
    }

    if (!payment_photo || !payment_photo.trim()) {
      return NextResponse.json({ error: "La foto del comprobante es obligatoria" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOrderNumber = order_number.trim().toUpperCase();

    // 1. Find Order
    const order = await prisma.order.findFirst({
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
        payments: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No se encontró el pedido especificado con ese correo." },
        { status: 404 }
      );
    }

    if (order.status === "cancelada") {
      return NextResponse.json(
        { error: "Esta orden ha sido cancelada y no permite adjuntar nuevos comprobantes de pago." },
        { status: 400 }
      );
    }

    const validPaymentType = normalizePaymentType(payment_type || "pago_movil");

    // Enforce currency consistency: Order paid in Divisas requires Divisas payment, Order paid in VES requires VES payment
    const isOrderDivisas =
      order.pricing_method === "divisas" ||
      Number(order.total_divisas_usd || 0) > 0 ||
      order.payments.some((p) => ["zelle", "usdt", "efectivo_usd"].includes(p.payment_type));

    const isSelectedDivisas = ["zelle", "usdt", "efectivo_usd"].includes(validPaymentType);

    if (isOrderDivisas && !isSelectedDivisas) {
      return NextResponse.json(
        {
          error:
            "Esta orden fue realizada originalmente en divisas. El nuevo pago debe realizarse mediante un método en divisas (Zelle, USDT o Efectivo USD).",
        },
        { status: 400 }
      );
    }

    if (!isOrderDivisas && isSelectedDivisas) {
      return NextResponse.json(
        {
          error:
            "Esta orden fue realizada originalmente en bolívares. El nuevo pago debe realizarse mediante un método en bolívares (Pago Móvil, Transferencia o Efectivo Bs).",
        },
        { status: 400 }
      );
    }

    const isCash = validPaymentType === "efectivo_bs" || validPaymentType === "efectivo_usd";
    const refHash = isCash ? null : normalizeReference(reference);

    // 2. Check duplicate reference
    if (refHash) {
      const dup = await prisma.orderPayment.findFirst({
        where: {
          reference_hash: refHash,
          payment_type: validPaymentType,
          status: { not: "rechazado" },
        },
      });

      if (dup && dup.order_id !== order.id) {
        return NextResponse.json(
          { error: "La referencia de pago ingresada ya fue registrada previamente en otra orden." },
          { status: 409 }
        );
      }
    }

    // 3. Calculate Amounts & Rates
    const tasaResult = await getTasa().catch(() => null);
    const tasaId = tasaResult?.id ?? null;
    const tasaRate = tasaResult?.rate ?? 1;

    const totalUsd = Number(order.total_usd);
    const isVesPayment = ["efectivo_bs", "transferencia", "pago_movil"].includes(validPaymentType);
    const paidAmtUsd = totalUsd;
    const paidAmtVes = isVesPayment ? parseFloat((paidAmtUsd * tasaRate).toFixed(2)) : null;

    // 4. Create new OrderPayment record and update Order Status back to "pendiente_pago"
    const today = new Date().toISOString().slice(0, 10);
    const paymentLabel = validPaymentType.toUpperCase();
    const reuploadNote = `[Nuevo Pago Reenviado: ${paymentLabel} - Ref: ${isCash ? "EFECTIVO" : reference.trim()}]`;
    const updatedNotes = order.notes ? `${order.notes}\n${reuploadNote}` : reuploadNote;

    await prisma.$transaction([
      prisma.orderPayment.create({
        data: {
          order_id: order.id,
          payment_type: validPaymentType,
          amount_usd: paidAmtUsd,
          amount_ves: paidAmtVes,
          exchange_rate_id: isVesPayment ? tasaId : null,
          payment_date: new Date(today),
          reference: isCash ? "EFECTIVO" : reference.trim(),
          reference_hash: refHash,
          payment_photo: payment_photo.trim(),
          status: "pendiente",
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "pendiente_pago",
          notes: updatedNotes,
          updated_at: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Nuevo comprobante enviado exitosamente. Estamos verificando tu pago.",
    });
  } catch (err) {
    console.error("POST /api/store/orders/reupload-payment error:", err);
    return NextResponse.json({ error: "Error al enviar el nuevo comprobante de pago." }, { status: 500 });
  }
}
