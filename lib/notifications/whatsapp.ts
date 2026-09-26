/**
 * Recordatorios por WhatsApp con la Cloud API de Meta.
 *
 * WhatsApp solo permite que una empresa inicie la conversación con una plantilla aprobada.
 * La plantilla (WHATSAPP_TEMPLATE, por defecto "recordatorio_pago") debe tener tres variables
 * en el cuerpo, por ejemplo:
 *   "Hola, tu recibo de {{1}} vence {{2}}. Monto aproximado: {{3}}. Págalo desde PagoIA."
 * Sin WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID no envía nada y devuelve false.
 */

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0"

export function whatsappEnabled() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

/**
 * Convierte un teléfono mexicano a formato internacional sin "+": 52 + 10 dígitos.
 * Acepta espacios, guiones, paréntesis, "+52", "52" y el prefijo móvil antiguo "521".
 * Devuelve null si no es un número mexicano de 10 dígitos.
 */
export function normalizeMxPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3)
  else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2)
  if (digits.length !== 10 || digits.startsWith("0")) return null
  return `52${digits}`
}

/** Muestra solo los últimos 4 dígitos, para la interfaz. */
export function maskPhone(e164: string) {
  return `+52 •••• ${e164.slice(-4)}`
}

export async function sendWhatsAppTemplate({ to, params }: { to: string; params: string[] }) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return false

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE || "recordatorio_pago",
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "es_MX" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    }),
  })
  if (!res.ok) {
    console.error("[whatsapp] Meta respondió", res.status, await res.text().catch(() => ""))
    return false
  }
  return true
}
