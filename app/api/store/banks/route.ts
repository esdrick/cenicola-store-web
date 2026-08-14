import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/store/banks — Public bank account details for store checkout
export async function GET() {
  try {
    const fallbackBanks = [
      {
        id: "default-pago-movil",
        payment_type: "pago_movil",
        bank_name: "Banesco (0134)",
        account_name: "CenicolasHub C.A.",
        id_number: "J-50123456-7",
        phone_number: "04121234567",
        email: null,
        account_num: null,
        is_active: true,
        notes: "Realiza tu Pago Móvil y coloca la referencia exacta.",
      },
      {
        id: "default-zelle",
        payment_type: "zelle",
        bank_name: "Zelle / Chase",
        account_name: "CenicolasHub Store",
        id_number: null,
        phone_number: null,
        email: "pagos@cenicolashub.com",
        account_num: null,
        is_active: true,
        notes: "Enviar Pago Zelle y colocar el nombre del titular en el concepto.",
      },
      {
        id: "default-transferencia",
        payment_type: "transferencia",
        bank_name: "Banco de Venezuela (0102)",
        account_name: "CenicolasHub C.A.",
        id_number: "J-50123456-7",
        phone_number: null,
        email: null,
        account_num: "0102-0123-45-0001234567",
        is_active: true,
        notes: "Transferencia desde cualquier banco nacional en Bolívares.",
      },
    ];

    return NextResponse.json({ data: fallbackBanks });
  } catch (err) {
    console.error("GET /api/store/banks:", err);
    return NextResponse.json({ error: "Error al obtener datos bancarios" }, { status: 500 });
  }
}
