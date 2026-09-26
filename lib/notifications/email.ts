/**
 * Correo transaccional con la API de Resend. Sin RESEND_API_KEY o EMAIL_FROM no envía
 * nada y devuelve false, así los recordatorios siguen saliendo por push.
 */
export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) return false

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  })
  if (!res.ok) {
    console.error("[email] Resend respondió", res.status, await res.text().catch(() => ""))
    return false
  }
  return true
}
