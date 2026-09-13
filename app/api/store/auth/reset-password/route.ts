import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, pinCode, newPassword } = body;

    if (!email || !pinCode || !newPassword) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pinCode.trim();

    const customerAccount = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (!customerAccount || !customerAccount.reset_token) {
      return NextResponse.json({ error: "Código PIN no válido o no solicitado." }, { status: 400 });
    }

    if (customerAccount.reset_token !== cleanPin) {
      return NextResponse.json({ error: "El código PIN ingresado es incorrecto." }, { status: 400 });
    }

    if (!customerAccount.reset_token_expiry || customerAccount.reset_token_expiry < new Date()) {
      return NextResponse.json({ error: "El código PIN ha expirado. Solicita uno nuevo." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.customerAccount.update({
      where: { id: customerAccount.id },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.",
    });
  } catch (err) {
    console.error("POST /api/store/auth/reset-password:", err);
    return NextResponse.json({ error: "Error al restablecer la contraseña." }, { status: 500 });
  }
}

