import { describe, it, expect } from 'vitest'
import { forecastNext, detectAnomaly, groupByPeriod, periodKey, mape, type PeriodAmount } from '@/lib/forecast'

const series = (amounts: number[]): PeriodAmount[] => amounts.map((amount, i) => ({ period: `p${i}`, amount }))

describe('periodos de facturación', () => {
  it('CFE usa bimestres y el resto meses', () => {
    expect(periodKey('electricity', new Date(2026, 8, 20))).toBe('2026-B5')
    expect(periodKey('water', new Date(2026, 8, 20))).toBe('2026-09')
  })

  it('suma pagos del mismo periodo y ordena del más viejo al más nuevo', () => {
    const out = groupByPeriod('water', [
      { amount: 100, date: '2026-09-02T12:00:00' },
      { amount: 50, date: '2026-09-20T12:00:00' },
      { amount: 80, date: '2026-08-10T12:00:00' },
    ])
    expect(out).toEqual([
      { period: '2026-08', amount: 80 },
      { period: '2026-09', amount: 150 },
    ])
  })
})

describe('pronóstico', () => {
  it('sin datos devuelve cero con confianza cero', () => {
    expect(forecastNext([])).toMatchObject({ predicted: 0, confidence: 0, method: 'sin-datos' })
  })

  it('con menos de 3 periodos usa el promedio y un intervalo de ±20%', () => {
    expect(forecastNext(series([400, 600]))).toMatchObject({ predicted: 500, lower: 400, upper: 600, method: 'promedio' })
  })

  it('pondera más el periodo más reciente', () => {
    // 0.5·300 + 0.3·200 + 0.2·100 = 230
    expect(forecastNext(series([100, 200, 300])).predicted).toBe(230)
  })

  it('un consumo estable da un intervalo angosto y confianza alta', () => {
    const f = forecastNext(series([500, 505, 498, 502, 499, 501]))
    expect(f.predicted).toBeGreaterThan(495)
    expect(f.predicted).toBeLessThan(505)
    expect(f.upper - f.lower).toBeLessThan(60)
    expect(f.confidence).toBeGreaterThan(0.9)
  })

  it('aplica la estacionalidad del mismo periodo del año anterior', () => {
    // Mensual: el mes 12 (índice 12) repite el pico del mes 0 del año anterior.
    const year1 = [900, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400]
    const f = forecastNext(series([...year1, 400, 400, 400]), 12)
    expect(f.method).toBe('ponderado-estacional')
  })

  it('nunca pronostica un límite inferior negativo', () => {
    expect(forecastNext(series([10, 500, 20, 800, 5])).lower).toBeGreaterThanOrEqual(0)
  })
})

describe('anomalías', () => {
  const history = series([480, 500, 510, 495, 505])

  it('marca un recibo muy por arriba de lo normal', () => {
    const a = detectAnomaly(history, 900)
    expect(a.isAnomaly).toBe(true)
    expect(a.changePct).toBeGreaterThan(50)
  })

  it('no marca un recibo dentro de lo normal', () => {
    expect(detectAnomaly(history, 502).isAnomaly).toBe(false)
  })

  it('no marca nada con menos de 3 periodos', () => {
    expect(detectAnomaly(series([100, 110]), 1000).isAnomaly).toBe(false)
  })
})

describe('MAPE', () => {
  it('promedia el error porcentual absoluto', () => {
    expect(mape([{ predicted: 90, actual: 100 }, { predicted: 110, actual: 100 }])).toBe(10)
  })

  it('ignora periodos sin monto real', () => {
    expect(mape([{ predicted: 90, actual: 0 }])).toBeNull()
  })
})
