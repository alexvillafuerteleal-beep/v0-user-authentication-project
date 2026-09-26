import { describe, it, expect } from 'vitest'
import { planAutopay, autopayChargesAllowed, type ScheduleRow, type ServiceRow, type PendingRow } from '@/lib/autopay'
import { normalizeMxPhone, maskPhone } from '@/lib/notifications/whatsapp'

const today = new Date(2026, 9, 10, 9) // 10 oct 2026
const U = 'user-a'
const service: ServiceRow = { id: 'svc-luz', user_id: U, service_type: 'electricity', provider: 'CFE' }
const schedule: ScheduleRow = { id: 'sch-1', user_id: U, user_service_id: 'svc-luz', max_amount: 800, days_before: 1, active: true }
const pending = (over: Partial<PendingRow> = {}): PendingRow => ({
  id: 'p-1',
  user_id: U,
  service_type: 'electricity',
  provider: 'CFE',
  amount: 486,
  due_date: '2026-10-11',
  status: 'pending',
  ...over,
})
const plan = (pendings: PendingRow[], opts: { schedules?: ScheduleRow[]; attempted?: string[] } = {}) =>
  planAutopay({
    schedules: opts.schedules ?? [schedule],
    services: [service],
    pendings,
    attempted: new Set(opts.attempted ?? []),
    today,
  })

describe('pagos automáticos', () => {
  it('cobra el recibo que vence dentro de la anticipación elegida', () => {
    const d = plan([pending()])
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ kind: 'charge', amount: 486 })
  })

  it('espera si el recibo vence después de la anticipación', () => {
    expect(plan([pending({ due_date: '2026-10-15' })])).toHaveLength(0)
  })

  it('no cobra si el monto pasa el tope', () => {
    expect(plan([pending({ amount: 950 })])[0].kind).toBe('over_limit')
  })

  it('no cobra montos menores al mínimo de Stripe', () => {
    expect(plan([pending({ amount: 9.5 })])[0].kind).toBe('too_small')
  })

  it('nunca intenta dos veces el mismo recibo', () => {
    expect(plan([pending()], { attempted: ['p-1'] })).toHaveLength(0)
  })

  it('ignora recibos muy vencidos, ya pagados o sin fecha', () => {
    expect(plan([pending({ due_date: '2026-09-30' })])).toHaveLength(0)
    expect(plan([pending({ status: 'paid' })])).toHaveLength(0)
    expect(plan([pending({ due_date: null })])).toHaveLength(0)
  })

  it('cobra un recibo vencido hace pocos días', () => {
    expect(plan([pending({ due_date: '2026-10-07' })])[0].kind).toBe('charge')
  })

  it('respeta servicio, proveedor, usuario y pausa', () => {
    expect(plan([pending({ service_type: 'water' })])).toHaveLength(0)
    expect(plan([pending({ provider: 'Otro' })])).toHaveLength(0)
    expect(plan([pending({ provider: 'cfe ' })])).toHaveLength(1)
    expect(plan([pending({ user_id: 'user-b' })])).toHaveLength(0)
    expect(plan([pending()], { schedules: [{ ...schedule, active: false }] })).toHaveLength(0)
  })

  it('un recibo no se asigna a dos pagos programados', () => {
    const dup: ScheduleRow = { ...schedule, id: 'sch-2' }
    expect(plan([pending()], { schedules: [schedule, dup] })).toHaveLength(1)
  })

  it('solo permite cargos con llaves de prueba salvo que se autorice modo real', () => {
    expect(autopayChargesAllowed('sk_test_123', undefined)).toBe(true)
    expect(autopayChargesAllowed('sk_live_123', undefined)).toBe(false)
    expect(autopayChargesAllowed('sk_live_123', 'true')).toBe(true)
    expect(autopayChargesAllowed(undefined, 'true')).toBe(false)
  })
})

describe('teléfonos para WhatsApp', () => {
  it('normaliza formatos mexicanos comunes', () => {
    expect(normalizeMxPhone('55 1234 5678')).toBe('525512345678')
    expect(normalizeMxPhone('+52 (55) 1234-5678')).toBe('525512345678')
    expect(normalizeMxPhone('5215512345678')).toBe('525512345678')
    expect(normalizeMxPhone('0052 55 1234 5678')).toBe('525512345678')
  })

  it('rechaza números incompletos o extranjeros', () => {
    expect(normalizeMxPhone('12345')).toBeNull()
    expect(normalizeMxPhone('+1 415 555 0100 22')).toBeNull()
    expect(normalizeMxPhone('')).toBeNull()
    expect(normalizeMxPhone(null)).toBeNull()
  })

  it('enmascara el número para mostrarlo', () => {
    expect(maskPhone('525512345678')).toBe('+52 •••• 5678')
  })
})
