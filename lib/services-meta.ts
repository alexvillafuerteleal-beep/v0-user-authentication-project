/** Nombre visible de cada tipo de servicio guardado en la base de datos. */
export const SERVICE_LABELS: Record<string, string> = {
  electricity: "Luz",
  water: "Agua",
  gas: "Gas",
  internet: "Internet",
  phone: "Teléfono",
  tv: "TV",
  other: "Otro",
}

export const serviceLabel = (type: string | null | undefined) => (type ? (SERVICE_LABELS[type] ?? type) : "Servicio")

export const formatMXN = (n: number | null | undefined, decimals = 2) =>
  n == null ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: decimals, maximumFractionDigits: decimals })
