// Borra servicios duplicados (mismo tipo y proveedor) de UNA cuenta, conservando el más antiguo.
//
//   node scripts/limpiar-duplicados-prueba.mjs test@pago-ia.local            # solo lista
//   node scripts/limpiar-duplicados-prueba.mjs test@pago-ia.local --apply    # respalda y borra
//
// Usa SUPABASE_SERVICE_ROLE_KEY de .env.local. Antes de borrar guarda un respaldo JSON en
// scripts/respaldos/. Los recordatorios y pagos automáticos de los duplicados se borran con ellos.
import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

const email = process.argv[2]
const apply = process.argv.includes("--apply")
if (!email || email.startsWith("--")) {
  console.error("Uso: node scripts/limpiar-duplicados-prueba.mjs <correo> [--apply]")
  process.exit(1)
}

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]
    }),
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (listError) throw listError
const user = list.users.find((u) => u.email === email)
if (!user) throw new Error(`No existe la cuenta ${email}`)

const { data: services, error } = await admin.from("user_services").select("*").eq("user_id", user.id).order("created_at")
if (error) throw error

const groups = new Map()
for (const s of services) {
  const key = `${s.service_type} · ${(s.provider ?? "sin proveedor").trim()}`
  groups.set(key, [...(groups.get(key) ?? []), s])
}
const duplicates = []
for (const [key, rows] of groups) {
  console.log(`${key.padEnd(36)} ${rows.length} registro(s)`)
  duplicates.push(...rows.slice(1))
}
console.log(`\n${services.length} servicios, ${duplicates.length} duplicados.`)

if (!apply) {
  if (duplicates.length) console.log("Nada se borró. Agrega --apply para respaldar y borrar los duplicados.")
  process.exit(0)
}
if (!duplicates.length) process.exit(0)

const dir = path.join("scripts", "respaldos")
fs.mkdirSync(dir, { recursive: true })
const backup = path.join(dir, `user_services_${user.id.slice(0, 8)}_${Date.now()}.json`)
fs.writeFileSync(backup, JSON.stringify(duplicates, null, 2))
console.log(`Respaldo: ${backup}`)

const { error: deleteError, count } = await admin
  .from("user_services")
  .delete({ count: "exact" })
  .eq("user_id", user.id)
  .in("id", duplicates.map((r) => r.id))
if (deleteError) throw deleteError
console.log(`Borrados: ${count}`)
