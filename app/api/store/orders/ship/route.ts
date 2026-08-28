import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderShippedEmail, extractCustomerEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/store/orders/ship — Record shipment info, update order status to "enviada", and send email with tracking & package photo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const {
      order_number,
      shipping_company,
      tracking_number,
      photo_package,
      photo_receipt,
      photo_guide,
      notes,
    } = body;

    if (!order_number || !order_number.trim()) {
      return NextResponse.json({ error: "Número de orden (order_number) requerido." }, { status: 400 });
    }

    const cleanOrderNumber = order_number.trim().toUpperCase();

    // 1. Find Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { order_number: cleanOrderNumber },
          { order_number: { endsWith: cleanOrderNumber } },
        ],
      },
      include: {
        customer: true,
        shipment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    // Get an admin user ID for packed_by mandatory foreign key in OrderShipment
    const systemAdmin = await prisma.user.findFirst({ where: { role: "admin" } });
    const packedById = systemAdmin?.id ?? order.created_by ?? order.customer_id;

    if (!packedById) {
      return NextResponse.json({ error: "No se encontró usuario para registrar el embalaje/envío." }, { status: 400 });
    }

    // 2. Create or update OrderShipment & update Order status to "enviada"
    const finalShippingCompany = shipping_company?.trim() || order.shipping_company || "MRW";
    const finalTrackingNumber = tracking_number?.trim() || null;
    const finalPhotoPackage = photo_package?.trim() || order.shipment?.photo_package || "";

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "enviada",
          shipping_company: finalShippingCompany,
          updated_at: new Date(),
        },
      }),
      prisma.orderShipment.upsert({
        where: { order_id: order.id },
        create: {
          order_id: order.id,
          packed_by: packedById,
          packed_at: new Date(),
          shipped_at: new Date(),
          tracking_number: finalTrackingNumber,
          photo_package: finalPhotoPackage,
          photo_receipt: photo_receipt?.trim() || null,
          photo_guide: photo_guide?.trim() || null,
          notes: notes?.trim() || null,
        },
        update: {
          shipped_at: new Date(),
          tracking_number: finalTrackingNumber,
          photo_package: finalPhotoPackage,
          photo_receipt: photo_receipt?.trim() || undefined,
          photo_guide: photo_guide?.trim() || undefined,
          notes: notes?.trim() || undefined,
        },
      }),
    ]);

    // 3. Send email to customer
    const recipientEmail = order.customer?.email || extractCustomerEmail(order.notes);
    let emailSent = false;
    let emailError: string | undefined;

    if (recipientEmail) {
      const emailRes = await sendOrderShippedEmail({
        to: recipientEmail,
        customerName: `${order.customer_name} ${order.customer_lastname}`.trim(),
        orderNumber: order.order_number,
        shippingCompany: finalShippingCompany,
        trackingNumber: finalTrackingNumber || undefined,
        packagePhotoUrl: finalPhotoPackage || undefined,
      });

      emailSent = emailRes.success;
      emailError = emailRes.error;
    }

    return NextResponse.json({
      success: true,
      message: `Orden #${order.order_number} marcada como enviada exitosamente.`,
      email_sent: emailSent,
      recipient_email: recipientEmail || null,
      email_error: emailError || null,
    });
  } catch (err) {
    console.error("POST /api/store/orders/ship error:", err);
    return NextResponse.json({ error: "Error al registrar el envío de la orden." }, { status: 500 });
  }
}
