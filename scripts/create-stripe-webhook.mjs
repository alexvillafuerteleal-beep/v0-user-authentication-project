import fs from "node:fs"
import path from "node:path"
import Stripe from "stripe"

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "payment_intent.requires_action",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.dispute.created",
]

function loadEnv() {
  const env = { ...process.env }
  const envPath = path.join(process.cwd(), ".env.local")

  if (!fs.existsSync(envPath)) {
    return env
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue
    }

    const separatorIndex = line.indexOf("=")
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (key && !(key in env)) {
      env[key] = value
    }
  }

  return env
}

function updateEnvVar(key, value) {
  const envPath = path.join(process.cwd(), ".env.local")
  const line = `${key}=${value}`

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `${line}\n`, "utf8")
    return
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
  const nextLines = []
  let updated = false

  for (const currentLine of lines) {
    if (currentLine.startsWith(`${key}=`)) {
      nextLines.push(line)
      updated = true
      continue
    }

    nextLines.push(currentLine)
  }

  if (!updated) {
    nextLines.push(line)
  }

  fs.writeFileSync(envPath, `${nextLines.join("\n").replace(/\n+$/u, "")}\n`, "utf8")
}

function parseArgs(argv) {
  const options = {
    url: "",
    saveSecret: false,
    help: false,
  }

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true
      continue
    }

    if (arg === "--save-secret") {
      options.saveSecret = true
      continue
    }

    if (!options.url) {
      options.url = arg
    }
  }

  return options
}

function printUsage() {
  console.log("Uso:")
  console.log("  npm run stripe:webhook:create -- <url-publica-o-dominio> [--save-secret]")
  console.log("")
  console.log("Ejemplos:")
  console.log("  npm run stripe:webhook:create -- https://miapp.vercel.app")
  console.log("  npm run stripe:webhook:create -- https://miapp.vercel.app/api/stripe/webhook --save-secret")
}

function normalizeWebhookUrl(input) {
  if (!input) {
    throw new Error("Debes indicar una URL publica para registrar el webhook")
  }

  const normalizedInput = /^https?:\/\//iu.test(input) ? input : `https://${input}`
  const url = new URL(normalizedInput)

  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/api/stripe/webhook"
  }

  return url.toString().replace(/\/$/u, "")
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.help || !options.url) {
    printUsage()
    process.exit(options.help ? 0 : 1)
  }

  const env = loadEnv()
  const stripeSecretKey = env.STRIPE_SECRET_KEY

  if (!stripeSecretKey || stripeSecretKey.startsWith("YOUR_")) {
    throw new Error("STRIPE_SECRET_KEY no esta configurada en .env.local")
  }

  const webhookUrl = normalizeWebhookUrl(options.url)
  const stripe = new Stripe(stripeSecretKey)
  const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 100 })
  const existingEndpoint = existingEndpoints.data.find(
    (endpoint) => endpoint.url === webhookUrl
  )

  if (existingEndpoint) {
    throw new Error(
      `Ya existe un webhook en Stripe para ${webhookUrl} con id ${existingEndpoint.id}. ` +
        "Eliminalo en Stripe Dashboard o usa otra URL antes de crear uno nuevo."
    )
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: WEBHOOK_EVENTS,
    description: "ProyectoResidencia webhook",
  })

  console.log(`Webhook creado: ${endpoint.id}`)
  console.log(`URL: ${endpoint.url}`)
  console.log(`Eventos: ${WEBHOOK_EVENTS.join(", ")}`)

  if (endpoint.secret) {
    console.log(`Signing secret: ${endpoint.secret}`)

    if (options.saveSecret) {
      updateEnvVar("STRIPE_WEBHOOK_SECRET", endpoint.secret)
      console.log("STRIPE_WEBHOOK_SECRET guardado en .env.local")
    }
  } else {
    console.log("Stripe no devolvio el signing secret en la respuesta.")
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})