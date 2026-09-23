export const COLOR_HEX_MAP: Record<string, string> = {
  negro: "#171717",
  black: "#171717",
  blanco: "#FFFFFF",
  white: "#FFFFFF",
  azul: "#2563EB",
  "azul marino": "#1E3A8A",
  "azul rey": "#1D4ED8",
  "azul cielo": "#38BDF8",
  celeste: "#7DD3FC",
  navy: "#1E3A8A",
  rojo: "#DC2626",
  roja: "#DC2626",
  red: "#DC2626",
  verde: "#16A34A",
  "verde militar": "#4D5D3B",
  "verde oliva": "#556B2F",
  "verde menta": "#86EFAC",
  "verde botella": "#14532D",
  oliva: "#556B2F",
  militar: "#4D5D3B",
  amarillo: "#EAB308",
  mostaza: "#CA8A04",
  marron: "#78350F",
  marrón: "#78350F",
  cafe: "#5C3A21",
  café: "#5C3A21",
  chocolate: "#451A03",
  beige: "#E5DEC9",
  arena: "#D8CDBA",
  crema: "#FFFDD0",
  hueso: "#F5F5DC",
  gris: "#6B7280",
  "gris claro": "#D1D5DB",
  "gris oscuro": "#374151",
  "gris jaspe": "#9CA3AF",
  plomo: "#4B5563",
  rosa: "#F472B6",
  rosado: "#F472B6",
  "palo de rosa": "#DDA0A5",
  "palo rosa": "#DDA0A5",
  morado: "#9333EA",
  lila: "#C084FC",
  lavanda: "#E9D5FF",
  violeta: "#7E22CE",
  purpura: "#7E22CE",
  púrpura: "#7E22CE",
  fucsia: "#D946EF",
  magenta: "#D946EF",
  naranja: "#EA580C",
  coral: "#FB7185",
  salmon: "#FA8072",
  salmón: "#FA8072",
  vinotinto: "#831843",
  "vino tinto": "#831843",
  vino: "#831843",
  borgoña: "#800020",
  terracota: "#C2410C",
  turquesa: "#06B6D4",
  menta: "#6EE7B7",
  dorado: "#D4AF37",
  oro: "#D4AF37",
  plateado: "#C0C0C0",
  plata: "#C0C0C0",
};

/**
 * Returns the hex code corresponding to a color name in Spanish or standard naming.
 */
export function getColorHex(color?: string | null): string {
  if (!color) return "#171717";
  const normalized = color.toLowerCase().trim();
  
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }

  // Check partial key matches
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key)) {
      return hex;
    }
  }

  // If already a valid hex color
  if (/^#([0-9A-F]{3}){1,2}$/i.test(normalized)) {
    return normalized;
  }

  return "#E2E8F0";
}

/**
 * Checks whether a color is very light (requiring a dark border for contrast on white bg).
 */
export function isLightColor(color?: string | null): boolean {
  if (!color) return false;
  const hex = getColorHex(color).replace("#", "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 200;
  } else if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 200;
  }
  return false;
}
