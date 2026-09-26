import { describe, it, expect } from 'vitest'
import { normalizeExtraction, confidenceOf, ReceiptSchema, type ReceiptExtraction } from '@/lib/ai/receipt'

const base: ReceiptExtraction = {
  es_recibo: true,
  proveedor: 'CFE',
  tipo_servicio: 'electricity',
  numero_servicio_ultimos4: '1234',
  periodo_inicio: '2026-07-15',
  periodo_fin: '2026-09-13',
  fecha_limite: '2026-10-12',
  total: 486,
  consumo: 312,
  unidad_consumo: 'kWh',
  campos_dudosos: [],
}

describe('extracción de recibos', () => {
  it('conserva un recibo bien leído', () => {
    expect(normalizeExtraction(base)).toEqual(base)
    expect(confidenceOf(base)).toBe(1)
  })

  it('guarda solo los últimos 4 dígitos aunque el modelo devuelva el número completo', () => {
    const out = normalizeExtraction({ ...base, numero_servicio_ultimos4: '5431 0998 7766' })
    expect(out.numero_servicio_ultimos4).toBe('7766')
  })

  it('descarta fechas con otro formato o imposibles', () => {
    const out = normalizeExtraction({ ...base, fecha_limite: '12/10/2026', periodo_fin: '2026-13-40' })
    expect(out.fecha_limite).toBeNull()
    expect(out.periodo_fin).toBeNull()
  })

  it('descarta montos negativos y redondea a centavos', () => {
    expect(normalizeExtraction({ ...base, total: -20 }).total).toBeNull()
    expect(normalizeExtraction({ ...base, total: 486.456 }).total).toBe(486.46)
  })

  it('baja la confianza por cada campo dudoso', () => {
    expect(confidenceOf({ ...base, campos_dudosos: ['total', 'fecha_limite'] })).toBe(0.75)
  })

  it('el esquema rechaza tipos de servicio desconocidos', () => {
    expect(ReceiptSchema.safeParse({ ...base, tipo_servicio: 'cable' }).success).toBe(false)
  })
})
