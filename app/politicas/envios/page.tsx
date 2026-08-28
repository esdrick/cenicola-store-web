import PolicyWrapper from "@/components/store/PolicyWrapper";
import { Truck, Clock, ShieldAlert, PackageCheck, Store } from "lucide-react";

export const metadata = {
  title: "Política de Envíos y Entregas | Q´FRANELAS",
  description: "Conoce las condiciones, agencias aliadas (MRW, Zoom, Tealca), tiempos de entrega y retiros en tienda física para Venezuela.",
};

export default function EnviosPage() {
  return (
    <PolicyWrapper
      title="Política de Envíos y Entregas"
      subtitle="Información detallada sobre el despacho de productos a nivel nacional en Venezuela, agencias de encomienda aliadas, tiempos de entrega y retiros directos en nuestras sedes físicas."
    >
      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-black stroke-[1.5]" />
          1. Cobertura y Agencias de Encomienda
        </h2>
        <p className="text-slate-600">
          En <strong>Q´FRANELAS</strong> realizamos despachos a todos los estados y ciudades de Venezuela. Trabajamos en alianza con las principales empresas de encomienda autorizadas en el país:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
          <li><strong>MRW:</strong> Envíos a agencias nacionales y receptores autorizados (modalidad Cobro en Destino o Prepagado).</li>
          <li><strong>Grupo Zoom:</strong> Servicio de encomienda nacional con seguimiento en línea y opción de seguro de mercancía.</li>
          <li><strong>Tealca:</strong> Despachos a agencias a nivel nacional para retiro en taquilla o entrega a domicilio según disponibilidad regional.</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-black stroke-[1.5]" />
          2. Tiempos de Procesamiento y Despacho
        </h2>
        <p className="text-slate-600">
          Una vez que el cliente registra su compra y el pago es verificado satisfactoriamente por nuestro equipo (vía Pago Móvil, Zelle o Transferencia), aplicará la siguiente dinámica de despacho:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
          <li><strong>Tiempo de preparación:</strong> Los pedidos son embalados y procesados en un lapso de <strong>24 a 48 horas hábiles</strong> (de Lunes a Viernes).</li>
          <li><strong>Tiempos de tránsito:</strong> La entrega final por parte de MRW, Zoom o Tealca suele demorar entre <strong>24 y 72 horas hábiles</strong>, dependiendo de la ciudad de destino.</li>
          <li>Los pedidos confirmados los fines de semana o días feriados nacionales serán procesados el siguiente día hábil.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-black stroke-[1.5]" />
          3. Notificación y Rastreo del Pedido
        </h2>
        <p className="text-slate-600">
          Tan pronto como la prenda sea entregada a la empresa de encomiendas, se generará una <strong>guía de despacho oficial</strong>.
        </p>
        <p className="text-slate-600">
          El cliente recibirá el número de guía e imagen del cupón vía WhatsApp o correo electrónico para realizar el seguimiento en tiempo real en las plataformas oficiales de MRW, Zoom o Tealca. También puedes consultar el estado de tu pedido en cualquier momento a través de nuestra sección <a href="/consultar-orden" className="underline font-medium text-black">Consultar mi Orden</a>.
        </p>
      </section>

      {/* Section 4 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-black stroke-[1.5]" />
          4. Retiro Gratuito en Tiendas Físicas
        </h2>
        <p className="text-slate-600">
          Si prefieres evitar el costo de flete, puedes seleccionar la modalidad de <strong>Retiro en Tienda</strong> al momento de finalizar tu compra y retirar personalmente sin costo alguno en nuestras sedes:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="border border-slate-200 p-4 bg-slate-50/50">
            <span className="font-bold text-xs uppercase tracking-wider text-black block mb-1">
              Sede Maracay (Principal)
            </span>
            <p className="text-xs text-slate-600">
              Av. Bermúdez, Edificio Las Palmas, Local 23 (Frente al C.C. El Hipódromo).
              <br />
              <span className="text-slate-400 mt-1 block">Horario: Lunes a Sábado 9:00 AM – 5:00 PM</span>
            </p>
          </div>
          <div className="border border-slate-200 p-4 bg-slate-50 opacity-60 relative select-none">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block">
                Sede Caracas
              </span>
              <span className="text-[9px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-xs uppercase tracking-wider">
                Próximamente
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mercado Las Flores, Pasillo 1, Puesto #43. Caracas.
              <br />
              <span className="text-slate-400 mt-1 block">Horario: Próximamente disponible</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-black stroke-[1.5]" />
          5. Responsabilidad del Envío y Daños
        </h2>
        <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
          <li><strong>Datos de Envío:</strong> Es responsabilidad exclusiva del cliente suministrar la dirección, número de cédula, teléfono y agencia de destino de forma precisa. <strong>Q´FRANELAS</strong> no se hace responsable por retrasos derivados de datos incorrectos.</li>
          <li><strong>Pérdida o Extravío:</strong> Una vez entregado el paquete a la empresa de transporte, la custodia legal del paquete recae sobre la agencia (MRW, Zoom o Tealca). En caso de pérdida o extravío imputable a la encomienda, prestaremos todo el soporte institucional acompañando al cliente en el reclamo ante la empresa transportista.</li>
        </ul>
      </section>
    </PolicyWrapper>
  );
}
