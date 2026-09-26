import type { NextRequest } from "next/server"

/** URL pública de la app: NEXT_PUBLIC_APP_URL o, si no existe, el host de la petición. */
export function resolveBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  const forwardedHost = req.headers.get("x-forwarded-host")
  if (forwardedHost) return `${req.headers.get("x-forwarded-proto") || "https"}://${forwardedHost}`
  return req.nextUrl.origin
}
