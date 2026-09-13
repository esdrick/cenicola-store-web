import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationPINCodeEmail } from "@/lib/email";
import { validateEmailDomain } from "@/lib/email-validator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lastname, email, password, phone, doc_type, doc_number } = body;

    if (!name || !lastname || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados (Nombre, Apellido, Email, Clave)" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const VALID_DOC_TYPES = ["V", "P", "J", "E"] as const;
    const cleanDocType = doc_type && VALID_DOC_TYPES.includes(doc_type) ? (doc_type as "V" | "P" | "J" | "E") : "V";
    const cleanDocNumber = doc_number ? String(doc_number).trim().toUpperCase() : null;

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

    // Accounts are strictly unique by EMAIL on CustomerAccount
    const existingAccount = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    // Only block if account is already verified AND has an established password.
    if (existingAccount && existingAccount.email_verified && existingAccount.password_hash) {
      return NextResponse.json(
        { error: "Este correo electrónico ya se encuentra registrado. Inicia sesión." },
        { status: 400 }
      );
    }

    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const password_hash = await bcrypt.hash(cleanPassword, 10);

    let customerAccount;
    if (existingAccount) {
      // If customer came from Google OAuth, keep email_verified true when setting password
      const isGoogleUser = Boolean(existingAccount.email_verified && !existingAccount.password_hash);
      customerAccount = await prisma.customerAccount.update({
        where: { id: existingAccount.id },
        data: {
          name: name.trim(),
          lastname: lastname.trim(),
          doc_type: cleanDocType,
          doc_number: cleanDocNumber || existingAccount.doc_number,
          password_hash,
          verification_code: isGoogleUser ? null : pinCode,
          verification_expiry: isGoogleUser ? null : verificationExpiry,
          email_verified: isGoogleUser ? true : false,
          phone: phone?.trim() || existingAccount.phone,
        },
      });

      if (isGoogleUser) {
        return NextResponse.json({
          success: true,
          requiresVerification: false,
          require_pin: false,
          email: cleanEmail,
          message: "Tu contraseña ha sido vinculada exitosamente a tu cuenta.",
        });
      }
    } else {
      customerAccount = await prisma.customerAccount.create({
        data: {
          name: name.trim(),
          lastname: lastname.trim(),
          doc_type: cleanDocType,
          doc_number: cleanDocNumber,
          email: cleanEmail,
          password_hash,
          verification_code: pinCode,
          verification_expiry: verificationExpiry,
          email_verified: false,
          phone: phone?.trim() || null,
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

    // Send email PIN code
    const emailRes = await sendVerificationPINCodeEmail(customerAccount.name, cleanEmail, pinCode).catch((err) => ({
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
  } catch (err: unknown) {
    console.error("POST /api/store/auth/register error:", err);
    const errorObj = err as { code?: string; meta?: { target?: string | string[] } };
    if (errorObj?.code === "P2002") {
      return NextResponse.json(
        { error: "Este correo electrónico ya se encuentra registrado. Inicia sesión." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error al registrar la cuenta de cliente" }, { status: 500 });
  }
}

