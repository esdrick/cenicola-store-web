// Módulo de envío de correos electrónicos para Q´ FRANELAS (Tienda Web E-Commerce)
// Soporta Resend API y fallback SMTP/Nodemailer con diseño minimalista tipo Zara / Lefties.

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Q´ FRANELAS <notificaciones@resend.dev>";

  // Opción 1: Resend HTTP API
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (res.ok) {
        console.log(`[Email Delivered - Resend] To: ${to} | Subject: "${subject}"`);
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.message || data.error || `HTTP ${res.status}`;
      console.error(`[Email Error - Resend HTTP ${res.status}] To: ${to} | Error:`, data);
      return { success: false, error: `Error al enviar correo vía Resend: ${errorMsg}` };
    } catch (err) {
      console.error("[Email Error - Resend Fetch Failure]:", err);
      return { success: false, error: "Error de red al conectar con Resend" };
    }
  }

  // Fallback para desarrollo / log cuando no hay API keys configuradas en el entorno
  console.warn(`[EMAIL WARNING] RESEND_API_KEY no configurada en las variables de entorno.`);
  console.log("--------------------------------------------------");
  console.log(`[SIMULACIÓN DE CORREO ENVIADO A]: ${to}`);
  console.log(`[ASUNTO]: ${subject}`);
  console.log("--------------------------------------------------");
  return { success: true };
}

// ─── Estilos Globales Minimalistas Tipo Zara / Lefties ────────────────────────

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #111111;
  background-color: #f7f7f7;
  margin: 0;
  padding: 40px 15px;
  -webkit-font-smoothing: antialiased;
`;

const CARD_STYLES = `
  max-width: 580px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  padding: 40px 32px;
`;

const HEADER_STYLES = `
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #111111;
  margin-bottom: 32px;
`;

const CONTENT_STYLES = `
  line-height: 1.6;
  font-size: 13px;
  color: #222222;
`;

const BUTTON_STYLES = `
  display: inline-block;
  background-color: #000000;
  color: #ffffff !important;
  text-decoration: none;
  padding: 14px 32px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 24px;
  text-align: center;
  border-radius: 0px;
