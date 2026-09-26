import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { runTool, TOOLS, DESTINATIONS } from '@/lib/ai/assistant'

/** Supabase falso: registra cada llamada del query builder y devuelve `result`. */
function fakeSupabase(result: { data: unknown; error: { message: string } | null }) {
  const calls: Array<[string, unknown[]]> = []
  const builder: Record<string, unknown> = {}
  for (const method of ['from', 'select', 'eq', 'order', 'limit', 'ilike']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args])
      return builder
    }
  }
  builder.then = (resolve: (value: typeof result) => void) => resolve(result)
  return { client: builder as unknown as SupabaseClient, calls }
}

describe('herramientas del asistente', () => {
  it('declara las cinco herramientas con esquema cerrado', () => {
    expect(TOOLS.map((t) => t.name)).toEqual([
      'listar_servicios',
      'historial_pagos',
      'pronostico_gastos',
      'alertas_recientes',
      'navegar',
    ])
    for (const tool of TOOLS) expect(tool.input_schema.additionalProperties).toBe(false)
  })

  it('rechaza herramientas desconocidas', async () => {
    const { client } = fakeSupabase({ data: [], error: null })
    const out = await runTool('borrar_todo', {}, client, 'u1')
    expect(out.isError).toBe(true)
  })

  it('valida la entrada antes de consultar', async () => {
    const { client, calls } = fakeSupabase({ data: [], error: null })
    const out = await runTool('historial_pagos', { limite: 500 }, client, 'u1')
    expect(out.isError).toBe(true)
    expect(calls).toHaveLength(0)
  })

  it('filtra el historial por el usuario y limpia comodines del filtro', async () => {
    const { client, calls } = fakeSupabase({ data: [{ amount: 486 }], error: null })
    const out = await runTool('historial_pagos', { limite: 5, servicio: 'luz%_' }, client, 'u1')
    expect(out.isError).toBeFalsy()
    expect(JSON.parse(out.content).pagos).toHaveLength(1)
    expect(calls).toContainEqual(['eq', ['user_id', 'u1']])
    expect(calls).toContainEqual(['limit', [5]])
    expect(calls).toContainEqual(['ilike', ['service_type', '%luz%']])
  })

  it('navegar devuelve un botón a una pantalla conocida', async () => {
    const { client } = fakeSupabase({ data: null, error: null })
    const out = await runTool('navegar', { destino: 'historial' }, client, 'u1')
    expect(out.action).toEqual({ type: 'navigate', ...DESTINATIONS.historial })
  })

  it('navegar no acepta rutas arbitrarias', async () => {
    const { client } = fakeSupabase({ data: null, error: null })
    const out = await runTool('navegar', { destino: '/admin' }, client, 'u1')
    expect(out.isError).toBe(true)
    expect(out.action).toBeUndefined()
  })

  it('reporta errores de la base de datos como error de herramienta', async () => {
    const { client } = fakeSupabase({ data: null, error: { message: 'permission denied' } })
    const out = await runTool('listar_servicios', {}, client, 'u1')
    expect(out.isError).toBe(true)
    expect(out.content).toContain('permission denied')
  })
})
