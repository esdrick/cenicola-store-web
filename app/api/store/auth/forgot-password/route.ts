import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Ingresa tu correo electrónico." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const customer = await prisma.customer.findFirst({
      where: { email: cleanEmail },
    });

    if (!customer) {
      // Security best practice: don't reveal whether email exists or not
      return NextResponse.json({
        success: true,
        message: "Si el correo está registrado, recibirás un código de recuperación.",
      });
    }

    if (!customer.is_active) {
      return NextResponse.json({ error: "Cuenta desactivada. Contacta a soporte." }, { status: 403 });
    }

    // Generate 6-digit PIN code
    const resetPin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        reset_token: resetPin,
        reset_token_expiry: expiry,
      },
    });

    // Enviar correo de recuperación
    const emailRes = await sendPasswordResetEmail({
      to: cleanEmail,
      customerName: customer.name,
      resetPin,
    }).catch((err) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));

    if (!emailRes.success) {
      console.error(`[FORGOT PASSWORD EMAIL ERROR] No se pudo entregar el correo de recuperación a ${cleanEmail}:`, emailRes.error);
    }

    console.log(`[PASS_RESET_PIN] Sent PIN ${resetPin} to ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: "Se ha generado tu código de recuperación de 6 dígitos.",
      // For development ease & testing, returned in response if needed
      devPin: process.env.NODE_ENV !== "production" ? resetPin : undefined,
    });
  } catch (err) {
    console.error("POST /api/store/auth/forgot-password:", err);
    return NextResponse.json({ error: "Error al procesar la solicitud de recuperación." }, { status: 500 });
  }
}
