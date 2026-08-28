import PolicyWrapper from "@/components/store/PolicyWrapper";
import { ShieldCheck, Lock, Server, FileCheck2 } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad y Protección de Datos | Q´FRANELAS",
  description: "Tratamiento confidencial de datos personales, resguardo de comprobantes de pago y privacidad de nuestros clientes en Venezuela.",
};

export default function PrivacidadPage() {
  return (
    <PolicyWrapper
      title="Política de Privacidad y Datos"
      subtitle="Nos tomamos muy en serio la seguridad y la confidencialidad de tu información personal. Conoce cómo recopilamos, utilizamos y protegemos los datos de nuestros clientes en Venezuela."
    >
      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-black stroke-[1.5]" />
          1. Recopilación de Información Personal
        </h2>
        <p className="text-slate-600">
          Para brindarte la mejor experiencia de compra, coordinar la facturación y procesar los despachos de encomienda a nivel nacional, solicitamos la siguiente información personal básica:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
          <li><strong>Datos de Identificación:</strong> Nombre, Apellido y Cédula de Identidad o RIF.</li>
          <li><strong>Datos de Contacto:</strong> Número de teléfono celular / WhatsApp y dirección de correo electrónico.</li>
          <li><strong>Datos de Despacho:</strong> Dirección física de entrega o agencia de encomienda receptora (MRW, Zoom, Tealca) seleccionada.</li>
          <li><strong>Comprobantes de Pago:</strong> Capturas de pantalla o números de referencia de las transacciones (Pago Móvil, Zelle o Transferencia).</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-black stroke-[1.5]" />
          2. Finalidad del Uso de los Datos
        </h2>
        <p className="text-slate-600">
          La información recopilada se utiliza de manera exclusiva para los siguientes fines legítimos:
        </p>
        <div className="bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs text-slate-700">
          <p>✓ Procesar y validar tus órdenes de compra en el sistema.</p>
          <p>✓ Generar las guías oficiales de envío con las empresas de encomiendas.</p>
          <p>✓ Notificar el estado de tu pedido y enviar el código de rastreo vía WhatsApp o correo.</p>
          <p>✓ Brindar soporte técnico y atención post-venta personalizada.</p>
        </div>
      </section>

      {/* Section 3 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-black stroke-[1.5]" />
          3. Compromiso de Confidencialidad y No Divulgación
        </h2>
        <p className="text-slate-600">
          En <strong>Q´FRANELAS</strong> garantizamos de forma absoluta que <strong>no vendemos, alquilamos ni comercializamos tus datos personales o comprobantes de pago a ningún tercero</strong> bajo ninguna circunstancia.
        </p>
        <p className="text-slate-600 text-xs">
          Únicamente compartimos los datos indispensables de entrega (Nombre, Cédula, Teléfono y Dirección de Agencia) con las empresas de transporte (MRW, Zoom, Tealca) exclusivamente para ejecutar la entrega de la mercancía.
        </p>
      </section>

      {/* Section 4 */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-black stroke-[1.5]" />
          4. Almacenamiento Seguro y Cookies
        </h2>
        <p className="text-slate-600">
          Nuestra plataforma utiliza tecnología de almacenamiento local únicamente para recordar los artículos añadidos a tu Carrito de Compras o Lista de Deseos y optimizar tu navegación. No guardamos información financiera sensible como datos de tarjetas en nuestros servidores web.
        </p>
      </section>
    </PolicyWrapper>
  );
}
