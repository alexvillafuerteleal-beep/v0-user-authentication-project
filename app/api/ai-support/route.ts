import { NextRequest, NextResponse } from "next/server"

type ActionType = { type: string; url?: string; label?: string }
type KnowledgeEntry = {
  keywords: string[]
  synonyms: string[]
  response: string
  action?: ActionType
}

function resolveServiceFromText(text: string): { slug: string; label: string } | null {
  const normalized = text.toLowerCase()
  if (normalized.includes("luz") || normalized.includes("electric") || normalized.includes("cfe")) {
    return { slug: "electricity", label: "Electricidad" }
  }
  if (normalized.includes("agua") || normalized.includes("conagua")) {
    return { slug: "water", label: "Agua" }
  }
  if (normalized.includes("gas") || normalized.includes("pemex")) {
    return { slug: "gas", label: "Gas" }
  }
  if (normalized.includes("internet") || normalized.includes("telmex") || normalized.includes("wifi")) {
    return { slug: "internet", label: "Internet" }
  }
  if (normalized.includes("telefono") || normalized.includes("celular") || normalized.includes("movil")) {
    return { slug: "phone", label: "Telefonia" }
  }
  return null
}

// Base de conocimiento con categorías inteligentes
const knowledgeBase: Record<string, KnowledgeEntry> = {
  NAVIGATE_HISTORIAL: {
    keywords: ["historial", "ver pagos", "mis pagos anteriores", "transacciones", "pagos realizados", "ir a historial"],
    synonyms: ["pagos pasados", "movimientos", "registro"],
    response: `📋 Ir al Historial de Pagos

Puedo llevarte directamente a tu historial donde verás todas tus transacciones con opción de descargar en PDF o CSV.

Haz clic en "Ver Historial" para ir ahora.`,
    action: { type: "navigate", url: "/dashboard/historial", label: "Ver Historial" }
  },

  NAVIGATE_SERVICIOS: {
    keywords: ["servicios", "mis servicios", "pagar servicio", "agregar servicio", "ir a servicios", "ver servicios"],
    synonyms: ["mis pagos", "facturas pendientes"],
    response: `Ir a Mis Servicios

Desde Mis Servicios puedes: pagar servicios pendientes, editar montos y fechas, o agregar nuevos servicios.

Haz clic en "Ir a Servicios" para gestionar tus pagos.`,
    action: { type: "navigate", url: "/dashboard/servicios", label: "Ir a Servicios" }
  },

  NAVIGATE_ESTADOS: {
    keywords: ["estados de cuenta", "facturas", "descargar factura", "comprobantes", "ir a estados", "ver facturas"],
    synonyms: ["recibos", "documentos", "informes"],
    response: `Ir a Estados de Cuenta

En Estados de Cuenta puedes descargar tus facturas en PDF o exportar todas en CSV.

Haz clic en "Ver Estados" para acceder a tus facturas.`,
    action: { type: "navigate", url: "/dashboard/estados", label: "Ver Estados" }
  },

  NAVIGATE_COMPARATIVO: {
    keywords: ["comparativo", "comparar gastos", "analisis", "ver comparativo", "mes anterior", "variacion"],
    synonyms: ["comparacion", "diferencia", "tendencia"],
    response: `Ir al Analisis Comparativo

El Comparativo muestra la variacion de tus gastos mes a mes, con graficas y descarga en PDF/CSV.

Haz clic en "Ver Comparativo" para analizar tus gastos.`,
    action: { type: "navigate", url: "/dashboard/comparativo", label: "Ver Comparativo" }
  },

  NAVIGATE_CONFIGURACION: {
    keywords: ["configuracion", "configurar", "notificaciones", "tema", "ajustes", "ir a configuracion"],
    synonyms: ["opciones", "preferencias", "settings"],
    response: `Ir a Configuracion

En Configuracion puedes activar/desactivar notificaciones, cambiar el tema visual y ajustar preferencias.

Haz clic en "Ir a Configuracion" para personalizar tu experiencia.`,
    action: { type: "navigate", url: "/dashboard/configuracion", label: "Ir a Configuracion" }
  },

  NAVIGATE_PERFIL: {
    keywords: ["perfil", "mi perfil", "datos personales", "cambiar contrasena", "ir a perfil"],
    synonyms: ["cuenta", "usuario", "informacion personal"],
    response: `Ir a Mi Perfil

En tu perfil puedes editar tu nombre, telefono, cambiar contrasena y descargar tus datos.

Haz clic en "Ver Perfil" para actualizar tu informacion.`,
    action: { type: "navigate", url: "/dashboard/perfil", label: "Ver Perfil" }
  },

  NAVIGATE_NOTIFICACIONES: {
    keywords: ["notificaciones", "alertas", "ver notificaciones", "mis alertas", "ir a notificaciones"],
    synonyms: ["avisos", "mensajes"],
    response: `Ir a Notificaciones

En Notificaciones puedes ver todas tus alertas, marcarlas como leidas o eliminarlas.

Haz clic en "Ver Notificaciones" para revisar tus alertas.`,
    action: { type: "navigate", url: "/dashboard/notificaciones", label: "Ver Notificaciones" }
  },

  PAYMENT_METHODS: {
    keywords: ["pago", "metodo", "pagar", "tarjeta", "debito", "credito", "como pago", "como pagar"],
    synonyms: ["dinero", "efectivo", "forma de pago"],
    response: `Metodo de Pago Aceptado:

Aceptamos Tarjeta de Credito y Debito (Visa, MasterCard)

- Pago inmediato y en tiempo real
- Seguro con encriptacion Stripe
- Recibo de pago al instante
- Sin comisiones adicionales

Quieres ir directamente a pagar?`,
    action: { type: "navigate", url: "/dashboard/servicios", label: "Ir a Pagar" }
  },

  PAYMENT_STATUS: {
    keywords: ["estado del pago", "pago confirmado", "pago pendiente", "pago reciente", "se realizo el pago"],
    synonyms: ["como va mi pago", "se recibio", "cancelado"],
    response: `Ver Estado de Pagos:

En el Historial:
- Completado: pago procesado exitosamente
- Pendiente: en proceso de confirmacion
- Fallido: no se pudo procesar

Los pagos con tarjeta son inmediatos. Quieres ver tu historial?`,
    action: { type: "navigate", url: "/dashboard/historial", label: "Ver Historial" }
  },

  RECEIPTS: {
    keywords: ["recibo", "comprobante", "pdf", "descargar", "documentos", "descargar recibo"],
    synonyms: ["factura", "constancia", "comprobante de pago"],
    response: `Descargar Recibos y Facturas:

Opciones disponibles:
- Recibo por email (automatico tras cada pago)
- Descarga PDF desde Estados de Cuenta
- Exportar CSV con todos tus pagos

Quieres ir a descargar tus facturas?`,
    action: { type: "navigate", url: "/dashboard/estados", label: "Ir a Facturas" }
  },

  AUTOMATIC_PAYMENTS: {
    keywords: ["automatico", "automaticamente", "configurar pago", "recurrente", "mensual", "pagos automaticos"],
    synonyms: ["autorizar", "suscripcion", "repetir pago"],
    response: `Pagos Automaticos:

Puedes configurar recordatorios y alertas para que nunca se te pase una fecha de pago.

Como activarlos?
1. Ve a Configuracion
2. Activa "Alertas de Vencimiento"
3. Recibiras notificaciones antes de cada vencimiento

Quieres ir a Configuracion?`,
    action: { type: "navigate", url: "/dashboard/configuracion", label: "Ir a Configuracion" }
  },

  SECURITY: {
    keywords: ["seguridad", "seguro", "datos", "encriptacion", "proteccion", "privacidad", "ssl", "protegido"],
    synonyms: ["confianza", "autenticacion", "contrasena"],
    response: `Tu Seguridad es Prioridad:

- Encriptacion SSL/TLS en todas las conexiones
- Certificacion PCI-DSS (estandar bancario)
- Datos de tarjeta nunca almacenados (tokenizacion Stripe)
- Autenticacion segura con JWT

No guardamos datos de tarjeta. Todo va directo a Stripe, procesador certificado a nivel bancario.`
  },

  NOTIFICATIONS: {
    keywords: ["notificacion", "alerta", "recordatorio", "email push", "configurar alertas"],
    synonyms: ["avisos", "notificaciones push"],
    response: `Sistema de Notificaciones:

Tipos disponibles:
- Por Email: recibe confirmaciones de pago
- Push (navegador): alertas en tiempo real
- Alertas de vencimiento: dias antes del vencimiento

Activa o desactiva cada tipo desde Configuracion.`,
    action: { type: "navigate", url: "/dashboard/configuracion", label: "Configurar Notificaciones" }
  },

  CONTACT_SUPPORT: {
    keywords: ["contacto", "soporte", "ayuda humana", "problema", "llamar", "comunicar", "telefono", "hablar con alguien"],
    synonyms: ["asistencia", "hablar", "soporte humano"],
    response: `Canales de Contacto:

- Email: soporte@pagoIA.com (respuesta en 24h)
- Telefono: +52 55 1234-5678 (Lun-Vie 9am-6pm)
- Este Chat: disponible 24/7

No encuentras lo que buscas? Escribenos al email y te ayudamos.`
  },

  ERROR_SOLUTIONS: {
    keywords: ["error", "fallido", "problema", "no funciona", "rechazado", "declinado", "no carga", "bug"],
    synonyms: ["fallo", "no puedo", "bloqueado", "no me deja"],
    response: `Soluciones a Problemas Comunes:

Pago rechazado:
- Verifica fondos suficientes en tu tarjeta
- Confirma que los datos sean correctos
- Contacta a tu banco si persiste

No ves el comprobante:
- Revisa tu email (incluso spam)
- Espera 2-5 minutos y recarga
- Revisa en "Historial" de tu dashboard

Ver tu historial de pagos?`,
    action: { type: "navigate", url: "/dashboard/historial", label: "Ver Historial" }
  }
}

