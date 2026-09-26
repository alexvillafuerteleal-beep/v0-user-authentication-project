import { describe, it, expect } from 'vitest'
import { splitAmounts, equalShares } from '@/lib/splits'

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100

describe('división de pagos', () => {
  it('las partes siempre suman el total exacto', () => {
    const parts = splitAmounts(100, equalShares(3))
    expect(sum(parts)).toBe(100)
    expect(parts).toEqual([33.34, 33.33, 33.33])
  })

  it('respeta porcentajes distintos', () => {
    expect(splitAmounts(486, [50, 30, 20])).toEqual([243, 145.8, 97.2])
  })

  it('reparte centavos sobrantes sin perder ni inventar dinero', () => {
    const parts = splitAmounts(0.1, equalShares(3))
    expect(sum(parts)).toBe(0.1)
  })

  it('los porcentajes iguales suman 100', () => {
    for (const n of [2, 3, 4, 6, 7]) expect(sum(equalShares(n))).toBe(100)
  })
})