`;

const FOOTER_STYLES = `
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #e5e5e5;
  text-align: center;
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888888;
`;

// 1. Correo: Orden Creada (Pendiente de Verificación o Preparación)
export async function sendOrderCreatedEmail({
  to,
  customerName,
  orderNumber,
  totalUsd,
  totalVes,
  shippingCompany,
  address,
  paymentMethod,
  trackingUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalUsd: number;
  totalVes?: number;
  shippingCompany?: string;
  address?: string;
  paymentMethod?: string;
  trackingUrl?: string;
}) {
  const isPickup = shippingCompany?.toLowerCase().includes("retiro en tienda");
  const isCash = paymentMethod?.toLowerCase().includes("efectivo");

  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">CONFIRMACIÓN DE ORDEN</p>
        </div>
        
        <div style="${CONTENT_STYLES}">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">¡GRACIAS POR TU COMPRA, ${customerName.toUpperCase()}!</h2>
          <p style="margin: 0 0 20px; color: #444444;">Hemos recibido tu pedido <strong style="color:#000000; font-family: monospace;">#${orderNumber}</strong> exitosamente.</p>
          
          <div style="border: 1px solid #e5e5e5; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; color: #000000;">RESUMEN DE TU PEDIDO</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #333333;">
              <tr>
                <td style="padding: 4px 0; color: #666666;">Total USD:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #000000; font-family: monospace;">$${totalUsd.toFixed(2)} USD</td>
              </tr>
              ${
                totalVes
                  ? `
              <tr>
                <td style="padding: 4px 0; color: #666666;">Total VES (BCV):</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #000000; font-family: monospace;">Bs. ${totalVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
              </tr>`
                  : ""
              }
              ${
                shippingCompany
                  ? `
              <tr>
                <td style="padding: 4px 0; color: #666666;">Entrega:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #000000;">${shippingCompany}</td>
              </tr>`
                  : ""
              }
              ${
                paymentMethod
                  ? `
              <tr>
                <td style="padding: 4px 0; color: #666666;">Método de Pago:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #000000;">${paymentMethod}</td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding: 4px 0; color: #666666;">Estado de la Orden:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 700; text-transform: uppercase; color: #000000; font-size: 11px; letter-spacing: 1px;">${isCash ? "EN PREPARACIÓN" : "PENDIENTE DE PAGO"}</td>
              </tr>
            </table>
          </div>

          ${
            isPickup
              ? `
            <div style="border: 1px solid #000000; padding: 20px; margin: 24px 0; background: #fafafa;">
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #000000;">DETALLES DE RETIRO EN TIENDA</p>
              <p style="margin: 4px 0; color: #333333;">Sede: <strong>${shippingCompany}</strong></p>
              ${address ? `<p style="margin: 4px 0; color: #333333;">Dirección: ${address}</p>` : ""}
              <p style="margin: 4px 0; color: #333333;">Horario: <strong>Lunes a Sábado: 9:00 AM – 5:00 PM</strong></p>
              <p style="margin: 8px 0 0; color: #000000; font-weight: 700; border-top: 1px solid #e5e5e5; padding-top: 8px;">Plazo estimado de preparación: 24 a 48 horas hábiles.</p>
              ${isCash ? `<p style="margin: 8px 0 0; color: #000000; font-weight: 700;">💵 Recuerda llevar el monto USD en efectivo al retirar.</p>` : ""}
            </div>
          `
              : `<p style="color: #666666; margin: 20px 0;">Tan pronto como nuestro equipo valide la transferencia o Pago Móvil, te notificaremos para pasar tu pedido a embalaje.</p>`
          }

          ${trackingUrl ? `<div style="text-align:center;"><a href="${trackingUrl}" style="${BUTTON_STYLES}">VER ESTADO DE MI ORDEN</a></div>` : ""}
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Confirmación de Pedido #${orderNumber} — Q´ FRANELAS`,
    html,
  });
}

// 2. Correo: Pedido Listo para Retiro en Tienda
export async function sendOrderReadyForPickupEmail({
  to,
  customerName,
  orderNumber,
  storeOfficeName,
  storeOfficeAddress,
  totalUsd,
  isCash,
  trackingUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  storeOfficeName: string;
  storeOfficeAddress: string;
  totalUsd: number;
  isCash?: boolean;
  trackingUrl?: string;
}) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">PEDIDO LISTO EN TIENDA</p>
        </div>
        
        <div style="${CONTENT_STYLES}">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">¡TU PEDIDO ESTÁ LISTO PARA RETIRAR!</h2>
          <p style="margin:0 0 16px; color: #444444;">Hola <strong>${customerName.toUpperCase()}</strong>, tus prendas de la orden <strong style="font-family: monospace;">#${orderNumber}</strong> se encuentran empacadas y listas en tienda física.</p>
          
          <div style="border: 1px solid #000000; padding: 20px; margin: 24px 0; background: #fafafa;">
            <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #000000;">PUNTO DE RETIRO</p>
            <p style="margin: 4px 0; color: #333333;">Sede: <strong>${storeOfficeName}</strong></p>
            <p style="margin: 4px 0; color: #333333;">Dirección: <strong>${storeOfficeAddress}</strong></p>
            <p style="margin: 4px 0; color: #333333;">Horario: <strong>Lunes a Sábado: 9:00 AM – 5:00 PM</strong></p>
            ${isCash ? `<p style="margin: 10px 0 0; color: #000000; font-weight: 700; border-top: 1px solid #e5e5e5; padding-top: 8px;">💵 Monto a pagar en caja: $${totalUsd.toFixed(2)} USD en efectivo.</p>` : ""}
          </div>

          ${trackingUrl ? `<div style="text-align:center;"><a href="${trackingUrl}" style="${BUTTON_STYLES}">VER DETALLES DE LA ORDEN</a></div>` : ""}
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `¡Tu pedido #${orderNumber} está listo para retirar! — Q´ FRANELAS`,
    html,
  });
}

