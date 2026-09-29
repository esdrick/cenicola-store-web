import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkPinRateLimit, recordPinAttempt } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Ingresa tu correo electrónico." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if on cooldown or rate limited
    const rateCheck = checkPinRateLimit(`forgot:${cleanEmail}`, {
      cooldownMs: 60 * 1000,
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: rateCheck.error || "Debes esperar antes de solicitar otro código de recuperación.",
          secondsRemaining: rateCheck.secondsRemaining,
        },
        { status: 429 }
      );
    }

    // 2. Validate customer account existence
    const customerAccount = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (!customerAccount) {
      return NextResponse.json(
        { error: "No encontramos ninguna cuenta registrada con este correo. Por favor regístrate primero." },
        { status: 404 }
      );
    }

    if (!customerAccount.is_active) {
      return NextResponse.json({ error: "Cuenta desactivada. Contacta a soporte." }, { status: 403 });
    }

    // 3. Valid account found -> commit attempt timestamp to rate limiter
    recordPinAttempt(`forgot:${cleanEmail}`);

    // Generate 6-digit PIN code
    const resetPin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await prisma.customerAccount.update({
      where: { id: customerAccount.id },
      data: {
        reset_token: resetPin,
        reset_token_expiry: expiry,
      },
    });

    // Enviar correo de recuperación
    const emailRes = await sendPasswordResetEmail({
      to: cleanEmail,
      customerName: customerAccount.name,
      resetPin,
    }).catch((err) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));

    if (!emailRes.success) {
      console.error(`[FORGOT PASSWORD EMAIL ERROR] No se pudo entregar el correo de recuperación a ${cleanEmail}:`, emailRes.error);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[PASS_RESET_PIN DEV] Sent PIN ${resetPin} to ${cleanEmail}`);
    } else {
      console.log(`[PASS_RESET_PIN] Sent reset PIN email to ${cleanEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: "Se ha enviado un código de recuperación de 6 dígitos a tu correo.",
      devPin: process.env.NODE_ENV !== "production" ? resetPin : undefined,
    });
  } catch (err) {
    console.error("POST /api/store/auth/forgot-password:", err);
    return NextResponse.json({ error: "Error al procesar la solicitud de recuperación." }, { status: 500 });
  }
}

