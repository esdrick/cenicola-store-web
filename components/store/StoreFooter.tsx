import Link from "next/link";
import { Truck, Zap, CreditCard, MapPin, Store, Smartphone, Globe, Landmark, Banknote } from "lucide-react";

// Minimalist Monochrome Social Icons
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 003 15.68 6.34 6.34 0 009.67 22A6.34 6.34 0 0016 15.68V9.75a8.16 8.16 0 004.77 1.53v-3.4a4.86 4.86 0 01-1.18-.19z" />
    </svg>
  );
}

export default function StoreFooter() {
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "584129831561";
  const whatsappUrl = `https://wa.me/${whatsappPhone}`;
  const instagramUrl = "https://www.instagram.com/quefranelas?igsh=MWYzZm11dmd0NjVhcQ==";
  const tiktokUrl = "https://www.tiktok.com/@quefranelas";

  return (
    <footer className="w-full bg-white text-black border-t border-slate-200 font-sans selection:bg-black selection:text-white" suppressHydrationWarning>
      {/* Top Social Media Header Bar - Primary Position Above Banner */}
      <div className="border-b border-slate-100 py-6 px-4 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium">
          <span className="text-[10px] text-slate-400 font-semibold tracking-[0.2em] sm:tracking-[0.25em]">
            SOCIAL & CONTACTO
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] text-slate-700">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-black transition-colors group"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-slate-800 group-hover:text-black shrink-0" />
              <span>WHATSAPP</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-black transition-colors group"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-slate-800 group-hover:text-black shrink-0" />
              <span>INSTAGRAM</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-black transition-colors group"
            >
              <TikTokIcon className="w-3.5 h-3.5 text-slate-800 group-hover:text-black shrink-0" />
              <span>TIKTOK</span>
            </a>
          </div>
        </div>
      </div>

      {/* Value Props Bar - Minimalist Editorial Style */}
      <div className="border-b border-slate-100 py-10 px-4 sm:px-8 lg:px-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-3.5">
            <Truck className="w-5 h-5 text-black shrink-0 stroke-[1.25] mt-0.5" />
            <div>
              <h4 className="font-semibold text-black text-[11px] uppercase tracking-[0.2em]">
                ENVÍOS NACIONALES
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Despachamos a toda Venezuela por MRW, Zoom y Tealca.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Store className="w-5 h-5 text-black shrink-0 stroke-[1.25] mt-0.5" />
            <div>
              <h4 className="font-semibold text-black text-[11px] uppercase tracking-[0.2em]">
                RETIRO EN TIENDA
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Retira tu compra directo en nuestras sedes de Caracas y Maracay.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <CreditCard className="w-5 h-5 text-black shrink-0 stroke-[1.25] mt-0.5" />
            <div>
              <h4 className="font-semibold text-black text-[11px] uppercase tracking-[0.2em]">
                PAGO MÓVIL & ZELLE
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Paga con los mismos métodos oficiales de la tienda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <Zap className="w-5 h-5 text-black shrink-0 stroke-[1.25] mt-0.5" />
            <div>
              <h4 className="font-semibold text-black text-[11px] uppercase tracking-[0.2em]">
                ATENCIÓN INMEDIATA
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Atención personalizada y notificaciones al instante.
              </p>
              <div className="pt-2 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold tracking-wider uppercase">
                  Soporte Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links - Lefties Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-xs">
        {/* Brand Info Column */}
        <div className="space-y-3 pr-4">
          <span className="font-sans text-xl font-bold tracking-[0.05em] text-black uppercase block">
            Q´FRANELAS
          </span>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
            Tienda de ropa moderna en Venezuela. Ofrecemos moda, elegancia y la mejor experiencia de compra online con entrega rápida.
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-slate-400 pt-2 inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 stroke-[1.5]" />
            <span>VENEZUELA</span>
          </p>
        </div>

        {/* Navigation Column */}
        <div>
          <h5 className="font-semibold text-black text-[11px] uppercase tracking-[0.2em] mb-4">
            NAVEGACIÓN
          </h5>
          <ul className="space-y-3 text-xs uppercase tracking-wider text-slate-600">
            <li>
              <Link href="/" className="hover:text-black transition-colors">
                INICIO
              </Link>
            </li>
            <li>
              <Link href="/catalogo" className="hover:text-black transition-colors">
                CATÁLOGO DE PRODUCTOS
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:text-black transition-colors">
                FINALIZAR COMPRA
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:text-black transition-colors">
                ¿DÓNDE ENCONTRARNOS?
              </Link>
            </li>
          </ul>
        </div>

        {/* Methods of Payment Column */}
        <div>
          <h5 className="font-semibold text-black text-[11px] uppercase tracking-[0.2em] mb-4">
            MÉTODOS DE PAGO
          </h5>
          <ul className="space-y-4 text-xs text-slate-600">
            <li>
              <div className="flex items-center gap-2 mb-0.5">
                <Smartphone className="w-3.5 h-3.5 text-black shrink-0 stroke-[1.5]" />
                <span className="font-medium text-black uppercase tracking-wider text-[11px]">
                  Pago Móvil
                </span>
              </div>
              <span className="text-slate-500 text-[11px] pl-5 block">
                Todos los bancos venezolanos
              </span>
            </li>
            <li>
              <div className="flex items-center gap-2 mb-0.5">
                <Globe className="w-3.5 h-3.5 text-black shrink-0 stroke-[1.5]" />
                <span className="font-medium text-black uppercase tracking-wider text-[11px]">
                  Zelle (USD)
                </span>
              </div>
              <span className="text-slate-500 text-[11px] pl-5 block">
                Transferencias internacionales
              </span>
            </li>
            <li>
              <div className="flex items-center gap-2 mb-0.5">
                <Landmark className="w-3.5 h-3.5 text-black shrink-0 stroke-[1.5]" />
                <span className="font-medium text-black uppercase tracking-wider text-[11px]">
                  Transferencias Bancarias
                </span>
              </div>
              <span className="text-slate-500 text-[11px] pl-5 block">
                Bolívares (VES)
              </span>
            </li>
            <li>
              <div className="flex items-center gap-2 mb-0.5">
                <Banknote className="w-3.5 h-3.5 text-black shrink-0 stroke-[1.5]" />
                <span className="font-medium text-black uppercase tracking-wider text-[11px]">
                  Efectivo USD / VES
                </span>
              </div>
              <span className="text-slate-500 text-[11px] pl-5 block">
                Retiro directo en tiendas Caracas y Maracay
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Lefties Minimalist Bottom Bar */}
      <div className="border-t border-slate-100 py-8 px-4 sm:px-8 lg:px-12 text-[10px] text-slate-500 uppercase tracking-widest mt-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Q´FRANELAS. TODOS LOS DERECHOS RESERVADOS.</p>
          <div className="flex items-center gap-6">
            <span>VENEZUELA</span>
            <span>|</span>
            <span>ESPAÑOL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
