// Helper utilities for WhatsApp order integration & volume pricing calculation

export type CartItemVolume = {
  variant_id: string;
  product_id: string;
  name: string;
  size: string;
  color?: string | null;
  quantity: number;
  price_usd: number; // Detal base price
  price_bundle_usd?: number; // Price per unit when buying package (4-5 units)
  price_mayor_usd?: number; // Price per unit when buying docena (6+ units)
};

export type VolumeTierInfo = {
  tier: "detal" | "paquete" | "docena";
  effectiveUnitPrice: number;
  badgeLabel?: string;
  discountPercentage?: number;
};

export function getVolumeTierInfo(
  quantity: number,
  item: CartItemVolume,
  totalCartItems?: number
): VolumeTierInfo {
  const basePrice = item.price_usd;
  const volumeSignal = totalCartItems && totalCartItems > 0 ? totalCartItems : quantity;

  if (volumeSignal >= 6) {
    const docenaPrice = item.price_mayor_usd && item.price_mayor_usd > 0
      ? item.price_mayor_usd
      : Number((basePrice * 0.70).toFixed(2));
    const discount = Math.round(((basePrice - docenaPrice) / basePrice) * 100);
    return {
      tier: "docena",
      effectiveUnitPrice: docenaPrice,
      badgeLabel: "[Docena]",
      discountPercentage: Math.max(0, discount),
    };
  }

  if (volumeSignal >= 3) {
    const bundlePrice = item.price_bundle_usd && item.price_bundle_usd > 0
      ? item.price_bundle_usd
      : Number((basePrice * 0.85).toFixed(2));
    const discount = Math.round(((basePrice - bundlePrice) / basePrice) * 100);
    return {
      tier: "paquete",
      effectiveUnitPrice: bundlePrice,
      badgeLabel: "[Paquete]",
      discountPercentage: Math.max(0, discount),
    };
  }

  return {
    tier: "detal",
    effectiveUnitPrice: basePrice,
  };
}

export type WhatsAppOrderPayload = {
  customerName: string;
  customerPhone?: string;
  docNumber?: string;
  address?: string;
  shippingCompany?: string;
  paymentMethod: string;
  reference?: string;
  paymentPhotoUrl?: string;
  notes?: string;
  bcvRate: number;
  items: {
    variant_id?: string;
    product_name: string;
    size: string;
    color?: string | null;
    quantity: number;
    unit_price_usd: number;
    tier: "detal" | "paquete" | "docena";
    subtotal_usd: number;
  }[];
  totalUsd: number;
  totalVes: number;
};

// Explicit Unicode escape codes so Webpack/SWC compiler never corrupts multi-byte emojis
const EMOJI = {
  coin: "\u{1F3FA}",
  flagVe: "\u{1F1FB}\u{1F1EA}",
  phone: "\u{1F4DE}",
  idDoc: "\u{1F194}",
  pin: "\u{1F4CD}",
  cash: "\u{1F4B5}",
  memo: "\u{1F4DD}",
  frame: "\u{1F5BC}\u{FE0F}",
  check: "\u{2714}\u{FE0F}",
  pointUp: "\u{261D}\u{FE0F}",
};

/**
 * Encodes order payload into compact URL-safe Base64 string
 */
