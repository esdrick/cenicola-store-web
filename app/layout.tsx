import type { Metadata } from "next";
import localFont from "next/font/local";
import { DevSwCleanup } from "@/components/shared/DevSwCleanup";
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

export const metadata: Metadata = {
  title: "Q´FRANELAS",
  description: "Tienda de ropa moderna en Venezuela. Ofrecemos moda, elegancia y la mejor experiencia de compra online con entrega rápida a todo el país.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Q´FRANELAS",
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
        <DevSwCleanup />
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </body>
    </html>
  );
}
