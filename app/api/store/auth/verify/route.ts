import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;
    const pin_code = body.pin_code || body.pin;

    if (!email || !pin_code) {
      return NextResponse.json({ error: "Ingresa tu correo y el código PIN de 6 dígitos" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = String(pin_code).trim();

    const customerAccount = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (!customerAccount) {
      return NextResponse.json({ error: "No encontramos una cuenta con este correo" }, { status: 404 });
    }

    if (!customerAccount.verification_code || customerAccount.verification_code !== cleanPin) {
      return NextResponse.json({ error: "El código PIN ingresado es incorrecto" }, { status: 400 });
    }

    if (customerAccount.verification_expiry && customerAccount.verification_expiry < new Date()) {
      return NextResponse.json({ error: "El código PIN ha expirado. Solicita un nuevo código." }, { status: 400 });
    }

    const updatedAccount = await prisma.customerAccount.update({
      where: { id: customerAccount.id },
      data: {
        email_verified: true,
        verification_code: null,
        verification_expiry: null,
      },
    });

    const sessionPayload = {
      id: updatedAccount.id,
      name: updatedAccount.name,
      lastname: updatedAccount.lastname,
      email: updatedAccount.email,
      phone: updatedAccount.phone,
      doc_type: updatedAccount.doc_type || "V",
      doc_number: updatedAccount.doc_number || "",
    };

    const token = await new SignJWT(sessionPayload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getSecret());

    const response = NextResponse.json({
      success: true,
      verified: true,
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
    console.error("POST /api/store/auth/verify:", err);
    return NextResponse.json({ error: "Error al verificar código PIN" }, { status: 500 });
  }
}