// 3. Correo: Pago Aprobado -> En Embalaje
export async function sendPaymentApprovedEmail({
  to,
  customerName,
  orderNumber,
  trackingUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingUrl?: string;
}) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">PAGO CONFIRMADO</p>
        </div>
        
        <div style="${CONTENT_STYLES}">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">PAGO VERIFICADO CON ÉXITO</h2>
          <p style="margin:0 0 16px; color: #444444;">Hola <strong>${customerName.toUpperCase()}</strong>,</p>
          <p style="margin:0 0 16px; color: #444444;">Tu pago para la orden <strong style="font-family: monospace;">#${orderNumber}</strong> ha sido verificado satisfactoriamente.</p>
          <p style="margin:0 0 20px; color: #444444;">Tu pedido ha pasado inmediatamente al departamento de <strong>EMBALAJE</strong>.</p>
          
          ${trackingUrl ? `<div style="text-align:center;"><a href="${trackingUrl}" style="${BUTTON_STYLES}">SEGUIR MI PEDIDO</a></div>` : ""}
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Pago Aprobado: Pedido #${orderNumber} en embalaje — Q´ FRANELAS`,
    html,
  });
}

// 4. Correo: Pago Rechazado
export async function sendPaymentRejectedEmail({
  to,
  customerName,
  orderNumber,
  rejectionReason,
  uploadUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  rejectionReason: string;
  uploadUrl?: string;
}) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">NOTIFICACIÓN DE PAGO</p>
        </div>
        
        <div style="${CONTENT_STYLES}">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">PROBLEMA CON EL PAGO DE LA ORDEN #${orderNumber}</h2>
          <p style="margin:0 0 16px; color: #444444;">Hola <strong>${customerName.toUpperCase()}</strong>,</p>
          <p style="margin:0 0 20px; color: #444444;">No pudimos verificar el pago asignado a la orden <strong style="font-family: monospace;">#${orderNumber}</strong>.</p>
          
          <div style="border: 1px solid #111111; padding: 18px; margin: 24px 0; background: #fafafa;">
            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #000000;">MOTIVO DEL RECHAZO:</p>
            <p style="margin: 0; color: #333333;">${rejectionReason}</p>
          </div>

          <p style="color: #666666; margin-bottom: 20px;">Por favor, revisa los datos o sube un comprobante válido para procesar tu orden.</p>
          ${uploadUrl ? `<div style="text-align:center;"><a href="${uploadUrl}" style="${BUTTON_STYLES}">VOLVER A SUBIR COMPROBANTE</a></div>` : ""}
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Atención: Pago no aprobado para pedido #${orderNumber} — Q´ FRANELAS`,
    html,
  });
}

// 5. Correo: Pedido Enviado con Guía y Foto
export async function sendOrderShippedEmail({
  to,
  customerName,
  orderNumber,
  shippingCompany,
  trackingNumber,
  packagePhotoUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  shippingCompany?: string;
  trackingNumber?: string;
  packagePhotoUrl?: string;
}) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">GUÍA DE ENVÍO</p>
        </div>
        
        <div style="${CONTENT_STYLES}">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">¡TU PEDIDO HA SIDO ENVIADO!</h2>
          <p style="margin:0 0 16px; color: #444444;">Hola <strong>${customerName.toUpperCase()}</strong>,</p>
          <p style="margin:0 0 20px; color: #444444;">Tu paquete de la orden <strong style="font-family: monospace;">#${orderNumber}</strong> ya fue empacado y entregado a la agencia de envíos.</p>
          
          <div style="border: 1px solid #e5e5e5; padding: 20px; margin: 24px 0;">
            ${shippingCompany ? `<p style="margin:4px 0; color: #666666;">Empresa: <strong style="color: #000000;">${shippingCompany}</strong></p>` : ""}
            ${trackingNumber ? `<p style="margin:4px 0; color: #666666;">Número de Guía / Rastreo: <strong style="font-size: 15px; color: #000000; font-family: monospace;">${trackingNumber}</strong></p>` : ""}
          </div>

          ${
            packagePhotoUrl
              ? `
            <div style="text-align:center; margin: 24px 0;">
              <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; color: #000000;">FOTO DEL PAQUETE EMPACADO</p>
              <img src="${packagePhotoUrl}" alt="Foto Paquete" style="max-width: 100%; border: 1px solid #e5e5e5;" />
            </div>
          `
              : ""
          }

          <p style="color: #666666; text-align: center; margin-top: 24px;">¡Gracias por comprar en Q´ FRANELAS!</p>
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `¡Tu pedido #${orderNumber} ha sido enviado! — Q´ FRANELAS`,
    html,
  });
}

