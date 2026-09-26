/**
 * user_services.due_date guarda el día del mes (p. ej. 12). Estas funciones lo convierten
 * en fechas concretas; también aceptan una fecha ISO completa.
 */

const lastDayOfMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

/** Fecha de vencimiento dentro de un mes dado (0 = enero). El día 31 se ajusta al último día del mes. */
export function dueDateInMonth(dueDay: number, year: number, month: number) {
  return new Date(year, month, Math.min(dueDay, lastDayOfMonth(year, month)))
}

export function parseDueDay(value: unknown): number | null {
  if (typeof value === "number" && value >= 1 && value <= 31) return Math.trunc(value)
  if (typeof value === "string") {
    if (/^\d{1,2}$/.test(value)) return parseDueDay(Number(value))
    const d = new Date(`${value.slice(0, 10)}T12:00:00`)
    if (!Number.isNaN(d.getTime())) return d.getDate()
  }
  return null
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Próximo vencimiento a partir de hoy (incluye hoy). */
export function nextDueDate(dueDay: number, today = new Date()) {
  const t = startOfDay(today)
  const thisMonth = dueDateInMonth(dueDay, t.getFullYear(), t.getMonth())
  return thisMonth >= t ? thisMonth : dueDateInMonth(dueDay, t.getFullYear(), t.getMonth() + 1)
}

/** Días completos entre hoy y la fecha (negativo si ya pasó). */
export function daysUntil(date: Date, today = new Date()) {
  return Math.round((startOfDay(date).getTime() - startOfDay(today).getTime()) / 86_400_000)
}

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
