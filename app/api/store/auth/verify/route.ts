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

    const customer = await prisma.customer.findFirst({
      where: { email: cleanEmail },
    });

    if (!customer) {
      return NextResponse.json({ error: "No encontramos una cuenta con este correo" }, { status: 404 });
    }

    if (!customer.verification_code || customer.verification_code !== cleanPin) {
      return NextResponse.json({ error: "El código PIN ingresado es incorrecto" }, { status: 400 });
    }

    if (customer.verification_expiry && customer.verification_expiry < new Date()) {
      return NextResponse.json({ error: "El código PIN ha expirado. Solicita un nuevo código." }, { status: 400 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        email_verified: true,
        verification_code: null,
        verification_expiry: null,
      },
    });

    const sessionPayload = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      lastname: updatedCustomer.lastname,
      email: updatedCustomer.email!,
      doc_type: updatedCustomer.doc_type,
      doc_number: updatedCustomer.doc_number,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
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