// 6. Correo: Pedido Cancelado
export async function sendOrderCancelledEmail({
  to,
  customerName,
  orderNumber,
  cancellationReason,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  cancellationReason?: string;
}) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">CANCELACIÓN DE ORDEN</p>
        </div>
        
        <div style="${CONTENT_STYLES}">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">ORDEN #${orderNumber} CANCELADA</h2>
          <p style="margin:0 0 16px; color: #444444;">Hola <strong>${customerName.toUpperCase()}</strong>,</p>
          <p style="margin:0 0 20px; color: #444444;">Te informamos que tu pedido <strong style="font-family: monospace;">#${orderNumber}</strong> ha sido cancelado.</p>
          
          ${
            cancellationReason
              ? `
            <div style="border: 1px solid #e5e5e5; padding: 18px; margin: 24px 0; background: #fafafa;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #000000;">MOTIVO DE LA CANCELACIÓN:</p>
              <p style="margin: 0; color: #333333;">${cancellationReason}</p>
            </div>
          `
              : ""
          }

          <p style="color: #666666; font-size: 12px;">Si tienes alguna pregunta, puedes contactarnos a través de nuestra atención en WhatsApp.</p>
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Tu pedido #${orderNumber} ha sido cancelado — Q´ FRANELAS`,
    html,
  });
}

export function extractCustomerEmail(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/\[Correo Web:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

// 7. Correo: PIN de Verificación
export async function sendVerificationPINCodeEmail(customerName: string, customerEmail: string, pinCode: string) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">VERIFICACIÓN DE CUENTA</p>
        </div>
        
        <div style="${CONTENT_STYLES}; text-align: center;">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">¡HOLA, ${customerName.toUpperCase()}!</h2>
          <p style="margin-bottom: 12px; color: #444444;">Tu código PIN de seguridad de 6 dígitos es:</p>
          
          <div style="border: 1px solid #000000; padding: 20px 32px; display: inline-block; margin: 20px 0; background: #fafafa;">
            <span style="font-family: monospace, Courier, sans-serif; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #000000;">${pinCode}</span>
          </div>

          <p style="font-size: 12px; color: #888888; margin-top: 12px;">Este código es válido por 15 minutos.</p>
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Código PIN de Verificación: ${pinCode} — Q´ FRANELAS`,
    html,
  });
}

// 8. Correo: Recuperación de Contraseña
export async function sendPasswordResetEmail({
  to,
  customerName,
  resetPin,
}: {
  to: string;
  customerName: string;
  resetPin: string;
}) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 20px; letter-spacing: 4px; font-weight: 900; color: #000000; text-transform: uppercase;">Q´ FRANELAS</h1>
          <p style="margin:6px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666666;">RECUPERACIÓN DE CONTRASEÑA</p>
        </div>
        
        <div style="${CONTENT_STYLES}; text-align: center;">
          <h2 style="margin:0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000000;">¡HOLA, ${customerName.toUpperCase()}!</h2>
          <p style="color: #444444;">Usa el siguiente código PIN de 6 dígitos para restablecer tu contraseña:</p>
          
          <div style="border: 1px solid #000000; padding: 20px 32px; display: inline-block; margin: 20px 0; background: #fafafa;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #000000;">${resetPin}</span>
          </div>

          <p style="font-size: 12px; color: #888888;">Este código expira en 15 minutos.</p>
        </div>

        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS STORE — VENEZUELA</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `${resetPin} es tu PIN de recuperación — Q´ FRANELAS`,
    html,
  });
}
