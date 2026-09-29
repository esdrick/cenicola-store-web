import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationPINCodeEmail } from "@/lib/email";
import { checkPinRateLimit, recordPinAttempt } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Ingresa un correo electrónico válido" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if on cooldown or rate limited
    const rateCheck = checkPinRateLimit(`resend:${cleanEmail}`, {
      cooldownMs: 60 * 1000,
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: rateCheck.error || "Debes esperar antes de solicitar otro código.",
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
      return NextResponse.json({ error: "No se encontró ninguna cuenta con ese correo electrónico" }, { status: 404 });
    }

    if (customerAccount.email_verified) {
      return NextResponse.json({ error: "Esta cuenta ya se encuentra verificada. Puedes iniciar sesión." }, { status: 400 });
    }

    // 3. Valid unverified account found -> commit attempt timestamp to rate limiter
    recordPinAttempt(`resend:${cleanEmail}`);

    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.customerAccount.update({
      where: { id: customerAccount.id },
      data: {
        verification_code: pinCode,
        verification_expiry: verificationExpiry,
      },
    });

    const emailRes = await sendVerificationPINCodeEmail(customerAccount.name, cleanEmail, pinCode).catch((err) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));

    if (!emailRes.success) {
      console.error(`[RESEND PIN EMAIL ERROR] No se pudo entregar el correo con PIN a ${cleanEmail}:`, emailRes.error);
    }

    return NextResponse.json({
      success: true,
      message: `Un nuevo código PIN de 6 dígitos ha sido enviado a ${cleanEmail}`,
    });
  } catch (err) {
    console.error("POST /api/store/auth/resend-pin:", err);
    return NextResponse.json({ error: "Error al reenviar el código PIN" }, { status: 500 });
  }
}

