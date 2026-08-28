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

    const customer = await prisma.customer.findFirst({
      where: { email: cleanEmail },
    });

    if (!customer || !customer.password_hash) {
      return NextResponse.json({ error: "Credenciales inválidas. Verifica tu correo y contraseña." }, { status: 401 });
    }

    if (!customer.is_active) {
      return NextResponse.json({ error: "Cuenta desactivada. Contacta a soporte." }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, customer.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Credenciales inválidas. Verifica tu correo y contraseña." }, { status: 401 });
    }

    if (!customer.email_verified) {
      const pinCode = customer.verification_code && customer.verification_expiry && customer.verification_expiry > new Date()
        ? customer.verification_code
        : Math.floor(100000 + Math.random() * 900000).toString();

      const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          verification_code: pinCode,
          verification_expiry: verificationExpiry,
        },
      });

      sendVerificationPINCodeEmail(customer.name, cleanEmail, pinCode).catch(console.error);

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
      id: customer.id,
      name: customer.name,
      lastname: customer.lastname,
      email: customer.email!,
      doc_type: customer.doc_type,
      doc_number: customer.doc_number,
      phone: customer.phone,
      address: customer.address,
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
