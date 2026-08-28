import type { Metadata } from "next";
import localFont from "next/font/local";
import { WishlistProvider } from "@/components/store/WishlistContext";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qfranelas.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Q´FRANELAS — Tienda de Ropa Moderna en Venezuela",
    template: "%s | Q´FRANELAS",
  },
  description: "Tienda de ropa moderna en Venezuela. Ofrecemos moda, elegancia y la mejor experiencia de compra online con entrega rápida a todo el país.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: baseUrl,
    title: "Q´FRANELAS — Tienda de Ropa Moderna en Venezuela",
    description: "Tienda de ropa moderna en Venezuela. Ofrecemos moda, elegancia y la mejor experiencia de compra online con entrega rápida a todo el país.",
    siteName: "Q´FRANELAS",
    images: [
      {
        url: "/hero-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Q´FRANELAS Store Venezuela",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Q´FRANELAS — Tienda de Ropa Moderna en Venezuela",
    description: "Tienda de ropa moderna en Venezuela. Moda, elegancia y entrega rápida a todo el país.",
    images: ["/hero-banner.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Q´FRANELAS",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </body>
    </html>
  );
}