// Calcular similitud entre strings (Levenshtein)
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0))

  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      )
    }
  }

  return track[str2.length][str1.length]
}

function wordSimilarity(word1: string, word2: string): number {
  const distance = levenshteinDistance(word1.toLowerCase(), word2.toLowerCase())
  const maxLen = Math.max(word1.length, word2.length)
  return 1 - distance / maxLen
}

function findBestResponse(userMessage: string): { response: string; action?: ActionType } {
  const lowerMsg = userMessage.toLowerCase()
  const words = lowerMsg.split(/\s+/).filter(w => w.length > 2)

  if (lowerMsg.includes("pagar") || lowerMsg.includes("paga") || lowerMsg.includes("quiero pagar")) {
    const targetService = resolveServiceFromText(lowerMsg)

    if (targetService) {
      return {
        response: `Perfecto. Te llevo a Mis Servicios para pagar ${targetService.label} en este momento.\n\nPulsa el boton para abrir la pantalla de pago y completar tu transaccion.`,
        action: {
          type: "navigate",
          url: `/dashboard/servicios?service=${targetService.slug}`,
          label: `Pagar ${targetService.label}`,
        },
      }
    }

    return {
      response: `Listo. Te llevo a Mis Servicios para que elijas que pago realizar ahora mismo.`,
      action: {
        type: "navigate",
        url: "/dashboard/servicios",
        label: "Abrir Mis Servicios",
      },
    }
  }

  let bestMatch: { category: string; score: number; response: string; action?: ActionType } = {
    category: "",
    score: 0,
    response: "",
    action: undefined
  }

  for (const [category, data] of Object.entries(knowledgeBase)) {
    let categoryScore = 0

    for (const keyword of data.keywords) {
      if (lowerMsg.includes(keyword)) {
        categoryScore += 3.0
      }
    }

    for (const synonym of data.synonyms) {
      if (lowerMsg.includes(synonym)) {
        categoryScore += 1.5
      }
    }

    for (const word of words) {
      for (const keyword of data.keywords) {
        const similarity = wordSimilarity(word, keyword)
        if (similarity > 0.7) {
          categoryScore += similarity
        }
      }
    }

    if (categoryScore > bestMatch.score) {
      bestMatch = { category, score: categoryScore, response: data.response, action: data.action }
    }
  }

  if (bestMatch.score < 0.5) {
    return {
      response: `No entendi muy bien tu pregunta.

Puedo ayudarte con:
- "Ver historial" — pagos anteriores y descargas
- "Ir a servicios" — pagar o gestionar servicios
- "Ver facturas" — descargar recibos y estados de cuenta
- "Ver comparativo" — analisis de gastos
- "Configuracion" — notificaciones y preferencias
- "Mi perfil" — datos personales
- "Notificaciones" — ver mis alertas
- "Como pagar" — metodos de pago
- "Seguridad" — como protegemos tus datos

Que necesitas?`
    }
  }

  return { response: bestMatch.response, action: bestMatch.action }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body.message || body.text || ""

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "El mensaje es requerido" },
        { status: 400 }
      )
    }

    const result = findBestResponse(message)

    return NextResponse.json({
      response: result.response,
      action: result.action || null,
      role: "support",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("AI Support error:", error)
    return NextResponse.json(
      { error: "Error procesando tu pregunta. Intenta nuevamente." },
      { status: 500 }
    )
  }
}
