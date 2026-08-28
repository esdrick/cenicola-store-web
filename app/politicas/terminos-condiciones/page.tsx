import PolicyWrapper from "@/components/store/PolicyWrapper";
import { FileText, Landmark, ShieldCheck, Scale, CreditCard, ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones de Compra | Q´FRANELAS",
  description: "Términos legales de venta, precios regulados a la Tasa Oficial BCV, modalidades de pago y condiciones generales del servicio en Venezuela.",
};

export default function TerminosCondicionesPage() {
  return (
    <PolicyWrapper
      title="Términos y Condiciones de Compra"
      subtitle="Condiciones generales de uso, contratación y venta electrónica aplicables a todos los clientes y compras realizadas en la plataforma de Q´FRANELAS."
    >
      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-black stroke-[1.5]" />
          1. Identificación Comercial
        </h2>
        <p className="text-slate-600">
          El sitio web y la marca comercial <strong>Q´FRANELAS</strong> (RIF: J-50444768-4) pertenecen a una firma comercial formalmente registrada en Venezuela, dedicada a la venta al detal y mayor de vestuario y textiles, con sedes físicas operativas en la ciudad de <strong>Maracay (Estado Aragua)</strong> y <strong>Caracas (Distrito Capital)</strong>.
        </p>
      </section>

      {/* Section 2 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <Landmark className="w-4 h-4 text-black stroke-[1.5]" />
          2. Precios y Cumplimiento de Tasa Oficial BCV
        </h2>
        <p className="text-slate-600">
          De estricto acuerdo con las regulaciones comerciales vigentes en Venezuela y los dictámenes fijados por la Superintendencia Nacional para la Defensa de los Derechos Socioeconómicos (SUNDDE) y el Banco Central de Venezuela (BCV):
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
          <li>Los precios referenciales de los productos pueden mostrarse en Divisas (USD $), pero <strong>todas las transacciones en Bolívares (VES) se computan exacta y formalmente a la Tasa Oficial de Cambio emitida por el Banco Central de Venezuela (BCV)</strong> correspondiente a la fecha de pago.</li>
          <li>El monto final a pagar en VES se calculará de manera transparente y automática al momento de generar la orden de compra.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-black stroke-[1.5]" />
          3. Métodos de Pago y Verificación de Comprobantes
        </h2>
        <p className="text-slate-600">
          Para concretar un pedido, <strong>Q´FRANELAS</strong> pone a disposición de los usuarios los siguientes canales de pago autorizados:
        </p>
        <div className="bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs text-slate-700">
          <p>• <strong>Pago Móvil:</strong> Transferencias interbancarias inmediatas en Bolívares.</p>
          <p>• <strong>Transferencia Bancaria Nacional:</strong> Cuentas bancarias en Bolívares (VES).</p>
          <p>• <strong>Zelle / Divisas Electrónicas:</strong> Transferencias en USD previa verificación.</p>
          <p>• <strong>Efectivo en Tienda:</strong> Pagos directos en divisas o Bolívares al retirar en nuestras sedes de Caracas o Maracay.</p>
        </div>
        <p className="text-slate-600 text-xs mt-2">
          <em>Nota: Los pedidos se consideran confirmados únicamente cuando el pago ha sido efectivamente acreditado en nuestras cuentas. La empresa se reserva el derecho de anular pedidos cuyo pago no sea reportado dentro de las 24 horas siguientes a la orden.</em>
        </p>
      </section>

      {/* Section 4 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-black stroke-[1.5]" />
          4. Disponibilidad de Inventario y Reservas
        </h2>
        <p className="text-slate-600">
          Aunque nuestro inventario se sincroniza en tiempo real entre las tiendas físicas y la plataforma web, en caso de una discrepancia extraordinaria de stock que impida despachar un producto ya pagado, <strong>Q´FRANELAS</strong> se comunicará de inmediato con el cliente para ofrecer el reemplazo por otra prenda o el reintegro total del monto pagado.
        </p>
      </section>

      {/* Section 5 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-4 h-4 text-black stroke-[1.5]" />
          5. Propiedad Intelectual e Imagen
        </h2>
        <p className="text-slate-600">
          Todo el contenido disponible en la web, incluyendo logotipos, textos, marcas registradas, fotografías de catálogos y diseños tipográficos son propiedad de <strong>Q´FRANELAS</strong>. Queda totalmente prohibida su reproducción parcial o total sin previa autorización por escrito.
        </p>
      </section>

      {/* Section 6 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-black stroke-[1.5]" />
          6. Jurisdicción y Ley Aplicable
        </h2>
        <p className="text-slate-600">
          Las presentes condiciones se rigen e interpretan bajo las leyes de la República Bolivariana de Venezuela. Cualquier diferencia o controversia será sometida a la jurisdicción de los tribunales competentes de la jurisdicción nacional.
        </p>
      </section>
    </PolicyWrapper>
  );
}
