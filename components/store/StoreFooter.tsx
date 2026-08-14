import Link from "next/link";
import { Truck, ShieldCheck, RefreshCw, CreditCard } from "lucide-react";

export default function StoreFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-sm font-sans">
      {/* Value Value Props Bar */}
      <div className="border-b border-slate-900 bg-slate-900/50 py-10 px-6 w-full">
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="flex items-center md:items-start gap-4">
            <Truck className="w-7 h-7 text-white shrink-0 mx-auto md:mx-0 stroke-[1.5]" />
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-widest">Envíos Nacionales</h4>
              <p className="text-xs text-slate-400 mt-1">Despachamos a toda Venezuela por MRW, Zoom y Tealca.</p>
            </div>
          </div>
          <div className="flex items-center md:items-start gap-4">
            <CreditCard className="w-7 h-7 text-white shrink-0 mx-auto md:mx-0 stroke-[1.5]" />
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-widest">Pago Móvil & Zelle</h4>
              <p className="text-xs text-slate-400 mt-1">Paga con los mismos métodos oficiales de la tienda.</p>
            </div>
          </div>
          <div className="flex items-center md:items-start gap-4">
            <ShieldCheck className="w-7 h-7 text-white shrink-0 mx-auto md:mx-0 stroke-[1.5]" />
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-widest">Compras Verificadas</h4>
              <p className="text-xs text-slate-400 mt-1">Validación de pagos transparente y garantizada.</p>
            </div>
          </div>
          <div className="flex items-center md:items-start gap-4">
            <RefreshCw className="w-7 h-7 text-white shrink-0 mx-auto md:mx-0 stroke-[1.5]" />
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-widest">Atención Inmediata</h4>
              <p className="text-xs text-slate-400 mt-1">Atención personalizada y notificaciones al instante.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <span className="font-sans text-xl font-bold tracking-widest text-white uppercase block">
            Q´ FRANELAS
          </span>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Tienda de ropa moderna en Venezuela. Ofrecemos moda, elegancia y la mejor experiencia de compra online con entrega rápida.
          </p>
        </div>

        <div>
          <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Navegación</h5>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo de Productos</Link></li>
            <li><Link href="/checkout" className="hover:text-white transition-colors">Finalizar Compra</Link></li>
            <li><Link href="/mi-cuenta" className="hover:text-white transition-colors">Mi Cuenta / Pedidos</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Métodos de Pago</h5>
          <ul className="space-y-2.5 text-xs">
            <li>Pago Móvil (Todos los Bancos)</li>
            <li>Zelle (USD)</li>
            <li>Transferencias Bancarias (VES)</li>
            <li>Efectivo USD / VES (Retiro en Tienda)</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Q´ FRANELAS. Todos los derechos reservados. Venezuela.
      </div>
    </footer>
  );
}
