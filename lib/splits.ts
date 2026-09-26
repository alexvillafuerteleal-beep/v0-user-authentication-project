/**
 * Reparte un monto según porcentajes, en centavos, para que la suma de las partes sea
 * exactamente el total. Los centavos sobrantes del redondeo van a las primeras partes.
 */
export function splitAmounts(total: number, percentages: number[]): number[] {
  const cents = Math.round(total * 100)
  const raw = percentages.map((p) => (cents * p) / 100)
  const floored = raw.map(Math.floor)
  let remainder = cents - floored.reduce((a, b) => a + b, 0)
  // Primero a las partes con mayor fracción perdida.
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const { i } of order) {
    if (remainder <= 0) break
    floored[i]++
    remainder--
  }
  return floored.map((c) => c / 100)
}

/** Porcentajes iguales para n personas que suman exactamente 100. */
export function equalShares(n: number): number[] {
  const base = Math.floor((100 / n) * 100) / 100
  const shares = Array(n).fill(base)
  shares[0] = Math.round((100 - base * (n - 1)) * 100) / 100
  return shares
}
