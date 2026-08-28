import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

// GET /api/store/banks — Public bank account details (solo para usuarios autenticados)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cenicola_customer_session")?.value;
    const secret = getSecret();

    let authenticated = false;
    if (token && secret) {
      try {
        await jwtVerify(token, secret);
        authenticated = true;
      } catch {
        authenticated = false;
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: "Debes registrarte o iniciar sesión para ver las cuentas bancarias de la empresa", authenticated: false },
        { status: 200 }
      );
    }

    const fallbackBanks = [
      {
        id: "pago-movil-banesco",
        payment_type: "pago_movil",
        bank_name: process.env.PAGO_MOVIL_BANK || "Banesco (0134)",
        account_name: process.env.PAGO_MOVIL_NAME || "José Cenicola",
        id_number: process.env.PAGO_MOVIL_ID || "29.890.622",
        phone_number: process.env.PAGO_MOVIL_PHONE || "0424-355-9307",
        email: null,
        account_num: null,
        is_active: true,
        notes: "Recuerda enviarnos el capture del pago con el nombre del titular. En la descripción del pago no colocar ningún concepto.",
      },
      {
        id: "zelle-cenicola",
        payment_type: "zelle",
        bank_name: "Zelle",
        account_name: process.env.ZELLE_NAME || "José Cenicola",
        id_number: null,
        phone_number: null,
        email: process.env.ZELLE_EMAIL || "Cenicola9@gmail.com",
        account_num: null,
        is_active: true,
        notes: "Recuerda enviarnos el capture del pago con el nombre del titular. En la descripción del pago no colocar ningún concepto.",
      },
      {
        id: "transferencia-banesco",
        payment_type: "transferencia",
        bank_name: "Banesco (0134)",
        account_name: process.env.BANESCO_TRANSFER_NAME || "Jose cenicola",
        id_number: process.env.BANESCO_TRANSFER_ID || "29.890.622",
        phone_number: null,
        email: null,
        account_num: process.env.BANESCO_TRANSFER_ACCOUNT || "0134-0325-24-3251062525",
        is_active: true,
        notes: "Transferencia Bancaria Banesco",
      },
      {
        id: "transferencia-venezuela",
        payment_type: "transferencia",
        bank_name: "Banco de Venezuela (0102)",
        account_name: process.env.VENEZUELA_TRANSFER_NAME || "José Cenicola",
        id_number: process.env.VENEZUELA_TRANSFER_ID || "V29890622",
        phone_number: null,
        email: null,
        account_num: process.env.VENEZUELA_TRANSFER_ACCOUNT || "0102-0730-41-0000249654",
        is_active: true,
        notes: "Transferencia Bancaria Banco de Venezuela",
      },
      {
        id: "binance-usdt",
        payment_type: "usdt",
        bank_name: "Binance Pay (USDT)",
        account_name: process.env.BINANCE_ALIAS || "Alias: Quefranelas",
        id_number: "ID: 98620705",
        phone_number: null,
        email: process.env.BINANCE_EMAIL || "Cenicola9@gmail.com",
        account_num: null,
        is_active: true,
        notes: "Id Binance: 98620705 | Alias: Quefranelas",
      },
    ];

    return NextResponse.json({ authenticated: true, data: fallbackBanks });
  } catch (err) {
    console.error("GET /api/store/banks:", err);
    return NextResponse.json({ error: "Error al obtener datos bancarios" }, { status: 500 });
  }
}
