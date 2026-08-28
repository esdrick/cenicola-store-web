import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, normalizeReference } from "@/lib/order-utils";
import { getTasa } from "@/lib/tasa-cambio";
import { sendOrderCreatedEmail } from "@/lib/email";
import { isDivisasPaymentMethod } from "@/lib/whatsapp";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { PaymentType, DocumentType } from "@/app/generated/prisma/client";

function normalizePaymentType(rawType: string): PaymentType {
  const str = String(rawType || "").toLowerCase().trim();
  if (str.includes("movil") || str.includes("pago_movil")) return "pago_movil";
  if (str.includes("zelle")) return "zelle";
  if (str.includes("usdt")) return "usdt";
  if (str.includes("transferencia")) return "transferencia";
  if (str.includes("efectivo")) return "efectivo_usd";
  return "pago_movil";
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]{2,50}$/;

function sanitize(str: string): string {
  return String(str || "").replace(/<[^>]*>?/gm, "").trim();
}

// POST /api/store/checkout — Public Checkout endpoint for customers
const ENABLE_WEB_CHECKOUT = true; // Set to true to enable direct web form checkout

export async function POST(request: NextRequest) {
  if (!ENABLE_WEB_CHECKOUT) {
    return NextResponse.json(
      { error: "El checkout directo web no está habilitado. Realiza tu compra a través de WhatsApp." },
      { status: 403 }
    );
  }

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    
    // 1. IP Rate Limiter Check (Max 5 checkout requests per minute)
    const rateCheck = checkRateLimit(ip, 5, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos de pedido. Por favor espera 1 minuto antes de reintentar." },
        { status: 429 }
      );
    }

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
      hp_field,
      form_loaded_at,
    } = body;

    // 2. Invisible Honeypot Bot Trap Check
    if (hp_field && String(hp_field).trim().length > 0) {
      return NextResponse.json({ error: "Solicitud de checkout no válida" }, { status: 400 });
    }

    // 3. Human Submit Delay Check (< 800ms submission is an automated script)
    if (form_loaded_at) {
      const elapsedMs = Date.now() - Number(form_loaded_at);
      if (elapsedMs < 800) {
        return NextResponse.json({ error: "Procesamiento demasiado rápido. Intenta de nuevo." }, { status: 400 });
      }
    }

    const cleanName = sanitize(customer_name);
    const cleanLastname = sanitize(customer_lastname);
    const cleanEmail = sanitize(customer_email).toLowerCase();
    const cleanDocNumber = sanitize(doc_number).toUpperCase();
    const cleanPhone = sanitize(customer_phone);
    const cleanAddress = sanitize(address);
    const cleanShippingCompany = sanitize(shipping_company);
    const cleanNotes = sanitize(notes).slice(0, 300);
    const reference = sanitize(payment?.reference).slice(0, 30);

    // Enterprise Field Validations
    if (!cleanName || cleanName.length < 2 || cleanName.length > 50 || !NAME_REGEX.test(cleanName)) {
      return NextResponse.json({ error: "Nombre inválido (debe tener entre 2 y 50 caracteres alfabéticos)" }, { status: 400 });
    }

    if (!cleanLastname || cleanLastname.length < 2 || cleanLastname.length > 50 || !NAME_REGEX.test(cleanLastname)) {
      return NextResponse.json({ error: "Apellido inválido (debe tener entre 2 y 50 caracteres alfabéticos)" }, { status: 400 });
    }

    if (!cleanEmail || cleanEmail.length > 100 || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: "Ingresa un correo electrónico válido (ejemplo: cliente@dominio.com)" }, { status: 400 });
    }

    const DOC_TYPES = ["V", "P", "J", "E"];
    if (!DOC_TYPES.includes(doc_type)) {
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 });
    }

    if (!cleanDocNumber || cleanDocNumber.length < 5 || cleanDocNumber.length > 12) {
      return NextResponse.json({ error: "Cédula o RIF inválido (debe tener entre 5 y 12 caracteres)" }, { status: 400 });
    }

    if (!cleanPhone || cleanPhone.length < 7 || cleanPhone.length > 20) {
      return NextResponse.json({ error: "Teléfono inválido (debe tener entre 7 y 20 caracteres)" }, { status: 400 });
    }

    if (!cleanAddress || cleanAddress.length < 5 || cleanAddress.length > 250) {
      return NextResponse.json({ error: "Dirección de envío requerida (máximo 250 caracteres)" }, { status: 400 });
    }

    if (!cleanShippingCompany) {
      return NextResponse.json({ error: "Empresa o modalidad de envío requerida" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "El carrito de compras está vacío" }, { status: 400 });
    }

    if (!payment || !payment.payment_type) {
      return NextResponse.json({ error: "Debes seleccionar un método de pago" }, { status: 400 });
    }

    const validPaymentType = normalizePaymentType(payment.payment_type);
    const isCash = validPaymentType === "efectivo_bs" || validPaymentType === "efectivo_usd";

    if (!isCash && (!reference || reference.length < 4 || reference.length > 30)) {
      return NextResponse.json({ error: "Número de referencia de pago inválido (debe tener entre 4 y 30 caracteres)" }, { status: 400 });
    }

    const customer_id_doc = `${doc_type}-${cleanDocNumber}`;
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
            payment_type: validPaymentType,
            status: { not: "rechazado" },
          },
          include: { order: { select: { order_number: true } } },
        });
        if (dup) {
          return NextResponse.json(
            { error: "La referencia de pago ingresada ya fue registrada previamente. Por favor verifique el número de referencia." },
            { status: 409 }
          );
        }
      }
    }

    // Determine payment method and volume pricing
    const cleanPaymentStr = `${payment?.payment_type || ""} ${payment?.payment_name || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isDivisasPayment =
      Boolean(payment?.is_divisas) ||
      isDivisasPaymentMethod(cleanPaymentStr) ||
      isDivisasPaymentMethod(validPaymentType);
    const pricingMethod = isDivisasPayment ? "divisas" : "bcv";
    const totalCartCount = items.reduce((sum: number, i: { quantity?: number }) => sum + (Number(i.quantity) || 1), 0);

    const pickPrice = (specific: number, ...fallbacks: number[]): number => {
      if (specific > 0) return specific;
      for (const f of fallbacks) {
        if (f > 0) return f;
      }
      return specific;
    };

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

        const baseBcvPrice = Number(variant.price_bcv || 0);
        const baseDivisaPrice = pickPrice(Number(variant.price_divisas || 0), baseBcvPrice);
        const bundleBcvPrice = pickPrice(Number(variant.price_bundle_bcv || 0), baseBcvPrice);
        const bundleDivisaPrice = pickPrice(Number(variant.price_bundle_divisas || 0), baseDivisaPrice, baseBcvPrice);
        const mayorBcvPrice = pickPrice(Number(variant.price_mayor_bcv || 0), baseBcvPrice);
        const mayorDivisaPrice = pickPrice(Number(variant.price_mayor_divisas || 0), baseDivisaPrice, baseBcvPrice);

        let unitPrice = baseBcvPrice;
        if (pricingMethod === "bcv") {
          if (totalCartCount >= 6) unitPrice = mayorBcvPrice;
          else if (totalCartCount >= 3) unitPrice = bundleBcvPrice;
          else unitPrice = baseBcvPrice;
        } else {
          if (totalCartCount >= 6) unitPrice = mayorDivisaPrice;
          else if (totalCartCount >= 3) unitPrice = bundleDivisaPrice;
          else unitPrice = baseDivisaPrice;
        }

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
            price_bcv: baseBcvPrice,
            price_divisas: baseDivisaPrice,
            price_bundle_bcv: bundleBcvPrice,
            price_bundle_divisas: bundleDivisaPrice,
            price_mayor_bcv: mayorBcvPrice,
            price_mayor_divisas: mayorDivisaPrice,
          },
        });
      }

      totalUsd = parseFloat(totalUsd.toFixed(2));

      // 2. Smart Customer Resolution (Email-First, then Doc)
      const cleanEmail = customer_email.trim().toLowerCase();
      const cleanDocNumber = doc_number.trim();

      let customer = await tx.customer.findFirst({
        where: { email: cleanEmail },
      });

      if (customer) {
        // Update existing customer profile with real doc_number, phone, and address
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            doc_type: doc_type as DocumentType,
            doc_number: cleanDocNumber,
            name: customer_name.trim(),
            lastname: customer_lastname.trim(),
            phone: customer_phone.trim(),
            address: address.trim(),
          },
        });
      } else {
        // Create new customer for this email
        customer = await tx.customer.create({
          data: {
            email: cleanEmail,
            doc_type: doc_type as DocumentType,
            doc_number: cleanDocNumber,
            name: customer_name.trim(),
            lastname: customer_lastname.trim(),
            phone: customer_phone.trim(),
            address: address.trim(),
            email_verified: true,
          },
        });
      }

      const customerId = customer.id;

      // 3. Create System User placeholder for online web order if needed (or admin system id)
      const systemAdmin = await tx.user.findFirst({ where: { role: "admin" } });
      const createdById = systemAdmin?.id ?? customer.id;

      const fullNotes = `[Correo Web: ${cleanEmail}] ${cleanNotes}`.trim();

      // 4. Create Order
      const orderNumber = await generateOrderNumber(tx, "WEB");
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
          total_bcv_usd: pricingMethod === "bcv" ? totalUsd : 0,
          total_divisas_usd: pricingMethod === "divisas" ? totalUsd : 0,
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
            quantity_bcv: pricingMethod === "bcv" ? item.quantity : 0,
            quantity_divisas: pricingMethod === "divisas" ? item.quantity : 0,
            subtotal_bcv_usd: pricingMethod === "bcv" ? item.subtotal_usd : 0,
            subtotal_divisas_usd: pricingMethod === "divisas" ? item.subtotal_usd : 0,
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
      const isVesPayment = ["efectivo_bs", "transferencia", "pago_movil"].includes(validPaymentType);
      const paidAmtUsd = payment.amount_usd ? parseFloat(Number(payment.amount_usd).toFixed(2)) : totalUsd;
      const paidAmtVes = isVesPayment ? parseFloat((paidAmtUsd * tasaRate).toFixed(2)) : null;

      await tx.orderPayment.create({
        data: {
          order_id: order.id,
          payment_type: validPaymentType,
          amount_usd: paidAmtUsd,
          amount_ves: paidAmtVes,
          exchange_rate_id: isVesPayment ? tasaId : null,
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
        total_ves: isVesPayment ? (paidAmtVes ?? undefined) : undefined,
        customer_email: customer_email.trim().toLowerCase(),
        customer_name: customer_name.trim(),
        shipping_company: shipping_company.trim(),
        address: address.trim(),
        payment_type: validPaymentType,
      };
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // 7. Send confirmation email to customer (await execution for Vercel serverless stability)
    const emailRes = await sendOrderCreatedEmail({
      to: result.customer_email,
      customerName: result.customer_name,
      orderNumber: result.order_number,
      totalUsd: result.total_usd,
      totalVes: result.total_ves,
      shippingCompany: result.shipping_company,
      address: result.address,
      paymentMethod: result.payment_type === "efectivo_usd" ? "Efectivo en Tienda (USD Divisas)" : payment.payment_type,
      trackingUrl: `${baseUrl}/consultar-orden`,
    }).catch((err) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));

    if (!emailRes.success) {
      console.error(`[CHECKOUT EMAIL ERROR] No se pudo entregar el correo de orden #${result.order_number} a ${result.customer_email}:`, emailRes.error);
    }

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
