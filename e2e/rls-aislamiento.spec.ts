// e2e/rls-aislamiento.spec.ts — Dos cuentas reales: ninguna debe poder leer datos de la otra.
//
// Requiere dos usuarios de prueba en Supabase:
//   E2E_USER_A_EMAIL, E2E_USER_A_PASSWORD, E2E_USER_B_EMAIL, E2E_USER_B_PASSWORD
// Además de NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (se leen de .env.local).
// Sin esas variables la prueba se omite. Solo lee; no modifica datos.
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const env = process.env
const configured =
  env.NEXT_PUBLIC_SUPABASE_URL &&
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  env.E2E_USER_A_EMAIL &&
  env.E2E_USER_A_PASSWORD &&
  env.E2E_USER_B_EMAIL &&
  env.E2E_USER_B_PASSWORD

// Tablas con datos personales; todas deben filtrar por auth.uid().
const TABLES = [
  'transactions',
  'user_services',
  'alerts',
  'predictions',
  'pending_payments',
  'receipts',
  'ai_conversations',
  'ai_messages',
  'budgets',
  'reminders',
  'payment_profiles',
  'scheduled_payments',
  'autopay_runs',
]

async function signIn(email: string, password: string) {
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.user) throw new Error(`No se pudo iniciar sesión con ${email}: ${error?.message}`)
  return { client, userId: data.user.id }
}

test.describe('Aislamiento de datos entre usuarios (RLS)', () => {
  test.skip(!configured, 'Define E2E_USER_A_* y E2E_USER_B_* para correr esta prueba')

  let a: { client: SupabaseClient; userId: string }
  let b: { client: SupabaseClient; userId: string }

  test.beforeAll(async () => {
    a = await signIn(env.E2E_USER_A_EMAIL!, env.E2E_USER_A_PASSWORD!)
    b = await signIn(env.E2E_USER_B_EMAIL!, env.E2E_USER_B_PASSWORD!)
    expect(a.userId).not.toBe(b.userId)
  })

  for (const table of TABLES) {
    test(`A no ve filas de B en ${table}`, async () => {
      const { data, error } = await a.client.from(table).select('user_id').eq('user_id', b.userId).limit(5)
      // Si la tabla aún no existe (migración sin aplicar) no hay nada que filtrar.
      test.skip(Boolean(error && /does not exist|schema cache/i.test(error.message)), `${table} no existe todavía`)
      expect(error).toBeNull()
      expect(data ?? []).toHaveLength(0)
    })
  }

  test('A no puede leer archivos de recibos de B', async () => {
    const { data } = await a.client.storage.from('receipts').list(b.userId)
    expect(data ?? []).toHaveLength(0)
  })

  test('A no puede ver los miembros de un hogar ajeno', async () => {
    const { data: households } = await b.client.from('households').select('id').limit(1)
    test.skip(!households?.length, 'B no tiene hogares')
    const { data } = await a.client.rpc('get_household_members', { hid: households![0].id })
    expect(data ?? []).toHaveLength(0)
  })
})
