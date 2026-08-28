export type StoreOfficeKey = "maracay" | "caracas";

export interface StoreOffice {
  id: StoreOfficeKey;
  name: string;
  city: string;
  shortName: string;
  address: string;
  hours: string;
  phone: string;
  whatsappPhone: string;
  mapsUrl: string;
  shippingCompanyValue: string;
  isAvailable: boolean;
}

export const STORE_OFFICES: Record<StoreOfficeKey, StoreOffice> = {
  maracay: {
    id: "maracay",
    name: "Tienda Maracay (Sede Principal)",
    city: "Maracay, Estado Aragua",
    shortName: "Maracay",
    address: "Local 23, Edificio Las Palmas, Av. Bermúdez (al frente del C.C. El Hipódromo), Maracay, Estado Aragua",
    hours: "Lunes a Sábado: 9:00 AM – 5:00 PM",
    phone: "+58 412-9831561",
    whatsappPhone: "584129831561",
    mapsUrl: "https://maps.google.com/?q=Local+23+Edificio+Las+Palmas+Av+Bermudez+Maracay+Venezuela",
    shippingCompanyValue: "Retiro en Tienda - Maracay",
    isAvailable: true,
  },
  caracas: {
    id: "caracas",
    name: "Tienda Caracas",
    city: "Caracas, Distrito Capital",
    shortName: "Caracas",
    address: "Mercado Las Flores, Pasillo 1, Puesto #43, Caracas, Distrito Capital",
    hours: "Lunes a Sábado: 9:00 AM – 5:00 PM",
    phone: "+58 424-3797460",
    whatsappPhone: "584243797460",
    mapsUrl: "https://maps.google.com/?q=Mercado+Las+Flores+Caracas+Venezuela",
    shippingCompanyValue: "Retiro en Tienda - Caracas",
    isAvailable: false,
  },
};

export const PICKUP_ESTIMATED_TIME = "24 a 48 horas hábiles";

export function getStoreOfficeByShippingCompany(shippingCompany?: string | null): StoreOffice | null {
  if (!shippingCompany) return null;
  const str = shippingCompany.toLowerCase();
  if (str.includes("maracay")) return STORE_OFFICES.maracay;
  if (str.includes("caracas")) return STORE_OFFICES.caracas;
  return null;
}
