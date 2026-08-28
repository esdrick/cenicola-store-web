import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationPINCodeEmail } from "@/lib/email";
import { validateEmailDomain } from "@/lib/email-validator";
import type { DocumentType } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lastname, email, password, doc_type, doc_number, phone, address } = body;

    if (!name || !lastname || !email || !password || !doc_type || !doc_number) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados (Nombre, Apellido, Email, Clave, Cédula/RIF)" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Validar sintaxis y existencia real del dominio de correo electrónico
    const emailValidation = await validateEmailDomain(cleanEmail);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const cleanPassword = password.trim();
    if (cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres para ser segura" },
        { status: 400 }
      );
    }

    const WEAK_PASSWORDS = ["12345678", "123456789", "password", "contraseña", "qwertyuiop", "12341234"];
    if (WEAK_PASSWORDS.includes(cleanPassword.toLowerCase())) {
      return NextResponse.json(
        { error: "Esta contraseña es demasiado sencilla. Elige una combinación más segura." },
        { status: 400 }
      );
    }

    const cleanDocNumber = doc_number.trim().toUpperCase();

    // Accounts are strictly unique by EMAIL.
    // Cédula/RIF is part of profile/shipping info and can be reused across different user accounts.
    const existingEmail = await prisma.customer.findFirst({
      where: { email: cleanEmail },
    });

    if (existingEmail && existingEmail.email_verified) {
      return NextResponse.json(
        { error: "Este correo electrónico ya se encuentra registrado. Inicia sesión." },
        { status: 400 }
      );
    }

    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const password_hash = await bcrypt.hash(cleanPassword, 10);

    let customer;
    if (existingEmail) {
      customer = await prisma.customer.update({
        where: { id: existingEmail.id },
        data: {
          name: name.trim(),
          lastname: lastname.trim(),
          doc_type: doc_type as DocumentType,
          doc_number: cleanDocNumber,
          password_hash,
          verification_code: pinCode,
          verification_expiry: verificationExpiry,
          email_verified: false,
          phone: phone?.trim() || existingEmail.phone,
          address: address?.trim() || existingEmail.address,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          lastname: lastname.trim(),
          email: cleanEmail,
          password_hash,
          doc_type: doc_type as DocumentType,
          doc_number: cleanDocNumber,
          verification_code: pinCode,
          verification_expiry: verificationExpiry,
          email_verified: false,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
        },
      });
    }

    // Log PIN prominently in dev console
    if (process.env.NODE_ENV !== "production") {
      console.log("\n==================================================");
      console.log(`🔑 [CÓDIGO PIN DE PRUEBA LOCAL DEV]`);
      console.log(`Para: ${cleanEmail}`);
      console.log(`Código PIN de 6 dígitos: ${pinCode}`);
      console.log("==================================================\n");
    }

    // Send email PIN code (await execution so Serverless function on Vercel does not terminate early)
    const emailRes = await sendVerificationPINCodeEmail(customer.name, cleanEmail, pinCode).catch((err) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));

    if (!emailRes.success) {
      console.error(`[REGISTER EMAIL ERROR] No se pudo entregar el correo con PIN a ${cleanEmail}:`, emailRes.error);
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      require_pin: true,
      email: cleanEmail,
      message: `Hemos enviado un código PIN de 6 dígitos a ${cleanEmail}. Ingrésalo para confirmar tu correo.`,
    });
  } catch (err: any) {
    console.error("POST /api/store/auth/register:", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Este correo electrónico ya se encuentra registrado. Inicia sesión." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error al registrar la cuenta de cliente" }, { status: 500 });
  }
}
