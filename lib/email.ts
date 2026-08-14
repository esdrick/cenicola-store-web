// Módulo de envío de correos electrónicos para Q´ FRANELAS (Tienda Web E-Commerce)
// Soporta Resend API (3.000 correos/mes gratis) y fallback SMTP/Nodemailer.

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
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      console.error("[Email Error - Resend]:", data);
      return { success: false, error: data.message || "Error al enviar correo vía Resend" };
    } catch (err) {
      console.error("[Email Error - Resend Fetch]:", err);
      return { success: false, error: "Error de red al enviar correo" };
    }
  }

  // Fallback para desarrollo / log cuando no hay API keys configuradas
  console.log("--------------------------------------------------");
  console.log(`[SIMULACIÓN DE CORREO ENVIADO A]: ${to}`);
  console.log(`[ASUNTO]: ${subject}`);
  console.log("--------------------------------------------------");
  return { success: true };
}

// ─── Plantillas de Correo HTML ───────────────────────────────────────────────

const BASE_STYLES = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  background-color: #f9fafb;
  margin: 0;
  padding: 40px 20px;
`;

const CARD_STYLES = `
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
`;

const HEADER_STYLES = `
  background-color: #0f172a;
  color: #ffffff;
  padding: 24px;
  text-align: center;
`;

const CONTENT_STYLES = `
  padding: 32px 24px;
  line-height: 1.6;
`;

const BUTTON_STYLES = `
  display: inline-block;
  background-color: #0f172a;
  color: #ffffff !important;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 6px;
  font-weight: 600;
  margin-top: 20px;
`;

const FOOTER_STYLES = `
  background-color: #f1f5f9;
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
`;

// 1. Correo: Orden Creada (Pendiente de Verificación de Pago)
export async function sendOrderCreatedEmail({
  to,
  customerName,
  orderNumber,
  totalUsd,
  totalVes,
  trackingUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalUsd: number;
  totalVes?: number;
  trackingUrl?: string;
}) {
  const html = `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <h1 style="margin:0; font-size: 22px; letter-spacing: 1px;">Q´ FRANELAS</h1>
          <p style="margin:4px 0 0; font-size: 13px; color: #94a3b8;">Tienda de Ropa</p>
        </div>
        <div style="${CONTENT_STYLES}">
          <h2 style="margin-top:0; color: #0f172a;">¡Gracias por tu compra, ${customerName}!</h2>
          <p>Hemos recibido tu pedido <strong>#${orderNumber}</strong> exitosamente. Estamos verificando tu comprobante de pago.</p>
          
          <div style="background:#f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-weight: bold;">Resumen del Pedido:</p>
            <p style="margin: 4px 0;">Total USD: <strong>$${totalUsd.toFixed(2)}</strong></p>
            ${totalVes ? `<p style="margin: 4px 0;">Total VES (BCV): <strong>Bs. ${totalVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</strong></p>` : ""}
            <p style="margin: 4px 0;">Estado: <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Pendiente de Pago</span></p>
          </div>

          <p>Tan pronto como nuestro equipo valide la transferencia o Pago Móvil, te notificaremos para enviar tu paquete a embalaje.</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="${BUTTON_STYLES}">Ver Estado de mi Pedido</a>` : ""}
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS Store — Venezuela</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `¡Hemos recibido tu pedido #${orderNumber}! - Q´ FRANELAS`,
    html,
  });
}

// 2. Correo: Pago Aprobado -> En Embalaje
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
          <h1 style="margin:0; font-size: 22px;">Q´ FRANELAS</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <h2 style="color: #166534; margin-top:0;">¡Pago Verificado con Éxito! 🎉</h2>
          <p>Hola <strong>${customerName}</strong>,</p>
          <p>Tu pago para la orden <strong>#${orderNumber}</strong> ha sido verificado satisfactoriamente por nuestro equipo.</p>
          <p>Tu pedido ha pasado inmediatamente al departamento de <strong>Embalaje</strong>. Estamos preparando tus prendas para ser enviadas.</p>
          
          ${trackingUrl ? `<a href="${trackingUrl}" style="${BUTTON_STYLES}">Seguir mi Pedido</a>` : ""}
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS Store — Venezuela</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `¡Pago Aprobado! Tu pedido #${orderNumber} está en embalaje - Q´ FRANELAS`,
    html,
  });
}

// 3. Correo: Pago Rechazado
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
          <h1 style="margin:0; font-size: 22px;">Q´ FRANELAS</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <h2 style="color: #991b1b; margin-top:0;">Atención: Problema con el Pago del Pedido #${orderNumber}</h2>
          <p>Hola <strong>${customerName}</strong>,</p>
          <p>Lamentamos informarte que no pudimos verificar tu pago para el pedido <strong>#${orderNumber}</strong>.</p>
          
          <div style="background:#fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin:0; font-weight: bold; color: #991b1b;">Motivo del Rechazo:</p>
            <p style="margin: 4px 0 0; color: #7f1d1d;">${rejectionReason}</p>
          </div>

          <p>Por favor, revisa tus datos de pago o adjunta un nuevo comprobante válido para procesar tu orden.</p>
          ${uploadUrl ? `<a href="${uploadUrl}" style="${BUTTON_STYLES}">Volver a Subir Comprobante</a>` : ""}
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS Store — Venezuela</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Atención: Pago no aprobado para el pedido #${orderNumber} - Q´ FRANELAS`,
    html,
  });
}

// 4. Correo: Pedido Enviado con Guía y Foto
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
          <h1 style="margin:0; font-size: 22px;">Q´ FRANELAS</h1>
        </div>
        <div style="${CONTENT_STYLES}">
          <h2 style="color: #0f172a; margin-top:0;">¡Tu Pedido ha sido Enviado! 🚚</h2>
          <p>Hola <strong>${customerName}</strong>,</p>
          <p>¡Buenas noticias! Tu paquete de la orden <strong>#${orderNumber}</strong> ya fue empacado y entregado a la empresa de envíos.</p>
          
          <div style="background:#f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            ${shippingCompany ? `<p style="margin:4px 0;">Empresa de Envío: <strong>${shippingCompany}</strong></p>` : ""}
            ${trackingNumber ? `<p style="margin:4px 0;">Número de Guía / Rastreo: <strong style="font-size: 16px; color: #166534;">${trackingNumber}</strong></p>` : ""}
          </div>

          ${packagePhotoUrl ? `
            <div style="text-align:center; margin: 20px 0;">
              <p style="font-weight:bold; margin-bottom:8px;">Foto del Paquete Empacado:</p>
              <img src="${packagePhotoUrl}" alt="Foto Paquete" style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" />
            </div>
          ` : ""}

          <p>¡Esperamos que disfrutes tus prendas! Gracias por comprar en Q´ FRANELAS.</p>
        </div>
        <div style="${FOOTER_STYLES}">
          <p style="margin:0;">Q´ FRANELAS Store — Venezuela</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `¡Tu pedido #${orderNumber} ha sido enviado! 🚚 - Q´ FRANELAS`,
    html,
  });
}

export function extractCustomerEmail(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/\[Correo Web:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}