export function encodeOrderForVendedora(payload: WhatsAppOrderPayload): string {
  try {
    const jsonStr = JSON.stringify(payload);
    if (typeof btoa === "function") {
      return btoa(unescape(encodeURIComponent(jsonStr)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }
    const buf = (globalThis as unknown as { Buffer?: { from: (s: string) => { toString: (e: string) => string } } }).Buffer;
    if (buf) {
      return buf.from(jsonStr)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Decodes order payload from compact URL-safe Base64 string or URI Component
 */
export function decodeOrderForVendedora(encodedData: string): WhatsAppOrderPayload | null {
  if (!encodedData) return null;
  try {
    let base64 = encodedData.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    let jsonStr = "";
    if (typeof atob === "function") {
      jsonStr = decodeURIComponent(escape(atob(base64)));
    } else {
      const buf = (globalThis as unknown as { Buffer?: { from: (s: string, e: string) => { toString: (e: string) => string } } }).Buffer;
      if (buf) {
        jsonStr = buf.from(base64, "base64").toString("utf-8");
      }
    }
    return JSON.parse(jsonStr);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(encodedData));
    } catch {
      return null;
    }
  }
}

/**
 * Checks if a payment method name corresponds to foreign currency (divisas)
 */
export function isDivisasPaymentMethod(paymentMethod?: string): boolean {
  if (!paymentMethod) return false;
  const clean = paymentMethod.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return [
    "zelle",
    "usdt",
    "panama",
    "banco_panama",
    "efectivo",
    "efectivo_usd",
    "efectivo usd",
    "efectivo en tienda",
    "divisa",
    "usd",
    "$",
    "zinli",
    "binance",
    "paypal",
    "pago_divisas",
    "pago divisas",
  ].some((m) => clean.includes(m));
}

/**
 * Formats WhatsApp message in exact PideFácil structure using immune Unicode escape sequences
 */
export function formatWhatsAppOrderMessage(payload: WhatsAppOrderPayload): string {
  let text = `¡Hola! Acabo de realizar el siguiente pedido en *Q´ FRANELAS*:\n\n`;
  text += `_________________________\n\n`;
  text += `*Resumen del pedido:*\n\n`;

  payload.items.forEach((item) => {
    const tierBadge = item.tier === "docena" ? " [Docena]" : item.tier === "paquete" ? " [Paquete]" : "";
    text += `*_${item.quantity}x - ${item.product_name} ($${item.subtotal_usd.toFixed(2)})_*\n`;
    text += `Talla: ${item.size}${item.color ? ` | Color: ${item.color}` : ""}${tierBadge}\n\n`;
  });

  text += `*${EMOJI.coin} Total USD: $${payload.totalUsd.toFixed(2)}*\n`;
  if (!isDivisasPaymentMethod(payload.paymentMethod)) {
    text += `*${EMOJI.flagVe} Total Bs (BCV ${payload.bcvRate.toFixed(2)}): Bs. ${payload.totalVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}*\n`;
  }
  text += `\n`;

  text += `_________________________\n\n`;
  text += `*${payload.customerName}*\n`;
  if (payload.customerPhone) text += `${EMOJI.phone} ${payload.customerPhone}\n`;
  if (payload.docNumber) text += `${EMOJI.idDoc} ${payload.docNumber}\n`;
  if (payload.address) text += `${EMOJI.pin} ${payload.address}\n`;
  text += `${EMOJI.cash} ${payload.paymentMethod}${payload.reference ? ` (Ref: ${payload.reference})` : ""}\n`;
  if (payload.notes) text += `${EMOJI.memo} Nota: ${payload.notes}\n`;

  if (payload.paymentPhotoUrl) {
    text += `${EMOJI.frame} Comprobante en Web: Adjuntado ${EMOJI.check}\n`;
  }

  text += `\n${EMOJI.pointUp} Por favor envía este mensaje y te atenderemos lo antes posible`;

  return text;
}

/**
 * Returns official universal WhatsApp API link with Unicode escape string
 */
export function getWhatsAppUrl(payload: WhatsAppOrderPayload, phoneOverride?: string): string {
  const rawPhone = phoneOverride || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "584220296537";
  const phone = rawPhone.replace(/[^0-9]/g, "");
  const text = formatWhatsAppOrderMessage(payload);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

/**
 * Parses raw PideFácil / Cenicola Hub WhatsApp message pasted by Vendedora
 */
export function parseWhatsAppTextPayload(text: string): Partial<WhatsAppOrderPayload> {
  const result: Partial<WhatsAppOrderPayload> = {
    items: [],
  };

  const getMatch = (regex: RegExp) => {
    const m = text.match(regex);
    return m ? m[1].trim() : "";
  };

  result.customerPhone = getMatch(/(?:📞|[\u{1F4DE}])\s*([0-9\s+-]+)/u) || getMatch(/📞\s*([0-9\s+-]+)/);
  result.docNumber = getMatch(/(?:🆔|[\u{1F194}])\s*([A-Za-z0-9-]+)/u) || getMatch(/🆔\s*([A-Za-z0-9-]+)/);
  result.address = getMatch(/(?:📍|[\u{1F4CD}])\s*(.+)/u) || getMatch(/📍\s*(.+)/);
  result.paymentMethod = getMatch(/(?:💵|[\u{1F4B5}])\s*([^(]+)/u) || getMatch(/💵\s*([^(]+)/);
  result.reference = getMatch(/\(Ref:\s*([^)]+)\)/);
  result.notes = getMatch(/(?:📝|[\u{1F4DD}])\s*Nota:\s*(.+)/u) || getMatch(/Nota:\s*(.+)/);

  // Extract Customer Name (Line right after the second '_________________________')
  const sections = text.split(/_________________________/);
  if (sections.length >= 3) {
    const bottomLines = sections[2].trim().split("\n");
    if (bottomLines.length > 0) {
      result.customerName = bottomLines[0].replace(/\*/g, "").trim();
    }
  }

  if (!result.customerName) {
    result.customerName = getMatch(/• \*Cliente:\* (.+)/) || getMatch(/Cliente: (.+)/);
  }

  const totalUsdStr = getMatch(/\*(?:🪙|[\u{1F3FA}])\s*Total (?:USD:\s*\$)?([0-9.]+)\*/u) || getMatch(/Total (?:USD:\s*\$)?([0-9.]+)/);
  if (totalUsdStr) result.totalUsd = parseFloat(totalUsdStr);

  // Parse items from PideFácil style text:
  // *_6x - Corazón Patilla Negro Damas ($30.00)_*
  // Talla: UNIQUE | Color: Negro [Docena]
  const itemRegex = /\*\_(\d+)x\s*-\s*([^(]+)\s*\(\$([0-9.]+)\)_\*\s*\n\s*Talla:\s*([^|\n]+)(?:\|\s*Color:\s*([^[\n]+))?(?:\[(.*?)\])?/gi;

  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const quantity = parseInt(match[1], 10) || 1;
    const product_name = match[2].trim();
    const subtotal_usd = parseFloat(match[3]) || 0;
    const size = match[4].trim();
    const color = match[5] ? match[5].trim() : null;
    const tierRaw = match[6] ? match[6].trim().toLowerCase() : "detal";
    const unit_price_usd = quantity > 0 ? Number((subtotal_usd / quantity).toFixed(2)) : subtotal_usd;

    const tier: "detal" | "paquete" | "docena" = tierRaw.includes("docena")
      ? "docena"
      : tierRaw.includes("paquete")
      ? "paquete"
      : "detal";

    result.items!.push({
      product_name,
      size,
      color,
      quantity,
      unit_price_usd,
      tier,
      subtotal_usd,
    });
  }

  // Fallback regex for standard format
  if (result.items!.length === 0) {
    const fallbackRegex = /\d+\.\s+\*(\d+)x\s+([^*]+)\*\s*\n\s*Talla:\s*([^|\n]+)(?:\|\s*Color:\s*([^[\n]+))?(?:\[(.*?)\])?\s*\n\s*Precio unitario:\s*\$([0-9.]+)\s*->\s*Subtotal:\s*\*\$([0-9.]+)\*/gi;
    while ((match = fallbackRegex.exec(text)) !== null) {
      const quantity = parseInt(match[1], 10) || 1;
      const product_name = match[2].trim();
      const size = match[3].trim();
      const color = match[4] ? match[4].trim() : null;
      const tierRaw = match[5] ? match[5].trim().toLowerCase() : "detal";
      const unit_price_usd = parseFloat(match[6]) || 0;
      const subtotal_usd = parseFloat(match[7]) || (quantity * unit_price_usd);

      const tier: "detal" | "paquete" | "docena" = tierRaw.includes("docena")
        ? "docena"
        : tierRaw.includes("paquete")
        ? "paquete"
        : "detal";

      result.items!.push({
        product_name,
        size,
        color,
        quantity,
        unit_price_usd,
        tier,
        subtotal_usd,
      });
    }
  }

  return result;
}
