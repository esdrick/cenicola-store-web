import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, normalizeReference } from "@/lib/order-utils";
import { getTasa } from "@/lib/tasa-cambio";
import { sendOrderCreatedEmail } from "@/lib/email";
import type { PaymentType, DocumentType } from "@/app/generated/prisma/client";

// POST /api/store/checkout — Public Checkout endpoint for customers
const ENABLE_WEB_CHECKOUT = false; // Set to true only if direct web form checkout is enabled

export async function POST(request: NextRequest) {
  if (!ENABLE_WEB_CHECKOUT) {
    return NextResponse.json(
      { error: "El checkout directo web no está habilitado. Realiza tu compra a través de WhatsApp." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });

    const {
      customer_name,
      customer_lastname,
      doc_type,
      doc_number,
      customer_phone,
      customer_email,
      address,
      shipping_company,
      notes,
      items,
      payment,
    } = body;

    // Validations
    if (!customer_name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    if (!customer_lastname?.trim()) return NextResponse.json({ error: "El apellido es requerido" }, { status: 400 });
    if (!doc_type || !doc_number?.trim()) return NextResponse.json({ error: "Cédula o RIF requerido" }, { status: 400 });
    if (!customer_email?.trim() || !customer_email.includes("@")) return NextResponse.json({ error: "Correo electrónico válido requerido" }, { status: 400 });
    if (!customer_phone?.trim()) return NextResponse.json({ error: "Teléfono de contacto requerido" }, { status: 400 });
    if (!address?.trim()) return NextResponse.json({ error: "Dirección de envío requerida" }, { status: 400 });
    if (!shipping_company?.trim()) return NextResponse.json({ error: "Empresa o modalidad de envío requerida" }, { status: 400 });

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "El carrito de compras está vacío" }, { status: 400 });
    }

    if (!payment || !payment.payment_type) {
      return NextResponse.json({ error: "Debes seleccionar un método de pago" }, { status: 400 });
    }

    const reference = payment.reference?.trim() || "";
    const isCash = payment.payment_type === "efectivo_bs" || payment.payment_type === "efectivo_usd";

    if (!isCash && !reference) {
      return NextResponse.json({ error: "El número de referencia de pago es requerido" }, { status: 400 });
    }

    const DOC_TYPES = ["V", "P", "J", "E"];
    if (!DOC_TYPES.includes(doc_type)) {
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
    }

    const customer_id_doc = `${doc_type}-${doc_number.trim()}`;
    const tasaResult = await getTasa().catch(() => null);
    const tasaId = tasaResult?.id ?? null;
    const tasaRate = tasaResult?.rate ?? 1;

    // Check duplicate reference in DB
    let refHash: string | null = null;
    if (!isCash && reference) {
      refHash = normalizeReference(reference);
      if (refHash) {
        const dup = await prisma.orderPayment.findFirst({
          where: {
            reference_hash: refHash,
            payment_type: payment.payment_type as PaymentType,
            status: { not: "rechazado" },
          },
          include: { order: { select: { order_number: true } } },
        });
        if (dup) {
          return NextResponse.json(
            { error: `La referencia de pago "${reference}" ya fue registrada previamente en la orden ${dup.order.order_number}` },
            { status: 409 }
          );
        }
      }
    }

    // Process Order in Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate items subtotal and verify stock
      let totalUsd = 0;
      const orderItems = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variant_id },
          include: { product: { select: { name: true, color: true } } },
        });

        if (!variant || !variant.is_active) {
          throw new Error(`La prenda seleccionada ya no está disponible`);
        }

        const qty = Number(item.quantity) || 1;
        if (variant.stock_online < qty) {
          throw new Error(`Stock insuficiente para ${variant.product.name} (Talla ${variant.size}). Disponibles: ${variant.stock_online}`);
        }

        const unitPrice = Number(variant.price_bcv);
        const subtotal = parseFloat((unitPrice * qty).toFixed(2));
        totalUsd += subtotal;

        orderItems.push({
          variant_id: variant.id,
          quantity: qty,
          unit_price_usd: unitPrice,
          subtotal_usd: subtotal,
          snapshot: {
            product_name: variant.product.name,
            color: variant.product.color,
            size: variant.size,
            sku: variant.sku,
            price_bcv: unitPrice,
          },
        });
      }

      totalUsd = parseFloat(totalUsd.toFixed(2));
      const totalVes = parseFloat((totalUsd * tasaRate).toFixed(2));

      // 2. Upsert Customer in DB
      let customerId: string | null = null;
      const savedCustomer = await tx.customer.upsert({
        where: { doc_type_doc_number: { doc_type: doc_type as DocumentType, doc_number: doc_number.trim() } },
        update: {
          name: customer_name.trim(),
          lastname: customer_lastname.trim(),
          phone: customer_phone.trim(),
          address: address.trim(),
        },
        create: {
          doc_type: doc_type as DocumentType,
          doc_number: doc_number.trim(),
          name: customer_name.trim(),
          lastname: customer_lastname.trim(),
          phone: customer_phone.trim(),
          address: address.trim(),
        },
      });
      customerId = savedCustomer.id;

      // 3. Create System User placeholder for online web order if needed (or admin system id)
      const systemAdmin = await tx.user.findFirst({ where: { role: "admin" } });
      const createdById = systemAdmin?.id ?? savedCustomer.id;

      const fullNotes = `[Correo Web: ${customer_email.trim().toLowerCase()}] ${notes?.trim() || ""}`.trim();

      // 4. Create Order
      const orderNumber = await generateOrderNumber(tx);
      const order = await tx.order.create({
        data: {
          order_number: orderNumber,
          channel: "online",
          status: "pendiente_pago",
          customer_id: customerId,
          customer_name: customer_name.trim(),
          customer_lastname: customer_lastname.trim(),
          customer_id_doc,
          address: address.trim(),
          shipping_company: shipping_company.trim(),
          total_usd: totalUsd,
          total_bcv_usd: totalUsd,
          total_divisas_usd: 0,
          exchange_rate_id: tasaId,
          notes: fullNotes,
          created_by: createdById,
        },
      });

      // 5. Create Order Items & deduct online stock & add inventory movements
      for (const item of orderItems) {
        await tx.orderItem.create({
          data: {
            order_id: order.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price_usd: item.unit_price_usd,
            subtotal_usd: item.subtotal_usd,
            quantity_bcv: item.quantity,
            quantity_divisas: 0,
            subtotal_bcv_usd: item.subtotal_usd,
            subtotal_divisas_usd: 0,
            variant_snapshot: item.snapshot,
          },
        });

        const variant = await tx.productVariant.findUnique({ where: { id: item.variant_id } });
        if (variant) {
          const newOnline = Math.max(0, variant.stock_online - item.quantity);
          await tx.productVariant.update({
            where: { id: item.variant_id },
            data: { stock_online: newOnline, stock_total: newOnline + variant.stock_store },
          });

          await tx.inventoryMovement.create({
            data: {
              variant_id: item.variant_id,
              type: "salida_venta",
              channel: "online",
              qty_before: variant.stock_online,
              qty_change: -item.quantity,
              qty_after: newOnline,
              reason: `Venta E-Commerce Web orden #${orderNumber}`,
              order_id: order.id,
              created_by: createdById,
            },
          });
        }
      }

      // 6. Create Order Payment
      const today = new Date().toISOString().slice(0, 10);
      const paidAmtUsd = payment.amount_usd ? parseFloat(Number(payment.amount_usd).toFixed(2)) : totalUsd;
      const paidAmtVes = parseFloat((paidAmtUsd * tasaRate).toFixed(2));

      await tx.orderPayment.create({
        data: {
          order_id: order.id,
          payment_type: payment.payment_type as PaymentType,
          amount_usd: paidAmtUsd,
          amount_ves: paidAmtVes,
          exchange_rate_id: tasaId,
          payment_date: new Date(today),
          reference: isCash ? "EFECTIVO" : reference,
          reference_hash: refHash,
          payment_photo: payment.payment_photo?.trim() || null,
          status: "pendiente",
        },
      });

      return {
        order_number: orderNumber,
        total_usd: totalUsd,
        total_ves: totalVes,
        customer_email: customer_email.trim().toLowerCase(),
        customer_name: customer_name.trim(),
      };
    });

    // 7. Send confirmation email to customer asynchronously
    sendOrderCreatedEmail({
      to: result.customer_email,
      customerName: result.customer_name,
      orderNumber: result.order_number,
      totalUsd: result.total_usd,
      totalVes: result.total_ves,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://cenicolashub.com"}/orden/${result.order_number}`,
    }).catch((err) => console.error("Error al enviar correo de confirmación de pedido:", err));

    return NextResponse.json(
      {
        success: true,
        order_number: result.order_number,
        message: "Orden creada exitosamente. Estamos verificando tu pago.",
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al procesar el checkout";
    console.error("POST /api/store/checkout:", err);
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
