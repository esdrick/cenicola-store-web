import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qfranelas.com";

  const staticRoutes = [
    "",
    "/catalogo",
    "/checkout",
    "/consultar-orden",
    "/contacto",
    "/cuenta",
    "/ubicacion",
    "/politicas/envios",
    "/politicas/privacidad",
    "/politicas/terminos-condiciones",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/catalogo" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/catalogo" ? 0.9 : 0.6,
  }));
}
