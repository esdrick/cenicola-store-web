import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { sendVerificationPINCodeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Ingresa correo y contraseña" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const customerAccount = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (!customerAccount || !customerAccount.password_hash) {
      return NextResponse.json({ error: "Credenciales inválidas. Verifica tu correo y contraseña." }, { status: 401 });
    }

    if (!customerAccount.is_active) {
      return NextResponse.json({ error: "Cuenta desactivada. Contacta a soporte." }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, customerAccount.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Credenciales inválidas. Verifica tu correo y contraseña." }, { status: 401 });
    }

    if (!customerAccount.email_verified) {
      const pinCode = customerAccount.verification_code && customerAccount.verification_expiry && customerAccount.verification_expiry > new Date()
        ? customerAccount.verification_code
        : Math.floor(100000 + Math.random() * 900000).toString();

      const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

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
        console.error(`[LOGIN EMAIL ERROR] No se pudo entregar el correo con PIN a ${cleanEmail}:`, emailRes.error);
      }

      return NextResponse.json(
        {
          error: "Debes confirmar tu correo electrónico con el código PIN antes de iniciar sesión.",
          requiresVerification: true,
          require_pin: true,
          email: cleanEmail,
        },
        { status: 403 }
      );
    }

    const sessionPayload = {
      id: customerAccount.id,
      name: customerAccount.name,
      lastname: customerAccount.lastname,
      email: customerAccount.email,
      phone: customerAccount.phone,
      doc_type: customerAccount.doc_type || "V",
      doc_number: customerAccount.doc_number || "",
    };

    const token = await new SignJWT(sessionPayload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getSecret());

    const response = NextResponse.json({
      success: true,
      customer: sessionPayload,
    });

    response.cookies.set("cenicola_customer_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("POST /api/store/auth/login:", err);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}

